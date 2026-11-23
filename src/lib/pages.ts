import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, links, pages, socialLinks, users, type Page } from "@/lib/db";
import { getPlan } from "@/lib/entitlements";
import { badgeUrl } from "@/lib/config";
import { effectiveThemeId } from "@/themes/registry";
import type { PageData } from "@/themes/types";
import { readThemeOptions } from "@/themes/options";

export async function loadPageBundle(page: Page) {
  const [ls, ss] = await Promise.all([
    db.select().from(links).where(eq(links.pageId, page.id)).orderBy(asc(links.position), asc(links.createdAt)),
    db.select().from(socialLinks).where(eq(socialLinks.pageId, page.id)).orderBy(asc(socialLinks.position)),
  ]);
  return { links: ls, socials: ss };
}

export function toPageData(
  page: Page, ls: { id: string; title: string; url: string; enabled: boolean }[],
  ss: { platform: string; url: string }[], isPro: boolean,
): PageData {
  return {
    username: page.username,
    displayName: page.displayName,
    bio: page.bio,
    avatarUrl: page.avatarUrl,
    links: ls.filter((l) => l.enabled).map(({ id, title, url }) => ({ id, title, url })),
    socials: ss.map(({ platform, url }) => ({ platform, url })),
    showBadge: !isPro,
    badgeUrl: badgeUrl(),
    ...readThemeOptions(page.themeOptions),
  };
}

/** Everything the public page needs, or null if the username isn't live. */
export async function getPublicPage(username: string) {
  const [row] = await db.select({ page: pages, user: users }).from(pages)
    .innerJoin(users, eq(users.id, pages.userId))
    .where(eq(pages.username, username.toLowerCase())).limit(1);
  if (!row || !row.page.published) return null;
  const [{ links: ls, socials: ss }, plan] = await Promise.all([loadPageBundle(row.page), getPlan(row.user)]);
  return {
    page: row.page,
    themeId: effectiveThemeId(row.page.themeId, plan.isPro),
    data: toPageData(row.page, ls, ss, plan.isPro),
  };
}

export async function getPageForUser(userId: string) {
  const [page] = await db.select().from(pages).where(eq(pages.userId, userId)).limit(1);
  return page ?? null;
}
