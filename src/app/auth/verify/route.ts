import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, loginTokens } from "@/lib/db";
import { createSession, sha256, upsertUserByEmail } from "@/lib/auth";
import { getPageForUser } from "@/lib/pages";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const fail = NextResponse.redirect(new URL("/login?error=expired", req.url));
  if (!token) return fail;
  const [row] = await db.update(loginTokens).set({ usedAt: new Date() })
    .where(and(eq(loginTokens.tokenHash, sha256(token)), isNull(loginTokens.usedAt), gt(loginTokens.expiresAt, new Date())))
    .returning();
  if (!row) return fail;
  const user = await upsertUserByEmail(row.email);
  await createSession(user.id);
  const page = await getPageForUser(user.id);
  const dest = row.next ?? (page ? "/editor" : "/onboarding");
  return NextResponse.redirect(new URL(dest, req.url));
}
