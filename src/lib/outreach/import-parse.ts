import { detectPlatform, normalizeUrl } from "@/lib/socials/detect";
export type ImportRow = { handle: string; platform: string; sourceUrl?: string | null; email?: string | null; name?: string | null };

export const PLATFORMS = ["instagram", "tiktok", "x", "youtube", "threads", "twitch", "snapchat", "pinterest", "bluesky", "other"];
export const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

/** Accepts CSV with a header row, or loose lines like "@handle https://link.page/handle email@x.com". */
export function parseImport(text: string, defaultPlatform: string): ImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const first = lines[0].toLowerCase();
  const rows: ImportRow[] = [];
  if (first.includes("handle") && first.includes(",")) {
    const cols = first.split(",").map((c) => c.trim().replace(/"/g, ""));
    const idx = (names: string[]) => cols.findIndex((c) => names.includes(c));
    const h = idx(["handle", "username"]), pl = idx(["platform"]), u = idx(["link_url", "url", "link", "bio_link"]), e = idx(["email"]), n = idx(["name", "display_name"]);
    for (const line of lines.slice(1)) {
      const v = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const platform = (pl >= 0 && v[pl] && PLATFORMS.includes(v[pl].toLowerCase())) ? v[pl].toLowerCase() : defaultPlatform;
      rows.push({
        handle: v[h] ?? "", platform,
        sourceUrl: u >= 0 && v[u] ? normalizeUrl(v[u]) : null,
        email: e >= 0 && EMAIL_RE.test(v[e] ?? "") ? v[e] : null,
        name: n >= 0 ? v[n] || null : null,
      });
    }
    return rows;
  }
  for (const line of lines) {
    const tokens = line.split(/[\s,;\t]+/).filter(Boolean);
    let handle = "", sourceUrl: string | null = null, email: string | null = null;
    for (const t of tokens) {
      if (EMAIL_RE.test(t)) email = t;
      else if (/^https?:\/\//i.test(t) || /\.[a-z]{2,}\//i.test(t)) {
        const url = normalizeUrl(t);
        const d = url ? detectPlatform(url) : null;
        // A pasted profile URL gives us the handle; anything else is their link-in-bio page.
        if (d && d.platform !== "website" && d.handle && !handle && d.platform === defaultPlatform) handle = d.handle;
        else sourceUrl = url;
      } else if (!handle) handle = t.replace(/^@/, "");
    }
    if (handle) rows.push({ handle, platform: defaultPlatform, sourceUrl, email });
  }
  return rows;
}

