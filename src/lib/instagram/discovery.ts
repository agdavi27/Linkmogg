import "server-only";
import { and, asc, eq, isNull, lt, notInArray, sql } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import { db, igCalls, igCandidates, prospects, type AdminSettings, type Prospect } from "@/lib/db";
import { randomToken } from "@/lib/auth";
import { advance, getSettings, logEvent, pickTheme } from "@/lib/outreach/core";
import { handleHash, isSuppressed } from "@/lib/outreach/suppress";
import { IgError, lookup } from "./client";
import { bioEmail, extractMentions, hostList, normalizeHandle, pickReels, qualify, slugFromLinkInBio, type IgProfile } from "./parse";
import { searchLinkInBioUrls } from "./search";

const MAX_REELS = 6;
const MAX_REEL_BYTES = 40 * 1024 * 1024;
const KEEP_UNCLAIMED_DAYS = 30;

export type Source = "seed" | "handle" | "snowball" | "search";

/** Queues handles for a lookup. Existing ones are left as they are. */
export async function queueHandles(handles: string[], source: Source, from: string | null = null, depth = 0) {
  const clean = [...new Set(handles.map(normalizeHandle).filter((h): h is string => !!h))];
  if (!clean.length) return 0;
  const rows = await db.insert(igCandidates).values(clean.map((handle) => ({ handle, source, discoveredFrom: from, depth })))
    .onConflictDoNothing().returning({ handle: igCandidates.handle });
  return rows.length;
}

function rules(s: AdminSettings) {
  return { hosts: hostList(s.discoveryLinkHosts), minFollowers: s.discoveryMinFollowers, maxFollowers: s.discoveryMaxFollowers, minReels: s.discoveryMinReels };
}

async function setCandidate(handle: string, status: "qualified" | "rejected" | "error", reason: string | null) {
  await db.update(igCandidates).set({ status, reason, checkedAt: new Date() }).where(eq(igCandidates.handle, handle));
}

/** Looks one handle up, queues the people it mentions, and builds a preview if it fits. */
export async function processCandidate(handle: string, settings?: AdminSettings): Promise<{ status: string; reason?: string; prospectId?: string }> {
  const s = settings ?? (await getSettings());
  const [c] = await db.select().from(igCandidates).where(eq(igCandidates.handle, handle)).limit(1);
  if (!c) return { status: "missing" };
  if (await isSuppressed([handleHash("instagram", handle)])) { await setCandidate(handle, "rejected", "asked not to be contacted"); return { status: "rejected", reason: "suppressed" }; }

  let profile: IgProfile | null;
  try { profile = await lookup(handle); } catch (e) {
    if (e instanceof IgError && (e.kind === "limit" || e.kind === "token")) throw e; // stop the run, try again later
    await setCandidate(handle, "error", (e as Error).message.slice(0, 300));
    return { status: "error", reason: (e as Error).message };
  }
  if (!profile) { await setCandidate(handle, "rejected", "not visible: personal, private or gone"); return { status: "rejected", reason: "not visible" }; }

  // snowball: everyone this account mentions becomes a candidate one hop further out
  if (c.depth < s.discoveryMaxDepth) {
    const mentioned = extractMentions(profile.media.map((m) => m.caption), [handle, s.igUsername ?? ""]);
    await queueHandles(mentioned, "snowball", handle, c.depth + 1);
  }

  const [existing] = await db.select({ id: prospects.id }).from(prospects).where(and(eq(prospects.platform, "instagram"), eq(prospects.handle, handle))).limit(1);
  if (existing) { await setCandidate(handle, "qualified", "already a prospect"); return { status: "qualified", prospectId: existing.id }; }

  // typed in by hand: you've already decided you want them, so only "has reels" matters
  const verdict = c.source === "handle"
    ? (pickReels(profile.media).length ? { ok: true as const } : { ok: false as const, reason: "no reels" })
    : qualify(profile, rules(s));
  if (verdict.ok && c.source === "search" && c.discoveredFrom && !(profile.website ?? "").toLowerCase().includes(c.discoveredFrom.toLowerCase())) {
    await setCandidate(handle, "rejected", "Instagram handle doesn't match that Linktree");
    return { status: "rejected", reason: "mismatch" };
  }
  if (!verdict.ok) { await setCandidate(handle, "rejected", verdict.reason); return { status: "rejected", reason: verdict.reason }; }

  const id = await createProspect(profile, c.source as Source, c.discoveredFrom, s);
  await setCandidate(handle, "qualified", null);
  return { status: "qualified", prospectId: id ?? undefined };
}

async function createProspect(p: IgProfile, source: Source, from: string | null, s: AdminSettings) {
  const email = bioEmail(p.biography);
  const profileUrl = `https://www.instagram.com/${p.username}/`;
  const [row] = await db.insert(prospects).values({
    platform: "instagram", handle: p.username, sourceUrl: null, displayName: p.name || null, bio: (p.biography ?? "").slice(0, 300) || null,
    avatarUrl: p.profile_picture_url ?? null, email,
    links: p.website ? [{ title: "All my links", url: p.website }] : [],
    socials: [{ platform: "instagram", url: profileUrl }],
    claimToken: randomToken(18), source, discoveredFrom: from, igFollowers: p.followers_count ?? null, igWebsite: p.website ?? null, igCheckedAt: new Date(),
  }).onConflictDoNothing().returning();
  if (!row) return null;
  await logEvent(row.id, "discovered", { source, from });
  const reels = await copyReels(row.id, pickReels(p.media, MAX_REELS));
  const themeId = reels.length ? "reels" : pickTheme(s.defaultPreviewTheme);
  await db.update(prospects).set({ igReels: reels, themeId, updatedAt: new Date() }).where(eq(prospects.id, row.id));
  await advance(row, "preview_built");
  await logEvent(row.id, "preview_generated", { theme: themeId, reels: reels.length, source });
  return row.id;
}

