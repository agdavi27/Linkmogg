"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { adminSettings, db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/outreach/core";
import { cleanupDiscovery, processCandidate, queueHandles, runDiscovery } from "@/lib/instagram/discovery";
import { hostList, normalizeHandle } from "@/lib/instagram/parse";

function flash(msg: string): never {
  redirect(`/admin/discovery?msg=${encodeURIComponent(msg)}`);
}

export async function saveDiscoveryAction(form: FormData) {
  await requireAdmin();
  await getSettings();
  const num = (k: string, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(form.get(k)) || 0)));
  const lines = (k: string, max: number) => String(form.get(k) ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, max).join("\n");
  const minF = num("discoveryMinFollowers", 0, 100_000_000), maxF = num("discoveryMaxFollowers", 0, 1_000_000_000);
  await db.update(adminSettings).set({
    discoveryEnabled: form.get("discoveryEnabled") === "on",
    discoverySeeds: lines("discoverySeeds", 200),
    discoveryMinFollowers: Math.min(minF, maxF),
    discoveryMaxFollowers: Math.max(minF, maxF),
    discoveryMinReels: num("discoveryMinReels", 1, 6),
    discoveryMaxDepth: num("discoveryMaxDepth", 0, 6),
    discoveryLookupsPerRun: num("discoveryLookupsPerRun", 1, 180),
    igCallsPerHour: num("igCallsPerHour", 10, 190),
    discoveryLinkHosts: hostList(String(form.get("discoveryLinkHosts") ?? "")).slice(0, 10).join("\n") || "linktr.ee",
    searchQueries: lines("searchQueries", 20),
    updatedAt: new Date(),
  }).where(eq(adminSettings.id, 1));
  flash("Discovery settings saved.");
}

/** Typed-in handles: you've chosen these people, so they skip the follower and Linktree rules. Up to 10 run right away. */
export async function addHandlesAction(form: FormData) {
  await requireAdmin();
  const handles = [...new Set(String(form.get("handles") ?? "").split(/[\s,]+/).map(normalizeHandle).filter((h): h is string => !!h))].slice(0, 200);
  const queued = await queueHandles(handles, "handle");
  if (!queued) flash("No new handles there. They may already be queued or looked up.");
  const s = await getSettings();
  let built = 0, done = 0;
  try {
    for (const h of handles.slice(0, 10)) {
      const r = await processCandidate(h, s);
      if (r.status !== "missing") done++;
      if (r.status === "qualified") built++;
    }
  } catch (e) {
    flash(`Queued ${queued}. Stopped early: ${(e as Error).message}`);
  }
  flash(`Queued ${queued}, looked up ${done} now, built ${built} ${built === 1 ? "preview" : "previews"}. The rest run with the daily job.`);
}

export async function runNowAction() {
  await requireAdmin();
  const r = await runDiscovery({ force: true, limit: 20 });
  if ("skipped" in r) flash(r.skipped);
  await cleanupDiscovery();
  flash(`Looked up ${r.looked}: ${r.qualified} new previews, ${r.rejected} skipped${r.errors ? `, ${r.errors} errors` : ""}.${r.stopped ? ` Stopped: ${r.stopped}` : ""}`);
}

export async function disconnectAction() {
  await requireAdmin();
  await db.update(adminSettings).set({ igUserId: null, igUsername: null, igTokenEnc: null, igTokenExpiresAt: null, updatedAt: new Date() }).where(eq(adminSettings.id, 1));
  flash("Disconnected. Discovery stops until you connect again.");
}
