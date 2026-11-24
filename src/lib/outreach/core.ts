import "server-only";
import { and, asc, eq, gte, isNotNull, isNull, notInArray, sql } from "drizzle-orm";
import {
  adminSettings, db, outreachMessages, prospectEvents, prospects, type AdminSettings, type Prospect,
} from "@/lib/db";
import { randomToken } from "@/lib/auth";
import { appUrl } from "@/lib/config";
import { escapeHtml, sendEmail, simpleHtml } from "@/lib/email";
import { THEMES } from "@/themes/registry";
import { FetchBlocked, fetchPublicPage, sleep } from "./fetch";
import { parseLinkInBio } from "./parse";
import { emailHash, handleHash, isSuppressed, unsubscribeToken } from "./suppress";

export async function getSettings(): Promise<AdminSettings> {
  const [s] = await db.select().from(adminSettings).where(eq(adminSettings.id, 1)).limit(1);
  if (s) return s;
  const [created] = await db.insert(adminSettings).values({ id: 1 }).onConflictDoNothing().returning();
  return created ?? (await db.select().from(adminSettings).where(eq(adminSettings.id, 1)))[0];
}

export async function logEvent(prospectId: string, type: string, meta: Record<string, unknown> = {}) {
  await db.insert(prospectEvents).values({ prospectId, type, meta });
}

const STAGE_ORDER = ["discovered", "preview_built", "contacted", "opened", "clicked", "claimed", "trial", "paid"] as const;
/** Moves a prospect forward in the funnel; never backwards. */
export async function advance(p: Pick<Prospect, "id" | "status">, to: (typeof STAGE_ORDER)[number]) {
  const cur = STAGE_ORDER.indexOf(p.status as (typeof STAGE_ORDER)[number]);
  if (cur === -1 || STAGE_ORDER.indexOf(to) <= cur) return;
  await db.update(prospects).set({ status: to, updatedAt: new Date() }).where(eq(prospects.id, p.id));
  await logEvent(p.id, to);
}

export function pickTheme(setting: string) {
  const pro = THEMES.filter((t) => t.pro);
  if (setting && setting !== "random" && THEMES.some((t) => t.id === setting)) return setting;
  return pro[Math.floor(Math.random() * pro.length)].id;
}

export function profileUrl(platform: string, handle: string) {
  const h = handle.replace(/^@/, "");
  const map: Record<string, string> = {
    instagram: `https://www.instagram.com/${h}/`, tiktok: `https://www.tiktok.com/@${h}`, x: `https://x.com/${h}`,
    youtube: `https://www.youtube.com/@${h}`, threads: `https://www.threads.net/@${h}`, twitch: `https://www.twitch.tv/${h}`,
    snapchat: `https://www.snapchat.com/add/${h}`, pinterest: `https://www.pinterest.com/${h}/`, bluesky: `https://bsky.app/profile/${h}`,
  };
  return map[platform] ?? `https://www.google.com/search?q=${encodeURIComponent(`${platform} ${h}`)}`;
}

import type { ImportRow } from "./import-parse";
export type { ImportRow };

/** Inserts prospects, skipping suppressed people and duplicates. Returns ids of new rows. */
export async function importProspects(rows: ImportRow[], batchId: string | null) {
  const created: string[] = [];
  let skipped = 0;
  for (const r of rows) {
    const handle = r.handle.trim().replace(/^@/, "").toLowerCase();
    if (!handle) { skipped++; continue; }
    const hashes = [handleHash(r.platform, handle), ...(r.email ? [emailHash(r.email)] : [])];
    if (await isSuppressed(hashes)) { skipped++; continue; }
    const [row] = await db.insert(prospects).values({
      platform: r.platform, handle, sourceUrl: r.sourceUrl ?? null, email: r.email?.toLowerCase() ?? null,
      displayName: r.name ?? null, claimToken: randomToken(18), importBatchId: batchId,
    }).onConflictDoNothing().returning({ id: prospects.id });
    if (row) { created.push(row.id); await logEvent(row.id, "discovered"); } else skipped++;
  }
  return { created, skipped };
}

