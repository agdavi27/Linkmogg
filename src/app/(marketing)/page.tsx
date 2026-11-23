import Link from "next/link";
import { Check } from "lucide-react";
import { hostLabel, PRICE_LABEL, TRIAL_DAYS } from "@/lib/config";
import { ClaimInput } from "./claim-input";
import { DemoPhone } from "./demo-phone";
import { HeroWord } from "./hero-word";
import { ThemeReel } from "./theme-reel";

export default function Home() {
  const host = hostLabel();
  return (
    <main>
      <section className="relative">
        <div aria-hidden className="lm-hero-glow pointer-events-none absolute inset-0 overflow-hidden"><span /><span /></div>
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-14">
          <div>
            <h1 className="lm-enter font-display text-[clamp(2.6rem,6.5vw,5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance">
              A link in bio people actually <HeroWord />
            </h1>
            <p className="lm-enter mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2 text-pretty" style={{ animationDelay: "90ms" }}>
              Put every link you have on one page, then make it a click wheel, a sunflower, a bookshelf or a stack of spinning discs. Visitors stay longer because there&apos;s something to touch.
            </p>
            <div className="lm-enter mt-8" style={{ animationDelay: "180ms" }}><ClaimInput host={host} /></div>
            <p className="lm-enter mt-3 text-sm text-ink-3" style={{ animationDelay: "240ms" }}>Free for {TRIAL_DAYS} days with every theme. No card needed.</p>
          </div>
          <div className="lm-enter" style={{ animationDelay: "120ms" }}><DemoPhone /></div>
        </div>
      </section>

      <section className="border-y border-line bg-paper-2/60 py-20">
        <div className="lm-reveal mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-[18ch] font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-balance">Eighteen themes, all with the same links inside</h2>
            <Link href="/themes" className="btn btn-ghost">Try them all live</Link>
          </div>
          <p className="mt-4 max-w-[60ch] text-ink-2">Switch themes whenever you like. Your links, icons and bio stay put, and every theme works with touch, a keyboard and a screen reader.</p>
        </div>
        <div className="mt-10"><ThemeReel /></div>
      </section>

      <section id="pricing" className="lm-reveal mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-4xl font-semibold tracking-[-0.03em]">One price, no tiers to decode</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="card p-7">
            <h3 className="font-display text-xl font-semibold">Free</h3>
            <p className="mt-1 text-3xl font-semibold tabular">$0</p>
            <ul className="mt-5 flex flex-col gap-2.5 text-ink-2">
              {["Your own page and username", "Unlimited links and social icons", "The Classic theme", "A small \"Get your own\" badge"].map((f) => (
                <li key={f} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-ink-3" />{f}</li>
              ))}
            </ul>
          </div>
          <div className="card relative overflow-hidden bg-ink p-7 text-paper">
            <h3 className="font-display text-xl font-semibold">Pro</h3>
            <p className="mt-1 text-3xl font-semibold tabular">{PRICE_LABEL}</p>
            <ul className="mt-5 flex flex-col gap-2.5 text-paper/80">
              {["Every interactive theme", "No badge", `${TRIAL_DAYS}-day free trial, no card`, "Cancel any time. Your page stays up on Free."].map((f) => (
                <li key={f} className="flex gap-2"><Check size={18} className="mt-0.5 shrink-0 text-accent" />{f}</li>
              ))}
            </ul>
            <Link href="/login" className="btn btn-accent mt-7">Start free trial</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
