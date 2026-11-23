import type { InstagramInfo } from "./types";

export const MAX_REELS = 6;

/** Pull an Instagram handle out of whatever someone pastes: a profile link, a reel link, or @name. */
export function instagramHandle(input: string): string | null {
  const s = input.trim();
  const m = s.match(/^(?:https?:\/\/)?(?:www\.|m\.)?instagram\.com\/([A-Za-z0-9._]{1,30})(?:[/?#]|$)/i) ?? s.match(/^@?([A-Za-z0-9._]{1,30})$/);
  if (!m) return null;
  const h = m[1].toLowerCase();
  if (["p", "reel", "reels", "stories", "explore", "accounts"].includes(h)) return null;
  return h;
}

/** The theme-specific settings stored in pages.themeOptions, read defensively. */
export function readThemeOptions(o: Record<string, unknown> | null | undefined): { backdrop: string | null; layout: "vertical" | "horizontal" | null; instagram: InstagramInfo | null } {
  const ig = o?.instagram as Partial<InstagramInfo> | undefined;
  return {
    backdrop: typeof o?.backdrop === "string" ? o.backdrop : null,
    layout: o?.layout === "horizontal" || o?.layout === "vertical" ? o.layout : null,
    instagram: ig && typeof ig.handle === "string"
      ? { handle: ig.handle, reels: Array.isArray(ig.reels) ? ig.reels.filter((r): r is string => typeof r === "string" && r.startsWith("https://")).slice(0, MAX_REELS) : [] }
      : null,
  };
}
