import { NextResponse, type NextRequest } from "next/server";
import { db, links, pages, socialLinks } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { decodeDraft } from "@/lib/convert";
import { detectPlatform } from "@/lib/socials/detect";
import { freeUsername } from "@/lib/usernames";
import { getPageForUser } from "@/lib/pages";
import { DEFAULT_THEME, getTheme } from "@/themes/registry";

/** After sign-in: turns the converted draft into the person's page. It never touches a page that already exists. */
export async function GET(req: NextRequest) {
  const d = req.nextUrl.searchParams.get("d") ?? "";
  const user = await currentUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`/convert/finish?d=${d}`)}`, req.url));
  if (await getPageForUser(user.id)) return NextResponse.redirect(new URL("/editor", req.url));

  const draft = decodeDraft(d);
  if (!draft || !draft.username) return NextResponse.redirect(new URL("/onboarding", req.url));

  const username = await freeUsername(draft.username);
  const theme = getTheme(draft.themeId || DEFAULT_THEME);
  const [page] = await db.insert(pages).values({
    userId: user.id, username, displayName: draft.displayName || username, bio: draft.bio, themeId: theme.id,
  }).returning();
  if (draft.links.length) {
    await db.insert(links).values(draft.links.map((l, i) => ({ pageId: page.id, title: l.title, url: l.url, position: i })));
  }
  const socials = draft.socials.map((u) => detectPlatform(u)).filter((s): s is NonNullable<typeof s> => !!s);
  if (socials.length) {
    await db.insert(socialLinks).values(socials.map((s, i) => ({ pageId: page.id, platform: s.platform, url: s.url, position: i })));
  }
  return NextResponse.redirect(new URL("/editor?welcome=1", req.url));
}
