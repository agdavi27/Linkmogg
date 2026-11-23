"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORIES, plateOf, themesIn } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";

/** A live, scaled-down phone. It only mounts once it scrolls near the viewport. */
function Mini({ id, scale }: { id: string; scale: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "400px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="plate-shadow relative overflow-hidden rounded-[26px] bg-[#0d0d0d] p-[5px]" style={{ width: 400 * scale + 10, height: 780 * scale + 10 }} inert>
      <div className="relative size-full overflow-hidden rounded-[21px] bg-black/20">
        {on ? (
          <div className="absolute left-0 top-0 h-[780px] w-[400px] origin-top-left overflow-hidden" style={{ transform: `scale(${scale})` }}>
            <ThemeRenderer themeId={id} data={DEMO} mode="preview" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** The whole catalog: one row per category, each theme photographed on its own color plate. */
export function ThemeReel() {
  return (
    <div className="flex flex-col gap-12">
      {CATEGORIES.map((c) => (
        <section key={c.id} aria-labelledby={`row-${c.id}`}>
          <div className="mx-auto flex max-w-6xl items-baseline justify-between gap-4 px-5 sm:px-8">
            <h3 id={`row-${c.id}`} className="type-title text-2xl">{c.name}</h3>
            <p className="hidden text-sm text-ink-3 sm:block">{c.blurb}</p>
          </div>
          <ul className="lm-rail mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-3 sm:px-8 [scroll-padding-inline:20px] sm:[scroll-padding-inline:32px]">
            {themesIn(c.id).map((t, k) => {
              const p = plateOf(t.id);
              const big = k === 0;
              return (
                <li key={t.id} className="snap-start">
                  <div className={`lm-tile plate group relative flex h-[400px] flex-col justify-between overflow-hidden rounded-[26px] p-5 ${big ? "w-[260px] sm:w-[560px]" : "w-[260px]"}`}
                    style={{ ["--plate" as string]: p.bg, ["--plate-ink" as string]: p.ink } as CSSProperties}>
                    <span className="relative z-10 flex items-start justify-between gap-3">
                      <span>
                        <Link href={`/themes?t=${t.id}`} className="type-title block text-[1.5rem] outline-none after:absolute after:inset-0 after:z-20 after:rounded-[26px]">{t.name}</Link>
                        {big ? <span className="mt-1 hidden max-w-[26ch] text-sm opacity-80 sm:block">{t.blurb}</span> : null}
                      </span>
                      <ArrowUpRight size={20} className="lm-tile-arrow shrink-0 opacity-70" aria-hidden />
                    </span>
                    <span className={`lm-tile-phone absolute bottom-[-70px] left-[calc(50%-89px)] ${big ? "sm:bottom-[-60px] sm:left-auto sm:right-8" : ""}`}>
                      <Mini id={t.id} scale={0.42} />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
