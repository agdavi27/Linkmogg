import "server-only";
import { appUrl } from "@/lib/config";

const UA_TOKEN = "LinkmoggBot";
const robotsCache = new Map<string, { rules: { allow: boolean; path: string }[]; at: number }>();

export function userAgent() {
  return `Mozilla/5.0 (compatible; ${UA_TOKEN}/1.0; +${appUrl()}/bot)`;
}

/** Minimal robots.txt reader: honors groups for our token or "*", longest-match wins. */
async function robotsAllows(url: URL): Promise<boolean> {
  const origin = url.origin;
  let entry = robotsCache.get(origin);
  if (!entry || Date.now() - entry.at > 3600_000) {
    const rules: { allow: boolean; path: string }[] = [];
    try {
      const res = await fetch(`${origin}/robots.txt`, { headers: { "user-agent": userAgent() }, signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const lines = (await res.text()).split(/\r?\n/).map((l) => l.replace(/#.*/, "").trim());
        let agents: string[] = [];
        let inGroup = false;
        const groups: Record<string, { allow: boolean; path: string }[]> = {};
        for (const line of lines) {
          const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
          if (!m) continue;
          const [, k, v] = m;
          const key = k.toLowerCase();
          if (key === "user-agent") {
            if (inGroup) { agents = []; inGroup = false; }
            agents.push(v.toLowerCase());
          } else if (key === "allow" || key === "disallow") {
            inGroup = true;
            for (const a of agents) (groups[a] ??= []).push({ allow: key === "allow", path: v });
          }
        }
        rules.push(...(groups[UA_TOKEN.toLowerCase()] ?? groups["*"] ?? []));
      }
    } catch { /* no robots.txt reachable: treat as allowed */ }
    entry = { rules, at: Date.now() };
    robotsCache.set(origin, entry);
  }
  const path = url.pathname + url.search;
  let best: { allow: boolean; path: string } | null = null;
  for (const r of entry.rules) {
    if (!r.path) continue; // "Disallow:" with no path allows everything
    if (path.startsWith(r.path.replace(/\*$/, "")) && (!best || r.path.length > best.path.length)) best = r;
  }
  return best ? best.allow : true;
}

export class FetchBlocked extends Error {}

/** Fetches a public page politely: robots.txt honored, identified UA, no logins, no retries. */
export async function fetchPublicPage(raw: string): Promise<{ url: string; html: string }> {
  const url = new URL(raw);
  if (!["http:", "https:"].includes(url.protocol)) throw new FetchBlocked("Only http(s) pages can be imported.");
  if (["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname)) throw new FetchBlocked("Local addresses can't be imported.");
  if (!(await robotsAllows(url))) throw new FetchBlocked(`${url.hostname} asks bots not to read this page (robots.txt). Add this one manually.`);
  const res = await fetch(url, {
    headers: { "user-agent": userAgent(), accept: "text/html" },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  if (res.status === 429) throw new FetchBlocked("The site asked us to slow down (429). Try again later.");
  if (res.status === 401 || res.status === 403) throw new FetchBlocked(`The site refused the request (${res.status}). Add this one manually.`);
  if (!res.ok) throw new Error(`Fetch failed with ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("html")) throw new Error("That link isn't an HTML page.");
  const text = await res.text();
  return { url: res.url || url.toString(), html: text.slice(0, 2_000_000) };
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
