import { parse, type HTMLElement } from "node-html-parser";
import { detectPlatform } from "@/lib/socials/detect";
import type { ParsedLink, ParsedSocial } from "@/lib/db/schema";

export type ParsedPage = {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  links: ParsedLink[];
  socials: ParsedSocial[];
  email: string | null;
};

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const SOCIAL_ONLY = new Set([
  "instagram", "tiktok", "x", "youtube", "snapchat", "threads", "linkedin", "facebook", "pinterest", "twitch",
  "discord", "github", "bluesky", "mastodon", "tumblr", "reddit", "kick", "telegram", "whatsapp",
]);

function clean(s: unknown, max = 200): string | null {
  if (typeof s !== "string") return null;
  const t = s.replace(/\s+/g, " ").trim();
  return t ? t.slice(0, max) : null;
}

function emailFrom(url: string): string | null {
  if (!url.toLowerCase().startsWith("mailto:")) return null;
  const m = decodeURIComponent(url.slice(7)).match(EMAIL_RE);
  return m ? m[0].toLowerCase() : null;
}

function dedupe<T>(items: T[], key: (t: T) => string) {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(key(i)) ? false : (seen.add(key(i)), true)));
}

/** Reads the Next.js data blob that several hosted link-in-bio pages embed. */
function fromNextData(root: HTMLElement): ParsedPage | null {
  const raw = root.querySelector("script#__NEXT_DATA__")?.text;
  if (!raw) return null;
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return null; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const account = (json as any)?.props?.pageProps?.account;
  if (!account || !Array.isArray(account.links)) return null;
  const links: ParsedLink[] = [];
  const socials: ParsedSocial[] = [];
  let email: string | null = null;
  for (const l of account.links) {
    const url = typeof l?.url === "string" ? l.url : null;
    const title = clean(l?.title, 80);
    if (!url) continue;
    email ??= emailFrom(url);
    if (title) links.push({ title, url });
  }
  for (const s of account.socialLinks ?? []) {
    if (typeof s?.url !== "string") continue;
    email ??= emailFrom(s.url);
    const d = detectPlatform(s.url);
    if (d) socials.push({ platform: d.platform, url: d.url });
  }
  const bio = clean(account.description, 300);
  email ??= bio?.match(EMAIL_RE)?.[0]?.toLowerCase() ?? null;
  return {
    displayName: clean(account.pageTitle ?? account.username, 80),
    bio,
    avatarUrl: clean(account.profilePictureUrl, 1000),
    links: dedupe(links, (l) => l.url).slice(0, 40),
    socials: dedupe(socials, (s) => s.url).slice(0, 20),
    email,
  };
}

/** Generic fallback: metadata + every outbound anchor on the page. */
function fromHtml(root: HTMLElement, pageUrl: string): ParsedPage {
  const meta = (sel: string) => root.querySelector(sel)?.getAttribute("content") ?? null;
  const host = new URL(pageUrl).hostname.replace(/^www\./, "");
  const links: ParsedLink[] = [];
  const socials: ParsedSocial[] = [];
  let email: string | null = null;
  for (const a of root.querySelectorAll("a[href]")) {
    const href = a.getAttribute("href")!;
    let abs: string;
    try { abs = new URL(href, pageUrl).toString(); } catch { continue; }
    email ??= emailFrom(abs);
    if (abs.startsWith("mailto:")) continue;
    if (!/^https?:/.test(abs)) continue;
    const h = new URL(abs).hostname.replace(/^www\./, "");
    if (h === host || h.endsWith(`.${host}`)) continue; // the host's own nav, legal, signup links
    const text = clean(a.getAttribute("aria-label") ?? a.text, 80);
    const d = detectPlatform(abs);
    if (d && SOCIAL_ONLY.has(d.platform) && (!text || text.length < 3 || text.toLowerCase() === d.platform)) {
      socials.push({ platform: d.platform, url: d.url });
    } else if (text) {
      links.push({ title: text, url: abs });
    }
  }
  const bodyText = root.querySelector("body")?.text ?? "";
  email ??= bodyText.match(EMAIL_RE)?.[0]?.toLowerCase() ?? null;
  return {
    displayName: clean(meta('meta[property="og:title"]') ?? root.querySelector("title")?.text, 80),
    bio: clean(meta('meta[property="og:description"]') ?? meta('meta[name="description"]'), 300),
    avatarUrl: clean(meta('meta[property="og:image"]'), 1000),
    links: dedupe(links, (l) => l.url).slice(0, 40),
    socials: dedupe(socials, (s) => s.url).slice(0, 20),
    email,
  };
}

export function parseLinkInBio(html: string, pageUrl: string): ParsedPage {
  const root = parse(html);
  return fromNextData(root) ?? fromHtml(root, pageUrl);
}
