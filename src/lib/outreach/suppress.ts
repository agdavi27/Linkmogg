import "server-only";
import { createHmac } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db, suppressions } from "@/lib/db";
import { sha256 } from "@/lib/auth";

export function normEmail(e: string) { return e.trim().toLowerCase(); }
export function normHandle(platform: string, h: string) { return `${platform}:${h.trim().toLowerCase().replace(/^@/, "")}`; }

export const emailHash = (e: string) => sha256(`email:${normEmail(e)}`);
export const handleHash = (platform: string, h: string) => sha256(`handle:${normHandle(platform, h)}`);

export async function suppress(entries: { kind: "email" | "handle"; hash: string }[], reason: string) {
  if (!entries.length) return;
  await db.insert(suppressions).values(entries.map((e) => ({ kind: e.kind, valueHash: e.hash, reason }))).onConflictDoNothing();
}

export async function isSuppressed(hashes: string[]) {
  if (!hashes.length) return false;
  const rows = await db.select({ id: suppressions.id }).from(suppressions).where(inArray(suppressions.valueHash, hashes)).limit(1);
  return rows.length > 0;
}

export async function suppressionReason(hash: string) {
  const [r] = await db.select().from(suppressions).where(eq(suppressions.valueHash, hash)).limit(1);
  return r?.reason ?? null;
}

/** Signed, stateless unsubscribe token for an email address. */
export function unsubscribeToken(email: string) {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev").update(`unsub:${normEmail(email)}`).digest("base64url").slice(0, 32);
}
