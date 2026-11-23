import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, links, pages, prospects, socialLinks } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { prospectByToken } from "@/lib/outreach/prospect-page";
import { advance, logEvent } from "@/lib/outreach/core";
import { normalizeUsername, usernameProblem } from "@/lib/reserved";
import { getPageForUser } from "@/lib/pages";

async function freeUsername(base: string) {
  let u = normalizeUsername(base).replace(/[^a-z0-9._]/g, "").slice(0, 26);
  if (usernameProblem(u)) u = `${u || "page"}_mogg`.slice(0, 30);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? u : `${u}${i + 1}`;
    if (usernameProblem(candidate)) continue;
    const [taken] = await db.select({ id: pages.id }).from(pages).where(eq(pages.username, candidate)).limit(1);
    if (!taken) return candidate;
  }
  return `${u}${Date.now() % 100000}`;
}

/** Turns a preview into a real page for the signed-in user. Handle ownership checks are not enforced yet. */
export async function GET(req: NextRequest, { params }: RouteContext<"/claim/[token]/accept">) {
  const { token } = await params;
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/claim/${token}/accept`)}`, req.url));
  const p = await prospectByToken(token);
  if (!p) return NextResponse.redirect(new URL("/", req.url));
  if (["claimed", "trial", "paid"].includes(p.status) && p.claimedUserId !== user.id) {
    return NextResponse.redirect(new URL(`/claim/${token}`, req.url));
  }

  let page = await getPageForUser(user.id);
  if (!page) {
    const username = await freeUsername(p.handle);
    [page] = await db.insert(pages).values({
      userId: user.id, username, displayName: p.displayName ?? p.handle, bio: (p.bio ?? "").slice(0, 160),
      avatarUrl: p.avatarUrl, themeId: p.themeId ?? "classic",
    }).returning();
    if (p.links.length) await db.insert(links).values(p.links.map((l, i) => ({ pageId: page!.id, title: l.title.slice(0, 80), url: l.url, position: i })));
    if (p.socials.length) await db.insert(socialLinks).values(p.socials.map((s, i) => ({ pageId: page!.id, platform: s.platform, url: s.url, position: i })));
  }

  if (!p.claimedUserId) {
    await db.update(prospects).set({ claimedUserId: user.id, updatedAt: new Date() }).where(eq(prospects.id, p.id));
    await advance(p, "claimed");
    await logEvent(p.id, "claimed", { userId: user.id });
    await advance({ id: p.id, status: "claimed" }, "trial");
  }
  return NextResponse.redirect(new URL("/editor?welcome=1", req.url));
}
