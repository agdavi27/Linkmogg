"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

export default function Wheel({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(() => Math.min(1, Math.max(0, n - 1)));
  const [drag, setDrag] = useState(0); // live drag offset, in cards
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);

  // Geometry: cards sit on a circle whose top edge crosses the middle of the stage.
  const cardW = Math.max(104, Math.min(w * 0.36, 230, h * 0.42));
  const cardH = cardW * 1.32;
  const R = Math.max(w * 0.9, cardW * 3.4);
  const step = ((cardW * 1.16) / R) * (180 / Math.PI); // degrees between cards
  const cy = h * 0.47 + R; // circle center, below the stage
  const pos = sel - drag;

  const go = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== sel) { tick(1500, 0.012, 0.04); buzz(5); }
    setSel(next);
  };
  const dragProps = useDragX(
    (dx) => setDrag(dx / ((cardW * 1.16))),
    (dx, vx) => { const fling = Math.round(dx / (cardW * 1.16) + vx * 0.9); setDrag(0); go(sel - fling); },
  );
  const current = data.links[sel];

  return (
    <ThemeRoot data={data} mode={mode} label="Wheel" className="lm-wh bg-[#f1f1ef] text-[#151515]">
      <header className="lm-wh-in relative z-10 flex shrink-0 items-end justify-between gap-4 px-5 pt-[clamp(14px,4cqh,40px)] @min-[640px]:px-10">
        <div className="min-w-0">
          <h1 className="font-serif text-[clamp(28px,8cqw,52px)] leading-[0.95] tracking-[-0.03em]">{data.displayName || `@${data.username}`}</h1>
          {data.bio ? <p className="mt-2 line-clamp-2 max-w-[44ch] text-[13px] leading-snug text-[#151515]/55">{data.bio}</p> : null}
        </div>
        <SocialRow socials={data.socials} mode={mode} className="hidden shrink-0 @min-[640px]:flex" iconClass="size-9! text-[#151515]/70 hover:bg-black/5" size={18} />
      </header>

      <div ref={stage} {...dragProps} className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowLeft") go(sel - 1); }}>
        {w > 0 ? (
          <div className={`absolute left-1/2 top-0 ${drag ? "" : "lm-wh-turn"}`} style={{ transform: `translateY(${cy}px) rotate(${-pos * step}deg)` }}>
            {data.links.map((l, i) => {
              const a = (i - pos) * step;
              if (Math.abs(a) > 75) return null;
              const on = i === sel;
              return (
                <div key={l.id} className="absolute left-0 top-0" style={{ transform: `rotate(${i * step}deg) translateY(${-R}px)` }}>
                  <button type="button" aria-label={on ? `Open ${l.title}` : `Show ${l.title}`} aria-current={on || undefined}
                    onClick={() => (on ? openRef.current?.click() : go(i))}
                    className={`lm-wh-card absolute block overflow-hidden rounded-[6px] outline-none ${on ? "is-on" : ""}`}
                    style={{ width: cardW, height: cardH, left: -cardW / 2, top: -cardH / 2, ["--i" as string]: i } as CSSProperties}>
                    <LinkArt link={l} className="lm-wh-art absolute inset-0" icon={Math.round(cardW * 0.28)} />
                    <span className="absolute inset-x-2.5 bottom-2 truncate text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-white mix-blend-difference">{l.title}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3" /> : null}
      </div>

      <div className="relative z-10 shrink-0 px-5 pb-2 @min-[640px]:px-10" aria-live="polite">
        <div className="mx-auto flex max-w-[520px] items-center gap-3">
          <button type="button" aria-label="Previous" onClick={() => go(sel - 1)} disabled={sel <= 0} className="lm-wh-arrow">‹</button>
          <div className="min-w-0 flex-1 text-center">
            {current ? (
              <div key={current.id} className="lm-pop">
                <p className="truncate font-serif text-[clamp(20px,5.5cqw,28px)] leading-tight tracking-[-0.02em]">{current.title}</p>
                <p className="mt-0.5 truncate font-mono text-[11px] text-[#151515]/45">{String(sel + 1).padStart(2, "0")} / {String(n).padStart(2, "0")} · {hostOf(current.url)}</p>
              </div>
            ) : null}
          </div>
          <button type="button" aria-label="Next" onClick={() => go(sel + 1)} disabled={sel >= n - 1} className="lm-wh-arrow">›</button>
        </div>
        {current ? (
          <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
            className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full bg-[#151515] px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-95">
            Open <span aria-hidden>↗</span>
          </a>
        ) : null}
        <SocialRow socials={data.socials} mode={mode} className="mt-1 @min-[640px]:hidden" iconClass="size-9! text-[#151515]/70 hover:bg-black/5" size={18} />
      </div>
    </ThemeRoot>
  );
}
