import { PLATFORMS } from "./platforms";

export type Detected = { platform: string; url: string; handle?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Normalizes user input into an absolute URL, or returns null if it can't be one. */
export function normalizeUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  if (/^mailto:/i.test(raw) || /^tel:/i.test(raw)) return raw;
  if (EMAIL_RE.test(raw)) return `mailto:${raw}`;
  let candidate = raw;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) candidate = `https://${candidate.replace(/^\/+/, "")}`;
  try {
    const u = new URL(candidate);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function hostMatches(hostname: string, host: string) {
  return hostname === host || hostname.endsWith(`.${host}`);
}

/** Detects which platform a pasted URL belongs to. Unknown hosts are "website". */
export function detectPlatform(input: string): Detected | null {
  const url = normalizeUrl(input);
  if (!url) return null;
  if (url.startsWith("mailto:")) return { platform: "email", url };
  if (url.startsWith("tel:")) return { platform: "phone", url };
  const u = new URL(url);
  const hostname = u.hostname.toLowerCase().replace(/^www\./, "");
  // Mastodon-style handles on any instance: https://instance/@name
  for (const p of PLATFORMS) {
    if (p.hosts.some((h) => hostMatches(hostname, h))) {
      const seg = u.pathname.split("/").filter(Boolean)[0];
      const handle = seg ? seg.replace(/^@/, "") : undefined;
      return { platform: p.id, url, handle };
    }
  }
  if (/^\/@[\w.]+\/?$/.test(u.pathname) && !hostname.includes("tiktok")) {
    return { platform: "mastodon", url, handle: u.pathname.slice(2).replace(/\/$/, "") };
  }
  return { platform: "website", url };
}
