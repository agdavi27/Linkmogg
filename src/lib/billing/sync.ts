import "server-only";
import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, pages, prospects, prospectEvents, subscriptions } from "@/lib/db";

/** Mirrors a Stripe subscription into our table, then refreshes the user's public page. */
export async function syncSubscription(userId: string, sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const periodEnd = sub.items.data[0]?.current_period_end;
  const values = {
    userId,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    updatedAt: new Date(),
  };
  await db.insert(subscriptions).values(values).onConflictDoUpdate({ target: subscriptions.userId, set: values });

  // Outreach funnel: a claimed prospect who starts paying moves to "paid".
  if (sub.status === "active") {
    const claimed = await db.select({ id: prospects.id, status: prospects.status }).from(prospects).where(eq(prospects.claimedUserId, userId));
    for (const p of claimed) {
      if (p.status !== "paid") {
        await db.update(prospects).set({ status: "paid", updatedAt: new Date() }).where(eq(prospects.id, p.id));
        await db.insert(prospectEvents).values({ prospectId: p.id, type: "paid" });
      }
    }
  }

  const [page] = await db.select({ username: pages.username }).from(pages).where(eq(pages.userId, userId)).limit(1);
  if (page) revalidatePath(`/${page.username}`);
}
