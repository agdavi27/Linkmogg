import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { daysLeft, getPlan } from "@/lib/entitlements";
import { stripeConfigured } from "@/lib/stripe";
import { PRICE_LABEL } from "@/lib/config";
import { Logo } from "@/components/logo";
import { openPortal, startCheckout } from "./actions";

export const metadata = { title: "Billing" };

export default async function Billing({ searchParams }: PageProps<"/settings/billing">) {
  const user = await requireUser("/settings/billing");
  const [plan, sp] = await Promise.all([getPlan(user), searchParams]);
  const days = daysLeft(plan.trialEndsAt) ?? 0;
  const subscribed = plan.reason === "subscription";
  const headline = subscribed ? "You're on Pro" : plan.reason === "trial" ? `${days} ${days === 1 ? "day" : "days"} left in your trial` : "You're on Free";
  const sub = subscribed
    ? "Every theme is unlocked and the badge is off. Thanks for backing Linkmogg."
    : plan.reason === "trial"
      ? `Every theme is unlocked until your trial ends. After that your page stays up on the Free plan with the Classic theme, unless you upgrade.`
      : "Your page is live with the Classic theme and a small badge. Upgrade to unlock every theme and hide the badge.";
  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-5">
        <Link href="/editor" className="flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink"><ArrowLeft size={16} /> Editor</Link>
        <span className="flex-1" />
        <Logo className="text-lg" />
      </header>
      <div className="mx-auto max-w-3xl px-5 pb-20 pt-6">
        {sp.success ? <p className="lm-pop mb-6 rounded-2xl bg-forest px-4 py-3 text-sm text-white">You&apos;re all set. It can take a few seconds for Pro to show up here.</p> : null}
        {sp.error === "not-configured" ? <p className="mb-6 rounded-2xl bg-accent/10 px-4 py-3 text-sm text-accent-ink">Payments aren&apos;t set up yet. Add the Stripe keys in Vercel to turn them on.</p> : null}
        <h1 className="font-display text-4xl font-semibold tracking-[-0.03em]">{headline}</h1>
        <p className="mt-3 max-w-[56ch] text-ink-2">{sub}</p>
        <div className="card mt-8 flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
          <div className="flex-1">
            <p className="font-display text-xl font-semibold">Linkmogg Pro <span className="ml-1 text-base font-medium text-ink-2 tabular">{PRICE_LABEL}</span></p>
            <ul className="mt-3 grid gap-1.5 text-sm text-ink-2 sm:grid-cols-2">
              {["All interactive themes", "No badge", "Cancel any time", "Page never goes down"].map((f) => (
                <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 text-forest" />{f}</li>
              ))}
            </ul>
          </div>
          {subscribed || (plan.status && plan.status !== "none") ? (
            <form action={openPortal}><button className="btn btn-ghost w-full sm:w-auto" disabled={!stripeConfigured()}>Manage billing</button></form>
          ) : null}
          {!subscribed ? (
            <form action={startCheckout}><button className="btn btn-accent w-full sm:w-auto" disabled={!stripeConfigured()}>Upgrade to Pro</button></form>
          ) : null}
        </div>
        {!stripeConfigured() ? <p className="mt-3 text-xs text-ink-3">Stripe isn&apos;t configured in this environment.</p> : null}
      </div>
    </main>
  );
}
