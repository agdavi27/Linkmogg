"use client";

import { useRef, useState, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, Empty, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

const BARS = Array.from({ length: 56 }, (_, i) => {
  const k = hash(`wv${i}`);
  return { h: 18 + (k % 70), d: ((k >> 8) % 100) / 100 };
});

export default function Spindle({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(() => Math.max(0, Math.floor((data.links.length - 1) / 2)));
  const [drag, setDrag] = useState(0); // in discs
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const wheelAcc = useRef(0);
  const { w, h } = useSize(stage);

  // The focused disc faces you; the rest are seen edge-on, stacked above and below it.
  const big = Math.max(120, Math.min(w * 0.7, h * 0.46, 330));
  const small = big * 0.62;
  const pitch = small * 0.26; // vertical spacing between edge-on discs
  const pos = sel - drag;

  const go = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== sel) { tick(1700 + (next % 5) * 120, 0.012, 0.04); buzz(5); }
    setSel(next);
  };
  const dragProps = useDragX((dy) => setDrag(dy / pitch / 1.4), (dy, vy) => { setDrag(0); go(sel - Math.round(dy / pitch / 1.4 + vy * 1.5)); }, "y");
  const current = data.links[sel];
  const upNext = n ? [1, 2, 3].map((k) => data.links[(sel + k) % n]).filter((l, i, a) => l && l.id !== current?.id && a.indexOf(l) === i) : [];

  return (
    <ThemeRoot data={data} mode={mode} label="Spindle" badgeTone="light" className="lm-sp bg-black text-white">
      <header className="relative z-20 flex shrink-0 items-center justify-between gap-3 px-5 pt-[clamp(12px,3cqh,28px)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar data={data} size={34} className="bg-white/10! text-white" />
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-tight">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="truncate text-[11.5px] text-white/50">{data.bio}</p> : null}
          </div>
        </div>
        {data.socials.length ? (
          <ul className="flex shrink-0 gap-0.5" aria-label="Social profiles">
            {data.socials.slice(0, 4).map((s, i) => (
              <li key={i}>
                <a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)} className="grid size-8 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10">
                  <SocialIcon platform={s.platform} size={16} />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div ref={stage} {...dragProps} className="relative min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden active:cursor-grabbing"
        onWheel={(e) => { wheelAcc.current += e.deltaY; if (Math.abs(wheelAcc.current) > 50) { go(sel + Math.sign(wheelAcc.current)); wheelAcc.current = 0; } }}
        onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); go(sel + 1); } if (e.key === "ArrowUp") { e.preventDefault(); go(sel - 1); } }}>
        <div aria-hidden className="lm-sp-glow" />
        {w > 0 ? data.links.map((l, i) => {
          const d = i - pos;
          const ad = Math.abs(d);
          if (ad > 9) return null;
          const on = i === sel;
          const t = Math.min(1, ad); // 0 = face-on, 1 = edge-on
          const size = big + (small - big) * t;
          const shrink = Math.pow(0.94, Math.max(0, ad - 1));
          const y = Math.sign(d) * (ad < 1 ? ad * (big * 0.42 + small * 0.12) : big * 0.42 + small * 0.12 + (ad - 1) * pitch);
          const style = {
            width: size, height: size, left: "50%", top: "50%",
            transform: `translate(-50%, -50%) translateY(${y.toFixed(1)}px) scale(${shrink.toFixed(3)}, ${(shrink * (1 - 0.7 * t)).toFixed(3)})`,
            zIndex: 100 - Math.round(ad * 3) + (d > 0 ? 1 : 0),
            opacity: ad > 7 ? Math.max(0, 8 - ad) : 1,
          } as CSSProperties;
          return (
            <button key={l.id} type="button" onClick={() => (on ? openRef.current?.click() : go(i))}
              aria-label={on ? `Open ${l.title}` : `Show ${l.title}`} aria-current={on || undefined}
              className={`lm-sp-disc absolute rounded-full outline-none ${drag ? "" : "is-anim"} ${on ? "is-on" : ""}`} style={style}>
              <LinkArt link={l} className="size-full rounded-full" icon={Math.round(big * 0.2)} />
              <span aria-hidden className="lm-sp-sheen" />
            </button>
          );
        }) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3 text-white" /> : null}
      </div>

      <div className="relative z-20 mx-auto w-full max-w-[540px] shrink-0 px-4 pb-1" aria-live="polite">
        {current ? (
          <>
            <div className="flex items-center gap-3 overflow-hidden px-1 pb-2 text-[13px]">
              <a ref={openRef} href={current.url} key={current.id} {...linkTarget(mode, current.url)}
                className="lm-pop flex shrink-0 items-center gap-1.5 font-semibold outline-none focus-visible:underline">
                <span className="max-w-[52cqw] truncate">{current.title}</span><span aria-hidden className="grid size-4 place-items-center rounded-[3px] border border-white/70 text-[9px]">↗</span>
              </a>
              <div aria-hidden className="lm-sp-next min-w-0 flex-1 overflow-hidden whitespace-nowrap text-white/45">
                <span>{upNext.map((l) => l.title).join("   ·   ")}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-[14px] bg-white/[.07] px-3 py-2.5">
              <div aria-hidden className="lm-sp-wave flex h-8 min-w-0 flex-1 items-center gap-[2px]">
                {BARS.map((b, i) => (
                  <i key={i} className={i / BARS.length <= (sel + 1) / n ? "is-past" : ""} style={{ height: `${b.h}%`, animationDelay: `${-b.d * 1.2}s` }} />
                ))}
              </div>
              <span className="shrink-0 font-mono text-[10.5px] tabular text-white/50">{String(sel + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}</span>
              <button type="button" aria-label="Next link" onClick={() => go(sel + 1 >= n ? 0 : sel + 1)} className="grid size-8 shrink-0 place-items-center rounded-full text-white/85 transition-[background-color,transform] duration-150 hover:bg-white/10 active:scale-90">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M2 2l7 5-7 5z" /><path d="M12 2v10" /></svg>
              </button>
            </div>
            <p className="pt-1.5 text-center text-[11px] text-white/40">Swipe the stack · {hostOf(current.url)}</p>
          </>
        ) : null}
      </div>
    </ThemeRoot>
  );
}