/** Fetches the prospect's public link-in-bio page, parses it, and builds their preview. */
export async function buildPreview(id: string, opts: { theme?: string } = {}) {
  const [p] = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  if (!p) return { ok: false as const, error: "Not found" };
  const settings = await getSettings();
  // a preview built from Instagram keeps its Reels theme unless you pick another
  const themeId = opts.theme ? pickTheme(opts.theme) : p.igReels.length ? "reels" : p.themeId ?? pickTheme(settings.defaultPreviewTheme);
  if (!p.sourceUrl) {
    // Manual prospect: build from whatever was entered by hand.
    await db.update(prospects).set({ themeId, updatedAt: new Date(), lastError: null }).where(eq(prospects.id, id));
    await advance(p, "preview_built");
    return { ok: true as const };
  }
  try {
    const { url, html } = await fetchPublicPage(p.sourceUrl);
    const parsed = parseLinkInBio(html, url);
    if (!parsed.links.length && !parsed.socials.length) throw new Error("No links found on that page.");
    const email = p.email ?? parsed.email;
    await db.update(prospects).set({
      displayName: p.displayName ?? parsed.displayName ?? p.handle,
      bio: parsed.bio, avatarUrl: parsed.avatarUrl, links: parsed.links, socials: parsed.socials,
      email, themeId, lastError: null, updatedAt: new Date(),
    }).where(eq(prospects.id, id));
    await advance(p, "preview_built");
    await logEvent(id, "preview_generated", { theme: themeId, links: parsed.links.length });
    return { ok: true as const };
  } catch (e) {
    const msg = e instanceof FetchBlocked ? e.message : `Couldn't read the page: ${(e as Error).message}`;
    await db.update(prospects).set({ lastError: msg, updatedAt: new Date() }).where(eq(prospects.id, id));
    return { ok: false as const, error: msg };
  }
}

/** Builds previews for prospects still waiting, one at a time with a polite delay. */
export async function buildPendingPreviews(limit = 10) {
  const settings = await getSettings();
  const pending = await db.select({ id: prospects.id }).from(prospects)
    .where(and(eq(prospects.status, "discovered"), isNull(prospects.lastError)))
    .orderBy(asc(prospects.createdAt)).limit(limit);
  let built = 0;
  for (const [i, p] of pending.entries()) {
    if (i > 0) await sleep(settings.fetchDelayMs);
    if ((await buildPreview(p.id)).ok) built++;
  }
  return { built, tried: pending.length };
}

export function claimUrl(p: Pick<Prospect, "claimToken">, messageId?: string) {
  return `${appUrl()}/claim/${p.claimToken}${messageId ? `?m=${messageId}` : ""}`;
}
export function removeUrl(p: Pick<Prospect, "claimToken">) {
  return `${appUrl()}/claim/${p.claimToken}/remove`;
}

