// Pure helpers for Instagram discovery. No network, no database: easy to test.

export type IgMedia = {
  id: string;
  caption?: string;
  media_type?: string; // IMAGE | VIDEO | CAROUSEL_ALBUM
  media_product_type?: string; // FEED | REELS | ...
  media_url?: string;
  permalink?: string;
  timestamp?: string;
};

export type IgProfile = {
  id?: string;
  username: string;
  name?: string;
  biography?: string;
  website?: string;
  followers_count?: number;
  profile_picture_url?: string;
  media: IgMedia[];
};

const HANDLE = /(?:^|[^\w.@/])@([A-Za-z0-9._]{1,30})/g;

/** Every @handle mentioned in some captions, lowercased, without trailing dots, minus the ones in `skip`. */
export function extractMentions(captions: (string | undefined)[], skip: Iterable<string> = []): string[] {
  const out = new Set<string>();
  const no = new Set([...skip].map((s) => s.toLowerCase()));
  for (const c of captions) {
    if (!c) continue;
    for (const m of c.matchAll(HANDLE)) {
      const h = m[1].replace(/\.+$/, "").toLowerCase();
      if (h.length >= 2 && !no.has(h) && !/^\d+$/.test(h)) out.add(h);
    }
  }
  return [...out];
}

/** Hosts from the settings box: one per line, "linktr.ee" style. */
export function hostList(text: string): string[] {
  return text.split(/[\n,]+/).map((s) => s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")).filter(Boolean);
}

/** True when their profile website is a link-in-bio page on one of the given hosts. */
export function usesLinkInBio(website: string | undefined, hosts: string[]): boolean {
  if (!website) return false;
  try {
    const u = new URL(/^https?:\/\//i.test(website) ? website : `https://${website}`);
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    return hosts.some((x) => h === x || h.endsWith(`.${x}`));
  } catch { return false; }
}

/** Their reels, newest first. Only video posts with a playable URL count. */
export function pickReels(media: IgMedia[], max = 6): IgMedia[] {
  return media
    .filter((m) => m.media_type === "VIDEO" && m.media_url && (m.media_product_type === "REELS" || m.media_product_type === undefined || m.media_product_type === "FEED"))
    .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""))
    .slice(0, max);
}

export type QualifyRules = { hosts: string[]; minFollowers: number; maxFollowers: number; minReels: number };

/** Whether a looked-up account is someone we'd build a preview for, and if not, why. */
export function qualify(p: IgProfile, r: QualifyRules): { ok: true } | { ok: false; reason: string } {
  if (!usesLinkInBio(p.website, r.hosts)) return { ok: false, reason: p.website ? `bio link is ${hostOf(p.website)}` : "no bio link" };
  const f = p.followers_count ?? 0;
  if (f < r.minFollowers) return { ok: false, reason: `${f} followers, under ${r.minFollowers}` };
  if (f > r.maxFollowers) return { ok: false, reason: `${f} followers, over ${r.maxFollowers}` };
  const reels = pickReels(p.media, 99).length;
  if (reels < r.minReels) return { ok: false, reason: `${reels} reels, under ${r.minReels}` };
  return { ok: true };
}

function hostOf(url: string) {
  try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, ""); } catch { return url; }
}

/**
 * An email the creator wrote into their own bio for contact, if there is exactly one.
 * We only use addresses people publish themselves for business contact.
 */
export function bioEmail(bio: string | undefined): string | null {
  if (!bio) return null;
  const found = [...new Set((bio.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []).map((e) => e.toLowerCase()))];
  return found.length === 1 ? found[0] : null;
}

/** A link-in-bio URL from search results → the slug, which is usually their Instagram handle too. */
export function slugFromLinkInBio(url: string, hosts: string[]): string | null {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!hosts.some((x) => h === x)) return null;
    const slug = u.pathname.split("/").filter(Boolean)[0]?.toLowerCase();
    return slug && /^[a-z0-9._]{2,30}$/.test(slug) ? slug.replace(/\.+$/, "") : null;
  } catch { return null; }
}

/** A small stable string hash (FNV-1a), for made-up test accounts. */
export function strHash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** "@Name", "instagram.com/name/", "https://www.instagram.com/name?x" → "name". Null when it isn't a valid handle. */
export function normalizeHandle(raw: string): string | null {
  const h = raw.trim().replace(/^@/, "").replace(/^(https?:\/\/)?(www\.|m\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").toLowerCase();
  return /^[a-z0-9._]{2,30}$/.test(h) ? h : null;
}
