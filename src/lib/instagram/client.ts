import "server-only";
import { eq, gte, sql } from "drizzle-orm";
import { adminSettings, db, igCalls } from "@/lib/db";
import { getSettings } from "@/lib/outreach/core";
import { openToken, sealToken } from "./crypto";
import { strHash as hash, type IgMedia, type IgProfile } from "./parse";

// Meta's Graph API. Check the current version on developers.facebook.com when going live.
const VERSION = process.env.META_GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;
export const IG_SCOPES = ["instagram_basic", "pages_show_list", "pages_read_engagement", "business_management"];

export class IgError extends Error {
  constructor(message: string, readonly code?: number, readonly kind: "limit" | "token" | "missing" | "other" = "other") { super(message); }
}

/**
 * Without Meta keys outside production, everything runs against made-up accounts,
 * so the whole funnel can be tried end to end. IG_MOCK=1 forces it anywhere.
 */
export function mockMode() {
  return process.env.IG_MOCK === "1" || (!process.env.META_APP_ID && process.env.NODE_ENV !== "production");
}

export async function callsLastHour() {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(igCalls).where(gte(igCalls.at, new Date(Date.now() - 3600_000)));
  return n;
}

async function connection() {
  const s = await getSettings();
  if (!s.igUserId || !s.igTokenEnc) throw new IgError("Linkmogg's Instagram account isn't connected yet.", undefined, "token");
  return { s, userId: s.igUserId, token: openToken(s.igTokenEnc) };
}

async function graph<T>(path: string, params: Record<string, string>, token: string): Promise<T> {
  const s = await getSettings();
  if ((await callsLastHour()) >= s.igCallsPerHour) throw new IgError("Hourly Instagram limit reached.", undefined, "limit");
  await db.insert(igCalls).values({});
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = body.error ?? {};
    const code = Number(e.code);
    const kind = code === 190 || code === 102 ? "token" : code === 4 || code === 17 || code === 32 || code === 613 ? "limit" : code === 110 || code === 100 ? "missing" : "other";
    throw new IgError(e.message ?? `Instagram error ${res.status}`, code, kind);
  }
  return body as T;
}

const MEDIA_FIELDS = "id,caption,media_type,media_product_type,media_url,permalink,timestamp";
const PROFILE_FIELDS = `username,name,biography,website,followers_count,profile_picture_url,media.limit(30){${MEDIA_FIELDS}}`;

/**
 * Looks up another Business or Creator account through Business Discovery, using Linkmogg's own connection.
 * Returns null when the account doesn't exist, is personal, or is private: those simply can't be seen.
 */
export async function lookup(handle: string): Promise<IgProfile | null> {
  const h = handle.replace(/^@/, "").toLowerCase();
  if (mockMode()) { await db.insert(igCalls).values({}); return mockProfile(h); }
  const { userId, token } = await connection();
  try {
    const r = await graph<{ business_discovery?: Omit<IgProfile, "media"> & { id: string; media?: { data: IgMedia[] } } }>(
      userId, { fields: `business_discovery.username(${h}){${PROFILE_FIELDS}}` }, token);
    const b = r.business_discovery;
    if (!b) return null;
    return { ...b, username: b.username.toLowerCase(), media: b.media?.data ?? [] };
  } catch (e) {
    if (e instanceof IgError && e.kind === "missing") return null;
    throw e;
  }
}

// ---------- connecting Linkmogg's own account (Facebook Login for Business) ----------

export function connectUrl(state: string, redirectUri: string) {
  const u = new URL(`https://www.facebook.com/${VERSION}/dialog/oauth`);
  u.searchParams.set("client_id", process.env.META_APP_ID ?? "");
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("state", state);
  u.searchParams.set("scope", IG_SCOPES.join(","));
  u.searchParams.set("response_type", "code");
  return u.toString();
}

async function plainGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${GRAPH}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new IgError(body.error?.message ?? `Facebook error ${res.status}`, Number(body.error?.code));
  return body as T;
}