export function fill(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

function firstName(p: Prospect) {
  const n = (p.displayName ?? "").trim();
  return n ? n.split(/\s+/)[0] : `@${p.handle}`;
}

export function dmText(p: Prospect, settings: AdminSettings) {
  return fill(settings.dmTemplate, { name: firstName(p), handle: `@${p.handle}`, preview_link: claimUrl(p), remove_link: removeUrl(p) });
}

function startOfDay() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function sentToday(channel: "email" | "dm") {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(outreachMessages)
    .where(and(eq(outreachMessages.channel, channel), gte(outreachMessages.sentAt, startOfDay())));
  return n;
}

/** Sends one outreach email. Caller is responsible for caps. */
export async function sendOutreachEmail(p: Prospect, settings: AdminSettings) {
  if (!p.email) return { ok: false as const, error: "No public email on file." };
  if (await isSuppressed([emailHash(p.email), handleHash(p.platform, p.handle)])) {
    return { ok: false as const, error: "This person is on the suppression list." };
  }
  if (!settings.physicalAddress.trim()) return { ok: false as const, error: "Add your mailing address in admin settings first (required by CAN-SPAM)." };
  const [msg] = await db.insert(outreachMessages).values({
    prospectId: p.id, channel: "email", status: "queued", toAddress: p.email, subject: settings.emailSubject, body: "",
  }).returning();
  const unsubQuery = `e=${encodeURIComponent(p.email)}&t=${unsubscribeToken(p.email)}`;
  const unsub = `${appUrl()}/unsubscribe?${unsubQuery}`;
  const vars = { name: firstName(p), handle: `@${p.handle}`, preview_link: claimUrl(p, msg.id), remove_link: removeUrl(p) };
  const text = fill(settings.emailTemplate, vars);
  const footer = `You're getting this one-time note because your link-in-bio page lists this address publicly. ${settings.senderName}, ${settings.physicalAddress}. Unsubscribe: ${unsub}`;
  const htmlBody = text.split(/\n{2,}/).map((para) => {
    let h = escapeHtml(para).replace(/\n/g, "<br>");
    for (const [k, v] of Object.entries({ preview_link: vars.preview_link, remove_link: vars.remove_link })) {
      const label = k === "preview_link" ? escapeHtml(v) : "remove my preview";
      h = h.split(escapeHtml(v)).join(`<a href="${escapeHtml(v)}" style="color:#b8360f">${label}</a>`);
    }
    return h;
  });
  try {
    const from = process.env.OUTREACH_FROM ?? process.env.EMAIL_FROM;
    const { id } = await sendEmail({
      to: p.email,
      from: from ? (from.includes("<") ? from : `${settings.senderName} <${from}>`) : undefined,
      replyTo: process.env.OUTREACH_REPLY_TO || undefined,
      subject: settings.emailSubject,
      text: `${text}\n\n--\n${footer}`,
      html: simpleHtml(htmlBody, `You're getting this one-time note because your link-in-bio page lists this address publicly.<br>${escapeHtml(settings.senderName)}, ${escapeHtml(settings.physicalAddress)}<br><a href="${escapeHtml(unsub)}" style="color:#6b6b6b">Unsubscribe</a>`),
      headers: { "List-Unsubscribe": `<${appUrl()}/api/unsubscribe?${unsubQuery}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      tags: [{ name: "kind", value: "outreach" }],
    });
    await db.update(outreachMessages).set({ status: "sent", resendId: id, body: text, sentAt: new Date() }).where(eq(outreachMessages.id, msg.id));
    await advance(p, "contacted");
    await logEvent(p.id, "email_sent", { messageId: msg.id });
    return { ok: true as const };
  } catch (e) {
    await db.update(outreachMessages).set({ status: "failed", error: (e as Error).message, body: text }).where(eq(outreachMessages.id, msg.id));
    return { ok: false as const, error: (e as Error).message };
  }
}

/** One throttled run: respects pause, the daily cap and the per-run cap. */
export async function runEmailBatch() {
  const settings = await getSettings();
  if (settings.paused) return { sent: 0, reason: "Outreach is paused." };
  const remaining = Math.min(settings.perRunEmailCap, settings.dailyEmailCap - (await sentToday("email")));
  if (remaining <= 0) return { sent: 0, reason: "Daily email cap reached." };
  const alreadyEmailed = db.select({ id: outreachMessages.prospectId }).from(outreachMessages)
    .where(and(eq(outreachMessages.channel, "email"), notInArray(outreachMessages.status, ["failed", "skipped"])));
  const candidates = await db.select().from(prospects)
    .where(and(eq(prospects.status, "preview_built"), isNotNull(prospects.email), notInArray(prospects.id, alreadyEmailed)))
    .orderBy(asc(prospects.createdAt)).limit(remaining);
  let sent = 0;
  const errors: string[] = [];
  for (const [i, p] of candidates.entries()) {
    if (i > 0) await sleep(1200); // gentle pacing inside a run
    const r = await sendOutreachEmail(p, settings);
    if (r.ok) sent++; else errors.push(`@${p.handle}: ${r.error}`);
    if (!r.ok && r.error.includes("mailing address")) break;
  }
  return { sent, reason: errors[0] ?? (candidates.length ? undefined : "Nobody is waiting for an email.") };
}