/**
 * Instagram's video links expire, so the preview plays our own copies.
 * Clips are stored as Instagram serves them (already compressed for phones), capped at 40 MB each.
 */
async function copyReels(prospectId: string, reels: { id: string; media_url?: string }[]): Promise<string[]> {
  const out: string[] = [];
  for (const r of reels) {
    if (!r.media_url) continue;
    if (r.media_url.startsWith("/")) { out.push(r.media_url); continue; } // mock accounts use the site's own clips
    if (!process.env.BLOB_READ_WRITE_TOKEN) break;
    try {
      const res = await fetch(r.media_url, { signal: AbortSignal.timeout(30000) });
      const size = Number(res.headers.get("content-length") ?? 0);
      if (!res.ok || !res.body || size > MAX_REEL_BYTES) continue;
      const blob = await put(`reels/prospects/${prospectId}/${r.id.replace(/[^\w-]/g, "")}.mp4`, res.body, {
        access: "public", contentType: "video/mp4", addRandomSuffix: true,
      });
      out.push(blob.url);
    } catch { /* skip that clip */ }
  }
  return out;
}

/** Turns search results for each saved query into candidates. The slug is checked against the account's own bio link. */
export async function seedFromSearch(s: AdminSettings) {
  const hosts = hostList(s.discoveryLinkHosts);
  const queries = s.searchQueries.split("\n").map((q) => q.trim()).filter(Boolean).slice(0, 5);
  let queued = 0;
  for (const q of queries) {
    for (const host of hosts.slice(0, 2)) {
      const urls = await searchLinkInBioUrls(q, host).catch(() => []);
      for (const u of urls) {
        const slug = slugFromLinkInBio(u, hosts);
        if (slug) queued += await queueHandles([slug], "search", slug, 1);
      }
    }
  }
  return queued;
}

/** The daily run: seeds, optional search, then as many lookups as the budget allows. */
export async function runDiscovery(opts: { force?: boolean; limit?: number } = {}) {
  const s = await getSettings();
  if (!s.discoveryEnabled && !opts.force) return { skipped: "discovery is off" as const };
  const seeded = await queueHandles(s.discoverySeeds.split(/[\n,]+/), "seed");
  const searched = await seedFromSearch(s);
  const pending = await db.select({ handle: igCandidates.handle }).from(igCandidates)
    .where(eq(igCandidates.status, "pending")).orderBy(asc(igCandidates.depth), asc(igCandidates.createdAt)).limit(opts.limit ?? s.discoveryLookupsPerRun);
  const tally = { seeded, searched, looked: 0, qualified: 0, rejected: 0, errors: 0, stopped: null as string | null };
  for (const { handle } of pending) {
    try {
      const r = await processCandidate(handle, s);
      tally.looked++;
      if (r.status === "qualified") tally.qualified++; else if (r.status === "rejected") tally.rejected++; else tally.errors++;
    } catch (e) {
      tally.stopped = (e as Error).message;
      break;
    }
  }
  return tally;
}

/**
 * Privacy clean-up. Stored reels are removed for anyone who opted out, and for previews
 * nobody claimed within 30 days. Claimed pages keep theirs. Old call-count rows are trimmed too.
 */
export async function cleanupDiscovery() {
  const cutoff = new Date(Date.now() - KEEP_UNCLAIMED_DAYS * 86400_000);
  const stale: Prospect[] = await db.select().from(prospects).where(and(
    sql`jsonb_array_length(${prospects.igReels}) > 0`,
    isNull(prospects.claimedUserId),
    sql`(${prospects.status} in ('unsubscribed','removed') or ${prospects.createdAt} < ${cutoff})`,
  ));
  let removed = 0;
  for (const p of stale) {
    const blobs = p.igReels.filter((u) => u.startsWith("https://"));
    if (blobs.length && process.env.BLOB_READ_WRITE_TOKEN) await del(blobs).catch(() => {});
    await db.update(prospects).set({ igReels: [], updatedAt: new Date() }).where(eq(prospects.id, p.id));
    await logEvent(p.id, "reels_deleted", { count: p.igReels.length });
    removed++;
  }
  await db.delete(igCalls).where(lt(igCalls.at, new Date(Date.now() - 2 * 86400_000)));
  return { removed };
}

export async function candidateCounts() {
  const rows = await db.select({ status: igCandidates.status, n: sql<number>`count(*)::int` }).from(igCandidates).groupBy(igCandidates.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<Record<"pending" | "qualified" | "rejected" | "error", number>>;
}

export async function recentCandidates(limit = 40) {
  return db.select().from(igCandidates).where(notInArray(igCandidates.status, ["pending"])).orderBy(sql`${igCandidates.checkedAt} desc nulls last`).limit(limit);
}

