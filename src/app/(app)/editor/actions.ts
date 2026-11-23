"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { put } from "@vercel/blob";
import { db, links, pages, socialLinks } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPlan } from "@/lib/entitlements";
import { detectPlatform, normalizeUrl } from "@/lib/socials/detect";
import { getTheme } from "@/themes/registry";
import { isPresetBackdrop } from "@/themes/backdrops";
import { MAX_REELS, instagramHandle, readThemeOptions } from "@/themes/options";

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function myPage() {
  const user = await requireUser();
  const [page] = await db.select().from(pages).where(eq(pages.userId, user.id)).limit(1);
  if (!page) throw new Error("No page yet");
  return { user, page };
}

async function touch(pageId: string, username: string) {
  await db.update(pages).set({ updatedAt: new Date() }).where(eq(pages.id, pageId));
  revalidatePath(`/${username}`);
}

const profileSchema = z.object({
  displayName: z.string().trim().max(60),
  bio: z.string().trim().max(160),
  avatarUrl: z.string().trim().max(1000).nullable(),
});

export async function saveProfile(input: z.infer<typeof profileSchema>): Promise<Result> {
  const { page } = await myPage();
  const p = profileSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Name is 60 characters max, bio is 160." };
  const avatarUrl = p.data.avatarUrl ? normalizeUrl(p.data.avatarUrl) : null;
  await db.update(pages).set({ displayName: p.data.displayName, bio: p.data.bio, avatarUrl }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true };
}

export async function uploadAvatar(form: FormData): Promise<Result<string>> {
  const { page } = await myPage();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pick an image first." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "That file isn't an image." };
  if (file.size > 4 * 1024 * 1024) return { ok: false, error: "Keep it under 4 MB." };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { ok: false, error: "Uploads aren't set up yet. Paste an image URL instead." };
  const blob = await put(`avatars/${page.id}-${Date.now()}`, file, { access: "public", contentType: file.type });
  await db.update(pages).set({ avatarUrl: blob.url }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true, data: blob.url };
}

