import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, subscriptions } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { syncSubscription } from "@/lib/billing/sync";

async function userIdFor(sub: Stripe.Subscription): Promise<string | null> {
  if (sub.metadata?.userId) return sub.metadata.userId;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const [row] = await db.select({ userId: subscriptions.userId }).from(subscriptions).where(eq(subscriptions.stripeCustomerId, customerId)).limit(1);
  return row?.userId ?? null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 500 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object;
      if (s.subscription && s.client_reference_id) {
        const sub = await stripe().subscriptions.retrieve(typeof s.subscription === "string" ? s.subscription : s.subscription.id);
        await syncSubscription(s.client_reference_id, sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      const userId = await userIdFor(sub);
      if (userId) await syncSubscription(userId, sub);
      break;
    }
  }
  return NextResponse.json({ received: true });
}
