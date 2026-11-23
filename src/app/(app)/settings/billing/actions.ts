"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, subscriptions } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { stripe, stripeConfigured } from "@/lib/stripe";
import { appUrl } from "@/lib/config";

async function customerFor(userId: string, email: string) {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1);
  if (sub) return sub.stripeCustomerId;
  const c = await stripe().customers.create({ email, metadata: { userId } });
  await db.insert(subscriptions).values({ userId, stripeCustomerId: c.id, status: "none" });
  return c.id;
}

export async function startCheckout() {
  const user = await requireUser("/settings/billing");
  if (!stripeConfigured()) redirect("/settings/billing?error=not-configured");
  const customer = await customerFor(user.id, user.email);
  // Keep whatever is left of the free trial (Stripe needs the trial end at least 48h out).
  const trialEnd = user.trialEndsAt && user.trialEndsAt.getTime() - Date.now() > 49 * 3600_000
    ? Math.floor(user.trialEndsAt.getTime() / 1000) : undefined;
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: user.id,
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    subscription_data: { metadata: { userId: user.id }, ...(trialEnd ? { trial_end: trialEnd } : {}) },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/settings/billing?success=1`,
    cancel_url: `${appUrl()}/settings/billing`,
  });
  redirect(session.url!);
}

export async function openPortal() {
  const user = await requireUser("/settings/billing");
  if (!stripeConfigured()) redirect("/settings/billing?error=not-configured");
  const customer = await customerFor(user.id, user.email);
  const session = await stripe().billingPortal.sessions.create({ customer, return_url: `${appUrl()}/settings/billing` });
  redirect(session.url);
}
