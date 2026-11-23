import { eq } from "drizzle-orm";
import { db, subscriptions, type User } from "@/lib/db";

export type Plan = {
  isPro: boolean;
  reason: "subscription" | "trial" | "free";
  trialEndsAt: Date | null;
  status: string | null;
};

const ACTIVE = new Set(["active", "trialing", "past_due"]);

/** Pro = an active Stripe subscription, or still inside the free trial. Never stored, always computed. */
export function daysLeft(d: Date | null): number | null {
  return d ? Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400_000)) : null;
}

export async function getPlan(user: Pick<User, "id" | "trialEndsAt">): Promise<Plan> {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);
  if (sub && ACTIVE.has(sub.status)) {
    return { isPro: true, reason: "subscription", trialEndsAt: user.trialEndsAt, status: sub.status };
  }
  if (user.trialEndsAt && user.trialEndsAt.getTime() > Date.now()) {
    return { isPro: true, reason: "trial", trialEndsAt: user.trialEndsAt, status: sub?.status ?? null };
  }
  return { isPro: false, reason: "free", trialEndsAt: user.trialEndsAt, status: sub?.status ?? null };
}
