"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

// Flat cloth colors for the spines: [spine, text]
const CLOTH: [string, string][] = [
  ["#b8643f", "#fbe9dc"], ["#a9a9a7", "#141414"], ["#2b2b2b", "#f2f2f2"], ["#c9c9c6", "#1a1a1a"],
  ["#1a1a1a", "#e8e8e8"], ["#e9e4d8", "#1a1a1a"], ["#3e4a3f", "#e8efe6"], ["#6b2e2e", "#f6e6e0"],
];

export default function Bookshelf({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(() => Math.max(0, Math.floor((n - 1) / 2)));
  const shelf = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(shelf);

  // Sizes come from the space available: one book shows its cover, the rest show spines.
  const H0 = Math.max(160, Math.min(h * 0.86, 440));
  const coverW = Math.min(H0 * 0.72, w * 0.46);
  const H = Math.min(H0, coverW * 1.42);
  const gap = Math.max(4, Math.min(12, w * 0.02));
  const spineW = n > 1 ? Math.max(18, Math.min(H0 * 0.17, (w * 0.96 - coverW - gap * n) / (n - 1))) : 0;
  const depth = Math.max(18, spineW); // the book's thickness: exactly its spine when turned

  // Keep the open book centered; when everything fits, center the whole row instead.
  const total = n > 0 ? coverW + (n - 1) * (depth + gap) : 0;
  const rowX = total <= w ? (w - total) / 2 : Math.max(w - total, Math.min(0, w / 2 - (sel * (depth + gap) + coverW / 2)));

  const go = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== sel) { tick(420, 0.03, 0.04); buzz(6); }
    setSel(next);
  };
  const drag = useDragX(() => {}, (dx) => { if (Math.abs(dx) > 30) go(sel + (dx < 0 ? 1 : -1)); });
  const current = data.links[sel];
  const name = data.displayName || data.username;

  return (
    <ThemeRoot data={data} mode={mode} label="Bookshelf" badgeTone="light" className="lm-bk2 bg-[#050505] text-[#f2f2f2]">
      <header className="lm-bk2-in shrink-0 px-5 pt-[clamp(18px,6cqh,64px)] text-center">
        <h1 className="flex items-center justify-center gap-4 font-serif text-[clamp(18px,5.2cqw,30px)] uppercase tracking-[0.02em] [font-stretch:condensed]">
          <span aria-hidden className="h-px w-[clamp(24px,10cqw,90px)] bg-white/80" />
          <span className="min-w-0 truncate">{name}</span>
          <span aria-hidden className="h-px w-[clamp(24px,10cqw,90px)] bg-white/80" />
        </h1>
        {data.bio ? <p className="mx-auto mt-2 line-clamp-2 max-w-[44ch] text-[13px] leading-snug text-white/55">{data.bio}</p> : null}
      </header>

      <div ref={shelf} {...drag} className="lm-bk2-shelf relative flex min-h-0 flex-1 touch-pan-y select-none items-center justify-center"
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowLeft") go(sel - 1); }}>
        {w > 0 ? (
          <ul className="lm-bk2-row absolute left-0 flex items-center" style={{ gap, transform: `translateX(${rowX}px)` }} aria-label="Books">
            {data.links.map((l, i) => {
              const on = i === sel;
              const [cloth, ink] = CLOTH[hash(l.id + l.title) % CLOTH.length];
              const fs = Math.max(9.5, Math.min(17, depth * 0.36));
              return (
                <li key={l.id} className="lm-bk2-slot relative" style={{ width: on ? coverW : depth, height: H, animationDelay: `${i * 60}ms` }}>
                  <button type="button" onClick={() => (on ? openRef.current?.click() : go(i))}
                    aria-label={on ? `Open ${l.title}` : l.title} aria-current={on || undefined}
                    className={`lm-bk2-book absolute left-1/2 top-0 outline-none ${on ? "is-on" : ""}`}
                    style={{ width: coverW, height: H, marginLeft: -coverW / 2, ["--depth" as string]: `${depth}px`, ["--cloth" as string]: cloth, ["--ink" as string]: ink } as CSSProperties}>
                    {/* front cover */}
                    <span className="lm-bk2-cover absolute inset-0 flex flex-col items-center p-[9%] text-[#111]">
                      <LinkArt link={l} className="aspect-square w-[78%] rounded-[22%] blur-[0.3px]" icon={Math.round(coverW * 0.16)} />
                      <span className="mt-auto line-clamp-2 text-center text-[clamp(13px,calc(var(--cw)*0.075),22px)] font-black uppercase leading-[1.05] tracking-[-0.01em]" style={{ ["--cw" as string]: `${coverW}px` } as CSSProperties}>{l.title}</span>
                      <span className="mt-1.5 truncate text-[10px] text-[#111]/60">{hostOf(l.url)}</span>
                    </span>
                    {/* spine */}
                    <span className="lm-bk2-spine absolute top-0 flex h-full items-start justify-center py-[10%]" style={{ width: depth, left: -depth / 2 }}>
                      <span className="lm-bk2-title truncate font-semibold" style={{ fontSize: fs, color: ink }}>{l.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {n === 0 ? <Empty className="text-white" /> : null}
      </div>

      <div className="relative z-10 shrink-0 px-5 pb-1" aria-live="polite">
        {current ? (
          <div className="mx-auto flex max-w-[420px] items-center gap-3">
            <button type="button" aria-label="Previous book" onClick={() => go(sel - 1)} disabled={sel <= 0} className="lm-bk2-arrow">‹</button>
            <a ref={openRef} href={current.url} key={current.id} {...linkTarget(mode, current.url)}
              className="lm-pop flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-sm font-medium transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-[.98]">
              <span className="truncate">Read {current.title}</span><span aria-hidden>↗</span>
            </a>
            <button type="button" aria-label="Next book" onClick={() => go(sel + 1)} disabled={sel >= n - 1} className="lm-bk2-arrow">›</button>
          </div>
        ) : null}
        <SocialRow socials={data.socials} mode={mode} className="mt-1" iconClass="size-9! text-white/70 hover:bg-white/10" size={18} />
      </div>
    </ThemeRoot>
  );
}
