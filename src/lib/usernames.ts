import "server-only";
import { eq } from "drizzle-orm";
import { db, pages } from "@/lib/db";
import { normalizeUsername, usernameProblem } from "@/lib/reserved";

/** The wanted username if it's free, otherwise the closest free variant (name2, name3, ...). */
export async function freeUsername(base: string) {
  let u = normalizeUsername(base).replace(/[^a-z0-9._]/g, "").slice(0, 26);
  if (usernameProblem(u)) u = `${u || "page"}_mogg`.slice(0, 30);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? u : `${u}${i + 1}`;
    if (usernameProblem(candidate)) continue;
    const [taken] = await db.select({ id: pages.id }).from(pages).where(eq(pages.username, candidate)).limit(1);
    if (!taken) return candidate;
  }
  return `${u}${Date.now() % 100000}`;
}
