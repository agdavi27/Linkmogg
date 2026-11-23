"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTheme, plateOf } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";
import { useParallax } from "@/themes/motion";

const FEATURED = ["pocket", "meadow", "glow", "billboard", "cases", "sunflower", "id", "stack", "garden", "museum"];
const CYCLE_MS = 5600;

/**
 * The hero: a color plate that takes the color of whichever theme the phone is showing.
 * The copy (children) sits on the plate; the phone is the object photographed on it.
 */
export function HeroPlate({ children }: { children: ReactNode }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const id = FEATURED[i];
  const t = getTheme(id);
  const plate = plateOf(id);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setTimeout(() => setI((x) => (x + 1) % FEATURED.length), CYCLE_MS);
    return () => clearTimeout(timer);
  }, [i, paused]);

  const go = (d: number) => { setPaused(true); setI((x) => (x + d + FEATURED.length) % FEATURED.length); };

  return (
    <section ref={stage} className="plate relative mx-2 overflow-hidden rounded-[28px] sm:mx-3 sm:rounded-[36px]"
      style={{ ["--plate" as string]: plate.bg, ["--plate-ink" as string]: plate.ink } as CSSProperties}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 pb-10 pt-12 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:gap-6 lg:py-16">
        <div className="lm-enter">{children}</div>

        <div className="flex flex-col items-center"
          onPointerEnter={(e) => { if (e.pointerType === "mouse") setPaused(true); }}
          onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)}>
          <div className="lm-hero-phone plate-shadow relative w-[min(318px,80vw)] rounded-[46px] bg-[#0d0d0d] p-[9px]">
            <div className="relative h-[min(600px,70vh)] min-h-[480px] overflow-hidden rounded-[37px] [transform:translateZ(0)]">
              <div key={id} className="lm-swap absolute inset-0 flex flex-col overflow-hidden">
                <ThemeRenderer themeId={id} data={DEMO} mode="preview" />
              </div>
            </div>
          </div>
          {/* the catalog caption under the object */}
          <div className="mt-6 flex w-[min(360px,86vw)] items-center gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Previous theme" className="lm-hero-nav grid size-10 shrink-0 place-items-center rounded-full"><ChevronLeft size={18} /></button>
            <p className="min-w-0 flex-1 text-center" aria-live="polite">
              <span key={id} className="lm-pop block">
                <span className="type-title block text-[1.35rem]">{t.name}</span>
                <span className="mt-0.5 block truncate text-[13px] opacity-75">{t.blurb}</span>
              </span>
            </p>
            <button type="button" onClick={() => go(1)} aria-label="Next theme" className="lm-hero-nav grid size-10 shrink-0 place-items-center rounded-full"><ChevronRight size={18} /></button>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {FEATURED.map((f, k) => <span key={f} className={`h-1.5 rounded-full bg-current transition-[width,opacity] duration-500 ${k === i ? "w-5 opacity-90" : "w-1.5 opacity-30"}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
