"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { adminSettings, db, importBatches, outreachMessages, prospects } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import {
  advance, buildPendingPreviews, buildPreview, getSettings, importProspects, logEvent, runEmailBatch, sendOutreachEmail, sentToday, dmText,
} from "@/lib/outreach/core";
import { emailHash, handleHash, suppress } from "@/lib/outreach/suppress";
import { normalizeUrl } from "@/lib/socials/detect";
import { EMAIL_RE, PLATFORMS, parseImport } from "@/lib/outreach/import-parse";


function flash(path: string, msg: string): never {
  redirect(`${path}${path.includes("?") ? "&" : "?"}msg=${encodeURIComponent(msg)}`);
}

export async function importAction(form: FormData) {
  await requireAdmin();
  const platform = PLATFORMS.includes(String(form.get("platform"))) ? String(form.get("platform")) : "instagram";
  let text = String(form.get("text") ?? "");
  const file = form.get("file");
  if (file instanceof File && file.size) text = `${await file.text()}\n${text}`;
  const rows = parseImport(text, platform);
  if (!rows.length) flash("/admin/prospects/import", "Nothing to import. Check the format below.");
  const [batch] = await db.insert(importBatches).values({ source: file instanceof File && file.size ? "csv" : "paste", rowCount: rows.length }).returning();
  const { created, skipped } = await importProspects(rows, batch.id);
  // Previews are built on the spot for the first few; the rest go through "Build previews" or the daily cron.
  const settings = await getSettings();
  let built = 0;
  for (const [i, id] of created.slice(0, 8).entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, settings.fetchDelayMs));
    if ((await buildPreview(id)).ok) built++;
  }
  revalidatePath("/admin");
  flash("/admin/prospects", `Imported ${created.length}, skipped ${skipped} (duplicates or suppressed). Built ${built} previews.`);
}

export async function manualAddAction(form: FormData) {
  await requireAdmin();
  const platform = PLATFORMS.includes(String(form.get("platform"))) ? String(form.get("platform")) : "instagram";
  const handle = String(form.get("handle") ?? "").trim().replace(/^@/, "");
  if (!handle) flash("/admin/prospects/import", "A handle is required.");
  const email = String(form.get("email") ?? "").trim();
  const sourceUrl = normalizeUrl(String(form.get("sourceUrl") ?? ""));
  const { created } = await importProspects([{ handle, platform, sourceUrl, email: EMAIL_RE.test(email) ? email : null, name: String(form.get("name") ?? "").trim() || null }], null);
  if (!created.length) flash("/admin/prospects/import", `@${handle} is already in the list or on the suppression list.`);
  const id = created[0];
  const linkLines = String(form.get("links") ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (linkLines.length) {
    const links = linkLines.map((l) => {
      const parts = l.split(/\s+/);
      const url = normalizeUrl(parts.pop()!) ?? "";
      return { title: parts.join(" ") || url.replace(/^https?:\/\//, ""), url };
    }).filter((l) => l.url);
    await db.update(prospects).set({ links }).where(eq(prospects.id, id));
  }
  const r = await buildPreview(id, { theme: String(form.get("theme") || "") || undefined });
  flash("/admin/prospects", r.ok ? `Added @${handle} and built the preview.` : `Added @${handle}, but: ${r.error}`);
}

export async function buildPendingAction() {
  await requireAdmin();
  const r = await buildPendingPreviews(10);
  flash("/admin/prospects", `Built ${r.built} of ${r.tried} waiting previews.`);
}

export async function sendBatchAction() {
  await requireAdmin();
  const r = await runEmailBatch();
  flash("/admin", `Sent ${r.sent} emails.${r.reason ? ` ${r.reason}` : ""}`);
}

export async function saveNotes(id: string, notes: string) {
  await requireAdmin();
  await db.update(prospects).set({ notes: notes.slice(0, 4000), updatedAt: new Date() }).where(eq(prospects.id, id));
}

export async function setStatusAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as typeof prospects.$inferSelect.status;
  await db.update(prospects).set({ status, updatedAt: new Date() }).where(eq(prospects.id, id));
  await logEvent(id, "status_set", { status });
  revalidatePath("/admin/prospects");
}

export async function resendAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const back = String(form.get("back") || "/admin/prospects");
  const settings = await getSettings();
  if (settings.paused) flash(back, "Outreach is paused in settings.");
  if ((await sentToday("email")) >= settings.dailyEmailCap) flash(back, "Today's email cap is reached.");
  const [p] = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  if (!p) flash(back, "Prospect not found.");
  const r = await sendOutreachEmail(p, settings);
  flash(back, r.ok ? `Email sent to @${p.handle}.` : r.error);
}

export async function regenerateAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const theme = String(form.get("theme") || "random");
  await db.update(prospects).set({ lastError: null }).where(eq(prospects.id, id));
  const r = await buildPreview(id, { theme });
  flash(String(form.get("back") || "/admin/prospects"), r.ok ? "Preview rebuilt." : r.error);
}

export async function removeAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const [p] = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  if (p) {
    await suppress([
      { kind: "handle", hash: handleHash(p.platform, p.handle) },
      ...(p.email ? [{ kind: "email" as const, hash: emailHash(p.email) }] : []),
    ], "removed");
    await db.delete(prospects).where(eq(prospects.id, id));
  }
  flash(String(form.get("back") || "/admin/prospects"), p ? `Removed @${p.handle} and added them to the suppression list.` : "Already gone.");
}

export async function markDmSentAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  const settings = await getSettings();
  if ((await sentToday("dm")) >= settings.dailyDmCap) flash("/admin/dm-queue", "Today's DM cap is reached.");
  const [p] = await db.select().from(prospects).where(eq(prospects.id, id)).limit(1);
  if (!p) flash("/admin/dm-queue", "Prospect not found.");
  await db.insert(outreachMessages).values({ prospectId: p.id, channel: "dm", status: "sent", body: dmText(p, settings), sentAt: new Date() });
  await advance(p, "contacted");
  await logEvent(p.id, "dm_sent");
  revalidatePath("/admin/dm-queue");
}

export async function skipDmAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id"));
  await db.insert(outreachMessages).values({ prospectId: id, channel: "dm", status: "skipped", body: "" });
  revalidatePath("/admin/dm-queue");
}

export async function saveSettingsAction(form: FormData) {
  await requireAdmin();
  await getSettings();
  const num = (k: string, min: number, max: number) => Math.max(min, Math.min(max, Math.round(Number(form.get(k)) || 0)));
  await db.update(adminSettings).set({
    dailyEmailCap: num("dailyEmailCap", 0, 2000),
    perRunEmailCap: num("perRunEmailCap", 1, 200),
    dailyDmCap: num("dailyDmCap", 0, 500),
    fetchDelayMs: num("fetchDelayMs", 500, 60000),
    physicalAddress: String(form.get("physicalAddress") ?? "").trim().slice(0, 300),
    senderName: String(form.get("senderName") ?? "").trim().slice(0, 80) || "Linkmogg",
    defaultPreviewTheme: String(form.get("defaultPreviewTheme") ?? "random"),
    emailSubject: String(form.get("emailSubject") ?? "").trim().slice(0, 150) || "I made you a new link-in-bio page",
    emailTemplate: String(form.get("emailTemplate") ?? "").slice(0, 4000),
    dmTemplate: String(form.get("dmTemplate") ?? "").slice(0, 1000),
    paused: form.get("paused") === "on",
    updatedAt: new Date(),
  }).where(eq(adminSettings.id, 1));
  flash("/admin/settings", "Settings saved.");
}