/**
 * Finishes the login: code → user token → long-lived user token → the Page's token.
 * A Page token made from a long-lived user token doesn't expire, so the daily job keeps working.
 */
export async function finishConnect(code: string, redirectUri: string) {
  const id = process.env.META_APP_ID ?? "", secret = process.env.META_APP_SECRET ?? "";
  if (!id || !secret) throw new IgError("META_APP_ID and META_APP_SECRET need to be set in Vercel.");
  const short = await plainGet<{ access_token: string }>("oauth/access_token", { client_id: id, client_secret: secret, redirect_uri: redirectUri, code });
  const long = await plainGet<{ access_token: string; expires_in?: number }>("oauth/access_token", {
    grant_type: "fb_exchange_token", client_id: id, client_secret: secret, fb_exchange_token: short.access_token,
  });
  const pages = await plainGet<{ data: { name: string; access_token: string; instagram_business_account?: { id: string; username: string } }[] }>(
    "me/accounts", { fields: "name,access_token,instagram_business_account{id,username}", access_token: long.access_token });
  const page = pages.data.find((p) => p.instagram_business_account);
  if (!page?.instagram_business_account) {
    throw new IgError("None of your Facebook Pages has an Instagram business account linked. Link one in Instagram's settings, then connect again.");
  }
  await db.update(adminSettings).set({
    igUserId: page.instagram_business_account.id,
    igUsername: page.instagram_business_account.username,
    igTokenEnc: sealToken(page.access_token),
    igTokenExpiresAt: null,
    updatedAt: new Date(),
  }).where(eq(adminSettings.id, 1));
  return page.instagram_business_account.username;
}

/** A cheap call to make sure the stored token still works. */
export async function checkConnection(): Promise<{ ok: true; username: string } | { ok: false; error: string }> {
  if (mockMode()) return { ok: true, username: "linkmogg (mock)" };
  try {
    const { userId, token } = await connection();
    const r = await graph<{ username: string }>(userId, { fields: "username" }, token);
    return { ok: true, username: r.username };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ---------- mock accounts for development ----------

const NICHES = ["ceramics", "synths", "film", "plants", "bakes", "skate", "knits", "climb"];
const CLIPS = ["/backdrops/field.mp4", "/backdrops/peaks.mp4", "/backdrops/sea.mp4"];

/** A made-up account that behaves like the real thing: some use Linktree, some don't, captions mention others. */
export function mockProfile(handle: string): IgProfile | null {
  const k = hash(handle);
  if (k % 11 === 0) return null; // personal or private: Business Discovery can't see it
  const niche = NICHES[k % NICHES.length];
  const linktree = k % 4 !== 0;
  const media: IgMedia[] = Array.from({ length: 10 }, (_, i) => {
    const other = `${NICHES[(k + i) % NICHES.length]}.${(hash(handle + i) % 900) + 100}`;
    return {
      id: `${handle}-${i}`,
      caption: i % 2 ? `New ${niche} drop with @${other} 🔥` : `Studio day. Thanks @${other} for the help`,
      media_type: i % 3 === 2 ? "IMAGE" : "VIDEO",
      media_product_type: i % 3 === 2 ? "FEED" : "REELS",
      media_url: CLIPS[(k + i) % CLIPS.length],
      permalink: `https://www.instagram.com/reel/mock${i}/`,
      timestamp: new Date(Date.UTC(2026, 10, 20 - i)).toISOString(),
    };
  });
  return {
    id: String(k),
    username: handle,
    name: handle.split(/[._]/)[0].replace(/^\w/, (c) => c.toUpperCase()) + " " + niche.replace(/^\w/, (c) => c.toUpperCase()),
    biography: `Making ${niche} things. ${k % 3 === 0 ? `Collabs: hello@${niche}studio.example` : "Shop and links below"}`,
    website: linktree ? `https://linktr.ee/${handle}` : `https://${niche}studio.example`,
    followers_count: (k % 60000) + 400,
    media,
  };
}
