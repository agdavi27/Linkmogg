import "server-only";
import { timingSafeEqual } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, prospects } from "@/lib/db";
import { emailHash, normEmail, suppress, unsubscribeToken } from "./suppress";
import { logEvent } from "./core";

export function validUnsub(email: string, token: string) {
  const a = Buffer.from(unsubscribeToken(email));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function unsubscribe(email: string) {
  const e = normEmail(email);
  await suppress([{ kind: "email", hash: emailHash(e) }], "unsubscribe");
  const rows = await db.select().from(prospects).where(eq(prospects.email, e));
  for (const p of rows) {
    if (["claimed", "trial", "paid"].includes(p.status)) continue;
    await db.update(prospects).set({ status: "unsubscribed", updatedAt: new Date() }).where(and(eq(prospects.id, p.id)));
    await logEvent(p.id, "unsubscribed");
  }
}
