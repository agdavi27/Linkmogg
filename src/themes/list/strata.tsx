"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX } from "../motion";
import type { ThemeProps } from "../types";

// Folder colors, cycled through the stack.
const FOLDER = ["#7fb2f0", "#f2c14e", "#e9e4d8", "#9bd3b0", "#f19a8e", "#b7a6f0", "#cfd5dc"];

export default function Strata({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState(0);
  const openRef = useRef<HTMLAnchorElement>(null);
  const wheelAcc = useRef(0);

  const go = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== sel) { tick(1900, 0.01, 0.035); buzz(4); }
    setSel(next);
  };
  const dragProps = useDragX((dx) => setDrag(dx / 70), (dx, vx) => { setDrag(0); go(sel - Math.round(dx / 70 + vx * 2)); });
  const pos = sel - drag;
  const current = data.links[sel];

  return (
    <ThemeRoot data={data} mode={mode} label="Strata" className="lm-st bg-white text-[#111]">
      <header className="relative z-20 flex shrink-0 items-start gap-1.5 px-3 pt-3 @min-[640px]:px-6 @min-[640px]:pt-5">
        <div className="lm-st-chip min-w-0 flex-1">
          <h1 className="truncate text-[11px] font-semibold uppercase tracking-[0.06em]">{data.displayName || `@${data.username}`} <span aria-hidden className="text-[#2a46ff]">®</span> Links</h1>
        </div>
        <div className="lm-st-chip hidden max-w-[45%] text-[11px] uppercase tracking-[0.06em] text-[#111]/45 @min-[480px]:block"><p className="truncate">{data.bio || "Index"}</p></div>
        <div className="lm-st-chip shrink-0 text-[11px] font-semibold tabular uppercase tracking-[0.06em]">{String(sel + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}</div>
      </header>

      <div className="relative min-h-0 flex-1">
        <div {...dragProps} className="lm-st-scene absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
          onWheel={(e) => { wheelAcc.current += e.deltaY + e.deltaX; if (Math.abs(wheelAcc.current) > 60) { go(sel + Math.sign(wheelAcc.current)); wheelAcc.current = 0; } }}>
          <div className="lm-st-rig">
            {data.links.map((l, i) => {
              const d = i - pos;
              const on = i === sel;
              return (
                <button key={l.id} type="button" onClick={() => (on ? openRef.current?.click() : go(i))}
                  aria-label={on ? `Open ${l.title}` : `Show ${l.title}`} aria-current={on || undefined}
                  className={`lm-st-pane absolute outline-none ${drag ? "" : "is-anim"} ${on ? "is-on" : ""}`}
                  style={{ ["--d" as string]: d, zIndex: 100 - Math.round(Math.abs(d) * 2), opacity: d < -1.5 ? 0 : 1 } as CSSProperties}>
                  {/* a folder: back with a tab, a photo tucked inside, and a front flap with the label */}
                  <span className="lm-st-back absolute inset-0" style={{ ["--fc" as string]: FOLDER[i % FOLDER.length] } as CSSProperties} />
                  <span className="lm-st-paper absolute">
                    <LinkArt link={l} className="absolute inset-[6%] rounded-[3px]" icon={30} blur={0.4} />
                  </span>
                  <span className="lm-st-front absolute inset-x-0 bottom-0" style={{ ["--fc" as string]: FOLDER[i % FOLDER.length] } as CSSProperties}>
                    <span className="absolute inset-x-[6%] bottom-[12%] flex items-end justify-between gap-2 text-left">
                      <span className="min-w-0">
                        <span className="block truncate text-[clamp(13px,3.6cqw,17px)] font-semibold leading-tight">{l.title}</span>
                        <span className="block truncate text-[10.5px] opacity-60">{hostOf(l.url)}</span>
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold tabular opacity-60">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3" /> : null}

        <ul className="absolute right-3 top-3 z-20 hidden max-h-[calc(100%-90px)] flex-col items-end gap-1 overflow-hidden @min-[560px]:flex" aria-label="Index">
          {data.links.map((l, i) => (
            <li key={l.id}>
              <button type="button" onClick={() => go(i)} aria-pressed={i === sel}
                className={`lm-st-chip text-[10.5px] uppercase tracking-[0.06em] transition-colors ${i === sel ? "bg-[#111]! text-white" : "text-[#111]/55 hover:text-[#111]"}`}>
                {l.title}<sup className="ml-1 opacity-60">{String(i + 1).padStart(2, "0")}</sup>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative z-20 flex shrink-0 items-end justify-between gap-3 px-3 pb-2 @min-[640px]:px-6" aria-live="polite">
        {current ? (
          <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
            className="lm-st-visit group flex min-w-0 max-w-[75%] items-center gap-2.5 rounded-[18px] px-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-[#2a46ff]">
            <span aria-hidden className="text-[22px] leading-none transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>
            <span key={current.id} className="lm-pop min-w-0">
              <span className="block truncate text-[clamp(16px,4.6cqw,22px)] font-medium leading-tight">{current.title}</span>
              <span className="block truncate text-[11px] text-[#111]/50">{hostOf(current.url)}</span>
            </span>
          </a>
        ) : <span />}
        <div className="flex shrink-0 gap-1">
          <button type="button" aria-label="Previous" onClick={() => go(sel - 1)} className="lm-st-chip size-9 text-lg leading-none">‹</button>
          <button type="button" aria-label="Next" onClick={() => go(sel + 1)} className="lm-st-chip size-9 text-lg leading-none">›</button>
        </div>
      </div>
      <SocialRow socials={data.socials} mode={mode} className="relative z-20 shrink-0" iconClass="size-9! text-[#111]/70 hover:bg-black/5" size={18} />
    </ThemeRoot>
  );
}
