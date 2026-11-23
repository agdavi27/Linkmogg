"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { THEMES } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";

/** A live, scaled-down copy of a theme. Mounts only once it scrolls near the viewport. */
function Mini({ id }: { id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: "300px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative h-[380px] w-[200px] overflow-hidden rounded-[22px] bg-paper-2" inert>
      {on ? (
        <div className="absolute left-0 top-0 h-[760px] w-[400px] origin-top-left scale-50 overflow-hidden">
          <ThemeRenderer themeId={id} data={DEMO} mode="preview" />
        </div>
      ) : null}
    </div>
  );
}

export function ThemeReel() {
  const row = [...THEMES, ...THEMES];
  return (
    <div className="lm-marquee-wrap relative overflow-hidden py-4 [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
      <ul className="lm-marquee flex w-max gap-5" aria-label="Every theme">
        {row.map((t, i) => (
          <li key={`${t.id}-${i}`} aria-hidden={i >= THEMES.length || undefined}>
            <div className="lm-marquee-card relative rounded-[30px] bg-ink p-[6px] shadow-[0_30px_50px_-30px_rgba(30,20,0,.6)] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-accent">
              <Mini id={t.id} />
              <span className="flex items-center justify-between gap-2 px-2.5 pb-1.5 pt-2.5 text-paper">
                <Link href={`/themes?t=${t.id}`} tabIndex={i >= THEMES.length ? -1 : 0} className="font-semibold outline-none after:absolute after:inset-0 after:rounded-[30px]">{t.name}</Link>
                <span className={`text-[10px] font-bold tracking-wider ${t.pro ? "text-paper/50" : "text-[#8fe3b5]"}`}>{t.pro ? "PRO" : "FREE"}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
