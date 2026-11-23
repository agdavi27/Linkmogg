"use client";

import { useRef, useState } from "react";
import { Avatar, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

export default function Sunflower({ data, mode }: ThemeProps) {
  const [active, setActive] = useState<number | null>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const n = data.links.length;
  const total = Math.max(n, 10); // keep the flower full with decorative petals
  const petalLen = n > 16 ? 32 : 36; // % of flower radius
  const current = active !== null ? data.links[active] : null;

  return (
    <ThemeRoot data={data} mode={mode} label="Sunflower"
      className="overflow-hidden bg-[linear-gradient(180deg,#bfe3f2_0%,#e8f4ec_55%,#f3ead0_100%)] text-[#2f2a12]">
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col items-center px-4 pt-8">
        <h1 className="text-center font-display text-2xl font-semibold tracking-[-0.02em]">{data.displayName || `@${data.username}`}</h1>
        {data.bio ? <p className="mt-1 max-w-[34ch] text-center text-sm text-[#5c5530] text-pretty">{data.bio}</p> : null}

        <div className="relative mt-6 aspect-square w-[min(360px,88vw)]" onMouseLeave={() => setActive(null)}>
          {Array.from({ length: total }).map((_, i) => {
            const angle = (360 / total) * i;
            const link = i < n ? data.links[i] : null;
            const on = active === i;
            const style = {
              transform: `rotate(${angle}deg) translateY(-28%) scale(${on ? 1.18 : active !== null ? 0.94 : 1})`,
              height: `${petalLen}%`,
              width: `${n > 16 ? 11 : 14}%`,
              marginLeft: `-${n > 16 ? 5.5 : 7}%`,
            } as React.CSSProperties;
            const cls = `lm-petal absolute left-1/2 top-1/2 origin-bottom rounded-[50%_50%_45%_45%/70%_70%_30%_30%] ${on ? "lm-petal-on" : ""}`;
            if (!link) return <span key={`d${i}`} aria-hidden className={`${cls} opacity-80`} style={{ ...style, marginTop: `-${petalLen}%` }} />;
            return (
              <button key={link.id} type="button" className={cls}
                style={{ ...style, marginTop: `-${petalLen}%` }}
                aria-label={`${link.title}${on ? ", press again to open" : ""}`}
                aria-pressed={on}
                onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}
                onClick={() => (on ? openRef.current?.click() : setActive(i))}
                onKeyDown={(e) => { if (e.key === "Escape") setActive(null); }} />
            );
          })}
          <div aria-hidden className="lm-seedhead absolute left-1/2 top-1/2 grid size-[38%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full">
            <Avatar data={data} size={96} className="size-[78%]! border-4 border-[#5a3a12]/40" />
          </div>
        </div>

        <div aria-hidden className="lm-stem -mt-3 h-14 w-2.5 rounded-full" />

        <div className="mt-2 min-h-[92px] w-full max-w-[340px]" aria-live="polite">
          {current ? (
            <div className="lm-pop flex items-center gap-3 rounded-2xl bg-white/80 p-3 shadow-[0_10px_30px_-18px_rgba(60,50,0,.6)] backdrop-blur">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{current.title}</p>
                <p className="truncate text-xs text-[#7a7140]">{hostOf(current.url)}</p>
              </div>
              <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
                className="shrink-0 rounded-full bg-[#2f2a12] px-4 py-2 text-sm font-semibold text-[#fde58a] transition-transform duration-150 ease-out active:scale-95">
                Open
              </a>
            </div>
          ) : (
            <p className="pt-4 text-center text-sm text-[#6f6840]">{n ? "Tap a petal to bloom it" : "No links yet."}</p>
          )}
        </div>
        <SocialRow socials={data.socials} mode={mode} className="mb-4 mt-2" iconClass="text-[#3a3415] hover:bg-white/50" />
      </div>
    </ThemeRoot>
  );
}
