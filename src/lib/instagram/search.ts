import "server-only";

/**
 * Optional: finds link-in-bio pages for a niche through a web search API, without visiting them.
 * Uses Brave's Search API when BRAVE_SEARCH_API_KEY is set; otherwise returns nothing.
 * Check Brave's current API terms before turning it on.
 */
export async function searchLinkInBioUrls(query: string, host: string): Promise<string[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return [];
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", `site:${host} ${query}`);
  url.searchParams.set("count", "20");
  const res = await fetch(url, { headers: { accept: "application/json", "x-subscription-token": key }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Search failed (${res.status}).`);
  const body = (await res.json()) as { web?: { results?: { url: string }[] } };
  return (body.web?.results ?? []).map((r) => r.url);
}

export function searchConfigured() {
  return Boolean(process.env.BRAVE_SEARCH_API_KEY);
}
