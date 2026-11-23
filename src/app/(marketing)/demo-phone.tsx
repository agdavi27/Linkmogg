"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { THEMES } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";
import { useParallax } from "@/themes/motion";

const FEATURED = ["gloss", "pocket", "orbit", "sunflower", "bookshelf", "prism", "signal", "field"];
const CYCLE_MS = 5200;

/** Little hand-built objects from the themes, floating around the phone at different depths. */
function Floaters() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="lm-float" style={{ left: "-6%", top: "12%", ["--d" as string]: 1.4, animationDelay: "-1s" } as CSSProperties}>
        <span className="lm-fl-cassette"><i /><i /></span>
      </span>
      <span className="lm-float" style={{ right: "-4%", top: "6%", ["--d" as string]: 2.2, animationDelay: "-3s" } as CSSProperties}>
        <span className="lm-fl-icon" />
      </span>
      <span className="lm-float" style={{ right: "-10%", top: "52%", ["--d" as string]: 1, animationDelay: "-2s" } as CSSProperties}>
        <span className="lm-fl-flower">{Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ rotate: `${i * 30}deg` }} />)}</span>
      </span>
      <span className="lm-float" style={{ left: "-12%", top: "60%", ["--d" as string]: 1.8, animationDelay: "-4s" } as CSSProperties}>
        <span className="lm-fl-wheel"><i /></span>
      </span>
      <span className="lm-float" style={{ left: "6%", bottom: "2%", ["--d" as string]: 2.6, animationDelay: "-2.5s" } as CSSProperties}>
        <span className="lm-fl-polaroid" />
      </span>
    </div>
  );
}

export function DemoPhone() {
  const [id, setId] = useState(FEATURED[0]);
  const [paused, setPaused] = useState(false);
  const [cycle, setCycle] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => {
      setId((cur) => FEATURED[(FEATURED.indexOf(cur) + 1) % FEATURED.length]);
      setCycle((c) => c + 1);
    }, CYCLE_MS);
    return () => clearTimeout(t);
  }, [id, paused, cycle]);

  return (
    <div ref={stage} className="relative flex flex-col items-center gap-5"
      onPointerEnter={(e) => { if (e.pointerType === "mouse") setPaused(true); }}
      onPointerLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)}>
      <div className="relative">
        <Floaters />
        <div className="lm-hero-phone relative w-[min(330px,82vw)] rounded-[46px] bg-ink p-[10px] shadow-[0_50px_90px_-40px_rgba(30,20,0,.75),0_0_0_1px_rgba(0,0,0,.2)]">
          <div className="relative h-[620px] overflow-hidden rounded-[36px] [transform:translateZ(0)]">
            <div key={id} className="lm-swap absolute inset-0 flex flex-col overflow-hidden">
              <ThemeRenderer themeId={id} data={DEMO} mode="preview" />
            </div>
          </div>
        </div>
      </div>
      <div role="group" aria-label="Try a theme" className="flex max-w-[420px] flex-wrap justify-center gap-1.5">
        {FEATURED.map((t) => {
          const def = THEMES.find((x) => x.id === t)!;
          const on = id === t;
          return (
            <button key={t} type="button" onClick={() => { setId(t); setPaused(true); }} aria-pressed={on}
              className={`relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-sm font-medium transition-[background-color,color,transform] duration-200 active:scale-95 ${on ? "bg-ink text-paper" : "bg-white text-ink-2 ring-1 ring-line hover:text-ink"}`}>
              {on && !paused ? <span key={cycle} aria-hidden className="lm-chip-timer" style={{ animationDuration: `${CYCLE_MS}ms` }} /> : null}
              <span aria-hidden className="relative size-3 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${def.swatch[0]} 50%, ${def.swatch[1]} 50%)` }} />
              <span className="relative">{def.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