/** Saves the backdrop for themes that use one: a preset id, or an https image URL. */
export async function setBackdrop(value: string): Promise<Result> {
  const v = z.string().trim().max(1000).safeParse(value);
  if (!v.success) return { ok: false, error: "That backdrop is too long." };
  const ok = isPresetBackdrop(v.data) || /^https:\/\/[^\s"'()]+$/.test(v.data);
  if (!ok) return { ok: false, error: "Use one of the backdrops, or an https image link." };
  const { page } = await myPage();
  await db.update(pages).set({ themeOptions: { ...page.themeOptions, backdrop: v.data } }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true };
}

export async function uploadBackdrop(form: FormData): Promise<Result<string>> {
  const { page } = await myPage();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Pick an image first." };
  if (!file.type.startsWith("image/")) return { ok: false, error: "That file isn't an image." };
  if (file.size > 6 * 1024 * 1024) return { ok: false, error: "Keep it under 6 MB." };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { ok: false, error: "Uploads aren't set up yet. Paste an image link instead." };
  const blob = await put(`backdrops/${page.id}-${Date.now()}`, file, { access: "public", contentType: file.type });
  await db.update(pages).set({ themeOptions: { ...page.themeOptions, backdrop: blob.url } }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true, data: blob.url };
}

export async function setLayout(value: string): Promise<Result> {
  if (value !== "vertical" && value !== "horizontal") return { ok: false, error: "Pick up and down, or sideways." };
  const { page } = await myPage();
  await db.update(pages).set({ themeOptions: { ...page.themeOptions, layout: value } }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true };
}

/** Saves the Instagram handle for the Reels theme. Nothing is fetched from Instagram. */
export async function setInstagram(value: string): Promise<Result<string>> {
  const v = z.string().trim().max(200).safeParse(value);
  const handle = v.success ? instagramHandle(v.data) : null;
  if (!handle) return { ok: false, error: "Paste your Instagram profile link, like instagram.com/yourname." };
  const { page } = await myPage();
  const ig = readThemeOptions(page.themeOptions).instagram;
  await db.update(pages).set({ themeOptions: { ...page.themeOptions, instagram: { handle, reels: ig?.reels ?? [] } } }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true, data: handle };
}

/** The folder a reel upload has to go in. */
export async function myPageId(): Promise<string> {
  const { page } = await myPage();
  return page.id;
}

/** After the browser uploads a clip to Blob, record it. Only clips in this page's own folder are accepted. */
export async function addReel(url: string): Promise<Result<string[]>> {
  const { page } = await myPage();
  let u: URL;
  try { u = new URL(url); } catch { return { ok: false, error: "That upload didn't finish." }; }
  if (u.protocol !== "https:" || !u.hostname.endsWith(".public.blob.vercel-storage.com") || !u.pathname.startsWith(`/reels/${page.id}/`)) {
    return { ok: false, error: "That upload didn't finish." };
  }
  const ig = readThemeOptions(page.themeOptions).instagram;
  const reels = [...(ig?.reels ?? []), u.toString()].slice(-MAX_REELS);
  await db.update(pages).set({ themeOptions: { ...page.themeOptions, instagram: { handle: ig?.handle ?? "", reels } } }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true, data: reels };
}

/** Takes a clip off the page. The file itself stays in storage. */
export async function removeReel(url: string): Promise<Result<string[]>> {
  const { page } = await myPage();
  const ig = readThemeOptions(page.themeOptions).instagram;
  const reels = (ig?.reels ?? []).filter((r) => r !== url);
  await db.update(pages).set({ themeOptions: { ...page.themeOptions, instagram: { handle: ig?.handle ?? "", reels } } }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true, data: reels };
}

export async function setTheme(themeId: string): Promise<Result> {
  const { user, page } = await myPage();
  const theme = getTheme(themeId);
  if (theme.id !== themeId) return { ok: false, error: "Unknown theme." };
  if (theme.pro && !(await getPlan(user)).isPro) {
    return { ok: false, error: `Your free trial has ended. Upgrade to use ${theme.name} on your page.` };
  }
  await db.update(pages).set({ themeId }).where(eq(pages.id, page.id));
  await touch(page.id, page.username);
  return { ok: true };
}

const linkSchema = z.object({ title: z.string().trim().min(1).max(80), url: z.string().trim().min(1).max(2000) });

export async function addLink(input: { title: string; url: string }): Promise<Result<{ id: string; title: string; url: string; enabled: boolean }>> {
  const { page } = await myPage();
  const p = linkSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Give the link a title and a URL." };
  const url = normalizeUrl(p.data.url);
  if (!url) return { ok: false, error: "That URL doesn't look right." };
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${links.position}), -1)` }).from(links).where(eq(links.pageId, page.id));
  const [row] = await db.insert(links).values({ pageId: page.id, title: p.data.title, url, position: Number(max) + 1 }).returning();
  await touch(page.id, page.username);
  return { ok: true, data: { id: row.id, title: row.title, url: row.url, enabled: row.enabled } };
}

export async function updateLink(id: string, input: { title?: string; url?: string; enabled?: boolean }): Promise<Result<{ url: string }>> {
  const { page } = await myPage();
  const patch: Partial<{ title: string; url: string; enabled: boolean }> = {};
  if (input.title !== undefined) {
    const t = input.title.trim().slice(0, 80);
    if (!t) return { ok: false, error: "Titles can't be empty." };
    patch.title = t;
  }
  if (input.url !== undefined) {
    const u = normalizeUrl(input.url);
    if (!u) return { ok: false, error: "That URL doesn't look right." };
    patch.url = u;
  }
  if (input.enabled !== undefined) patch.enabled = input.enabled;
  await db.update(links).set(patch).where(and(eq(links.id, id), eq(links.pageId, page.id)));
  await touch(page.id, page.username);
  return { ok: true, data: { url: patch.url ?? "" } };
}

export async function deleteLink(id: string): Promise<Result> {
  const { page } = await myPage();
  await db.delete(links).where(and(eq(links.id, id), eq(links.pageId, page.id)));
  await touch(page.id, page.username);
  return { ok: true };
}

export async function reorderLinks(ids: string[]): Promise<Result> {
  const { page } = await myPage();
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx.update(links).set({ position: i }).where(and(eq(links.id, ids[i]), eq(links.pageId, page.id)));
    }
  });
  await touch(page.id, page.username);
  return { ok: true };
}

export async function addSocial(raw: string): Promise<Result<{ id: string; platform: string; url: string }>> {
  const { page } = await myPage();
  const d = detectPlatform(raw);
  if (!d) return { ok: false, error: "Paste a full profile link, like instagram.com/yourname." };
  const [{ max }] = await db.select({ max: sql<number>`coalesce(max(${socialLinks.position}), -1)` }).from(socialLinks).where(eq(socialLinks.pageId, page.id));
  const [row] = await db.insert(socialLinks).values({ pageId: page.id, platform: d.platform, url: d.url, position: Number(max) + 1 }).returning();
  await touch(page.id, page.username);
  return { ok: true, data: { id: row.id, platform: row.platform, url: row.url } };
}

export async function deleteSocial(id: string): Promise<Result> {
  const { page } = await myPage();
  await db.delete(socialLinks).where(and(eq(socialLinks.id, id), eq(socialLinks.pageId, page.id)));
  await touch(page.id, page.username);
  return { ok: true };
}

export async function reorderSocials(ids: string[]): Promise<Result> {
  const { page } = await myPage();
  const owned = await db.select({ id: socialLinks.id }).from(socialLinks).where(and(eq(socialLinks.pageId, page.id), inArray(socialLinks.id, ids)));
  const ownedSet = new Set(owned.map((o) => o.id));
  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      if (ownedSet.has(ids[i])) await tx.update(socialLinks).set({ position: i }).where(eq(socialLinks.id, ids[i]));
    }
  });
  await touch(page.id, page.username);
  return { ok: true };
}
