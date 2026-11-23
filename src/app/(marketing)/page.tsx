import Link from "next/link";
import { Check } from "lucide-react";
import { THEMES } from "@/themes/registry";
import { hostLabel, PRICE_LABEL, TRIAL_DAYS } from "@/lib/config";
import { ClaimInput } from "./claim-input";
import { DemoPhone } from "./demo-phone";

export default function Home() {
  const host = hostLabel();
  return (
    <main>
      <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-14">
        <div>
          <h1 className="font-display text-[clamp(2.6rem,6.5vw,5rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance">
            A link in bio people actually <span className="text-accent">play with.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-2 text-pretty">
            Put every link you have on one page, then make it a click wheel, a sunflower, a bookshelf or a vending machine. Visitors stay longer because there&apos;s something to touch.
          </p>
          <div className="mt-8"><ClaimInput host={host} /></div>
          <p className="mt-3 text-sm text-ink-3">Free for {TRIAL_DAYS} days with every theme. No card needed.</p>
        </div>
        <DemoPhone />
      </section>

      <section className="border-y border-line bg-paper-2/60">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-[18ch] font-display text-4xl font-semibold leading-tight tracking-[-0.03em] text-balance">Eleven themes, all with the same links inside</h2>
            <Link href="/themes" className="btn btn-ghost">Try them all live</Link>
          </div>
          <p className="mt-4 max-w-[60ch] text-ink-2">Switch themes whenever you like. Your links, icons and bio stay put, and every theme works with touch, a keyboard and a screen reader.</p>
          <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {THEMES.map((t) => (
              <li key={t.id}>
                <Link href={`/themes?t=${t.id}`} className="group block rounded-2xl bg-white p-3 ring-1 ring-line transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_30px_-20px_rgba(40,30,10,.5)]">
                  <span className="relative block h-24 overflow-hidden rounded-xl" style={{ background: t.swatch[0] }}>
                    <span className="absolute -bottom-4 -right-4 size-16 rounded-full transition-transform duration-300 ease-out group-hover:scale-110" style={{ background: t.swatch[1] }} />
                  </span>
                  <span className="mt-3 block font-semibold">{t.name}</span>
                  <span className="mt-0.5 block text-sm leading-snug text-ink-2">{t.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
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
