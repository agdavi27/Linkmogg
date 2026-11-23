import { detectPlatform, normalizeUrl } from "@/lib/socials/detect";
import { platformLabel } from "@/lib/socials/platforms";

/**
 * Turning someone's existing link-in-bio into a Linkmogg page, from what they paste.
 * We never fetch their old page: Linktree's robots.txt doesn't allow bots like ours,
 * so the person brings the links over themselves and we do the tidying.
 */

export type DraftLink = { title: string; url: string };
export type Draft = { username: string; displayName: string; bio: string; themeId: string; links: DraftLink[]; socials: string[] };

const MAX_LINKS = 40, MAX_SOCIALS = 20;

// Platforms that read as profile icons rather than link buttons when they come without a title.
const SOCIAL = new Set([
  "instagram", "tiktok", "x", "youtube", "snapchat", "threads", "linkedin", "facebook", "pinterest", "twitch",
  "discord", "github", "bluesky", "mastodon", "tumblr", "reddit", "kick", "telegram", "whatsapp", "spotify", "soundcloud",
]);

const URL_RE = /(mailto:[^\s]+|https?:\/\/[^\s<>"]+|(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}(?:\/[^\s<>"]*)?|[^\s@]+@[^\s@]+\.[a-z]{2,})/i;

/** "linktr.ee/juno", "@juno" or "juno" → "juno". */
export function handleFrom(input: string): string {
  const t = input.trim().replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  const m = t.match(/^linktr\.ee\/([^/?#\s]+)/i);
  const raw = m ? m[1] : t.replace(/^@/, "").split(/[/?#\s]/)[0];
  return raw.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);
}

function titleFor(url: string): string {
  if (url.startsWith("mailto:")) return "Email me";
  const d = detectPlatform(url);
  if (d && d.platform !== "website") return platformLabel(d.platform);
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    const path = u.pathname.split("/").filter(Boolean)[0];
    return path && path.length < 24 ? `${host}/${decodeURIComponent(path)}` : host;
  } catch {
    return url;
  }
}

/** Reads pasted text, one link per line, with an optional title before or after the URL. */
export function parsePasted(text: string): { links: DraftLink[]; socials: string[] } {
  const links: DraftLink[] = [];
  const socials: string[] = [];
  const seen = new Set<string>();
  let pendingTitle: string | null = null; // a line with no URL titles the next URL, like a copied Linktree button

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const m = line.match(URL_RE);
    const url = m ? normalizeUrl(m[0].replace(/[),.;]+$/, "")) : null;
    if (!url) { pendingTitle = line.slice(0, 80); continue; }
    if (seen.has(url)) { pendingTitle = null; continue; }
    seen.add(url);
    const inline = line.replace(m![0], "").replace(/^[\s\-–—:|•·>]+|[\s\-–—:|•·<]+$/g, "").trim();
    const title = (inline || pendingTitle || "").slice(0, 80);
    pendingTitle = null;
    const d = detectPlatform(url);
    if (!title && d && SOCIAL.has(d.platform) && d.handle && socials.length < MAX_SOCIALS) {
      socials.push(d.url);
    } else if (links.length < MAX_LINKS) {
      links.push({ title: title || titleFor(url), url });
    }
  }
  return { links, socials };
}

/** Compact, URL-safe form of a draft, so it can ride along through the sign-in email. */
export function encodeDraft(d: Draft): string {
  const json = JSON.stringify({ u: d.username, n: d.displayName, b: d.bio, t: d.themeId, l: d.links.map((l) => [l.title, l.url]), s: d.socials });
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decodes and re-validates a draft. Anything odd is dropped, never trusted. */
export function decodeDraft(s: string): Draft | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const j = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
    const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
    const links: DraftLink[] = [];
    for (const pair of Array.isArray(j.l) ? j.l.slice(0, MAX_LINKS) : []) {
      const url = Array.isArray(pair) ? normalizeUrl(str(pair[1], 1000)) : null;
      const title = Array.isArray(pair) ? str(pair[0], 80) : "";
      if (url && title) links.push({ title, url });
    }
    const socials = (Array.isArray(j.s) ? j.s.slice(0, MAX_SOCIALS) : [])
      .map((u: unknown) => detectPlatform(str(u, 1000))?.url)
      .filter((u: string | undefined): u is string => !!u);
    return { username: handleFrom(str(j.u, 40)), displayName: str(j.n, 60), bio: str(j.b, 160), themeId: str(j.t, 30), links, socials };
  } catch {
    return null;
  }
}
