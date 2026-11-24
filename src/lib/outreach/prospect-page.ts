import "server-only";
import { eq } from "drizzle-orm";
import { db, prospects, type Prospect } from "@/lib/db";
import type { PageData } from "@/themes/types";

export async function prospectByToken(token: string): Promise<Prospect | null> {
  const [p] = await db.select().from(prospects).where(eq(prospects.claimToken, token)).limit(1);
  return p ?? null;
}

export function prospectPageData(p: Prospect): PageData {
  return {
    username: p.handle,
    displayName: p.displayName || `@${p.handle}`,
    bio: p.bio ?? "",
    avatarUrl: p.avatarUrl,
    links: p.links.map((l, i) => ({ id: `p${i}`, title: l.title, url: l.url })),
    socials: p.socials,
    showBadge: false,
    badgeUrl: "/",
    // found through Instagram: their own reels play behind the Reels theme
    instagram: p.platform === "instagram" ? { handle: p.handle, reels: p.igReels } : null,
  };
}
