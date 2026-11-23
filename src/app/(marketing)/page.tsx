import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { hostLabel, PRICE_LABEL, TRIAL_DAYS } from "@/lib/config";
import { THEMES } from "@/themes/registry";
import { ClaimInput } from "./claim-input";
import { HeroPlate } from "./demo-phone";
import { ThemeReel } from "./theme-reel";

const COUNT = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty", "Twenty-one", "Twenty-two", "Twenty-three", "Twenty-four", "Twenty-five"];

export default function Home() {
  const host = hostLabel();
  const count = COUNT[THEMES.length] ?? String(THEMES.length);
  return (
    <main>
      <HeroPlate>
        <h1 className="type-plate text-[clamp(3.4rem,10vw,7.2rem)]">Your links, made into things people touch.</h1>
        <p className="mt-6 max-w-[44ch] text-lg leading-relaxed opacity-85 text-pretty">
          One page for everything you post, set inside a click wheel, a desktop in the grass, a row of CD cases or an old ID card. Visitors stay because there&apos;s something to play with.
        </p>
        <div className="mt-8"><ClaimInput host={host} /></div>
        <p className="mt-3 text-sm opacity-75">Every theme free for {TRIAL_DAYS} days. No card needed.</p>
        <p className="mt-1.5 text-sm">
          <Link href="/convert" className="font-semibold underline">Already on Linktree? Bring your page over</Link>
        </p>
      </HeroPlate>

      <section className="pb-6 pt-20 sm:pt-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h2 className="type-plate max-w-[14ch] text-[clamp(2.6rem,6vw,4.6rem)]">{count} themes. Same links inside each.</h2>
            <Link href="/themes" className="btn btn-primary">Try them live <ArrowRight size={16} /></Link>
          </div>
          <p className="mt-5 max-w-[60ch] text-ink-2">Switch whenever you like. Your links, icons and bio stay put, and every theme works with touch, a keyboard and a screen reader.</p>
        </div>
        <div className="mt-12"><ThemeReel /></div>
      </section>

      <section className="px-2 py-14 sm:px-3">
        <div className="plate grid gap-8 rounded-[28px] px-6 py-12 sm:rounded-[36px] sm:px-10 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:items-end"
          style={{ ["--plate" as string]: "var(--cobalt)" }}>
          <h2 className="type-plate text-[clamp(2.4rem,6vw,4.4rem)]">On Linktree already? Paste it, keep what you want.</h2>
          <div>
            <p className="max-w-[44ch] text-lg leading-relaxed opacity-85">Paste your links, pick the ones to keep, and see them in any theme before you sign up. It takes about a minute.</p>
            <Link href="/convert" className="btn btn-light mt-6">Convert my page <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-2 pb-16 sm:px-3">
        <div className="plate grid gap-10 rounded-[28px] px-6 py-12 sm:rounded-[36px] sm:px-10 sm:py-16 lg:grid-cols-2"
          style={{ ["--plate" as string]: "var(--ink)" }}>
          <div>
            <h2 className="type-plate text-[clamp(2.4rem,6vw,4.4rem)]">One plan. Try all of it first.</h2>
            <p className="mt-5 flex items-baseline gap-2">
              <span className="type-plate tabular text-[clamp(3rem,7vw,5rem)] text-accent">{PRICE_LABEL.split("/")[0]}</span>
              <span className="text-lg opacity-70">a month, after {TRIAL_DAYS} free days</span>
            </p>
          </div>
          <div className="flex flex-col justify-end">
            <ul className="flex flex-col divide-y divide-white/12 border-y border-white/12 text-[15px]">
              {[`Every theme free for ${TRIAL_DAYS} days`, "No credit card to start", "Unlimited links and socials", "No badge once you subscribe", "Cancel any time. Your page stays up in Classic."].map((f) => (
                <li key={f} className="flex gap-3 py-3"><Check size={18} className="mt-0.5 shrink-0 text-accent" aria-hidden />{f}</li>
              ))}
            </ul>
            <Link href="/login" className="btn btn-accent mt-7 self-start">Start my free trial <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
