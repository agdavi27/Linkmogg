import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, users, type User } from "@/lib/db";
import { TRIAL_DAYS } from "@/lib/config";

const COOKIE = "lm_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export function sha256(v: string) {
  return createHash("sha256").update(v).digest("hex");
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export async function createSession(userId: string) {
  const jwt = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, jwt, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const [u] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    return u ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(next = "/editor"): Promise<User> {
  const u = await currentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}

export function isAdmin(u: User | null): boolean {
  if (!u) return false;
  const admins = (process.env.ADMIN_EMAIL ?? "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  return u.role === "admin" || admins.includes(u.email.toLowerCase());
}

export async function requireAdmin(): Promise<User> {
  const u = await requireUser("/admin");
  if (!isAdmin(u)) redirect("/editor");
  return u;
}

/** Finds or creates a user. New users start a free trial. */
export async function upsertUserByEmail(email: string): Promise<User> {
  const e = email.trim().toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, e)).limit(1);
  if (existing) return existing;
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 86400_000);
  const [created] = await db.insert(users).values({ email: e, trialEndsAt }).returning();
  return created;
}
