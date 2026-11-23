"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

const DEPTH = 9; // how many pages show behind the front one

/** Your links as a deep stack of pages. Scroll or swipe and the next one comes forward. */
export default function StackVertical({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const total = n + 1; // a cover page about you, then one page per link
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const wheelAcc = useRef(0);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  const pw = Math.min(w * 0.88, 640);
  const ph = Math.min(pw * 0.62, h * 0.5);
  const go = (i: number) => {
    const next = Math.max(0, Math.min(total - 1, i));
    if (next !== sel) { tick(1100 + next * 40, 0.012, 0.03); buzz(4); }
    setSel(next);
  };
  const dragProps = useDragX(
    (dy) => setDrag(Math.max(-1, Math.min(1, dy / (ph * 0.6)))),
    (dy, vy) => { setDrag(0); if (Math.abs(dy) > 30 || Math.abs(vy) > 0.4) go(sel + (dy > 0 || vy > 0.4 ? 1 : -1)); },
    "y",
  );
  const pos = sel - drag * 0.6;

  return (
    <ThemeRoot data={data} mode={mode} label="Stack" badgeTone="light" className="lm-sk bg-[#0b0b0c] text-white">
      <div ref={stage} {...dragProps} tabIndex={-1}
        onWheel={(e) => { wheelAcc.current += e.deltaY; if (Math.abs(wheelAcc.current) > 70) { go(sel + Math.sign(wheelAcc.current)); wheelAcc.current = 0; } }}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(sel - 1); }}
        className="relative min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden outline-none active:cursor-grabbing"
        style={{ perspective: 1400 }}>
        {w > 0 ? Array.from({ length: total }, (_, i) => {
          const d = i - pos; // 0 is the front page, positive is further back
          if (d < -1.2 || d > DEPTH) return null;
          const link = i > 0 ? data.links[i - 1] : null;
          const on = i === sel;
          const back = Math.max(0, d);
          const style: CSSProperties = {
            width: pw, height: ph, left: (w - pw) / 2, top: h * 0.56 - ph / 2,
            transform: d < 0
              ? `translateY(${-d * h * 0.7}px) rotateX(${d * 25}deg)`
              : `translateY(${-back * ph * 0.16}px) translateZ(${-back * 70}px) rotateX(${Math.min(back, 3) * 7}deg)`,
            zIndex: 100 - Math.round(d * 2),
            filter: `brightness(${1 - Math.min(back, 6) * 0.08})`,
          };
          return (
            <button key={i} type="button" tabIndex={on ? 0 : -1} aria-hidden={!on || undefined}
              onClick={() => { if (on && link) openRef.current?.click(); else if (!on) go(i); }}
              aria-label={link ? `Open ${link.title}` : `About ${name}`}
              className={`lm-sk-page absolute flex flex-col overflow-hidden text-left outline-none ${drag ? "" : "is-anim"}`} style={style}>
              <span className="lm-sk-nav flex shrink-0 items-center justify-between px-[3%] text-[clamp(8px,1.9cqw,11px)]">
                <span className="font-semibold">{link ? hostOf(link.url) : `@${data.username}`}</span>
                <span className="opacity-60">{String(i).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
                <span className="lm-sk-pill px-2">{link ? "Visit" : "Hello"}</span>
              </span>
              {link ? (
                <span className="relative grid min-h-0 flex-1 grid-cols-[1.1fr_1fr]">
                  <span className="flex flex-col justify-between p-[4%]">
                    <span className="line-clamp-3 font-semibold leading-[0.98] tracking-[-0.04em]" style={{ fontSize: Math.max(18, Math.min(pw * 0.065, 40)) }}>{link.title}</span>
                    <span className="text-[clamp(9px,2.2cqw,12px)] opacity-60">{on ? "Tap to open ↗" : "Tap to bring forward"}</span>
                  </span>
                  <LinkArt link={link} className="m-[4%] ml-0 rounded-[4px]" icon={Math.round(ph * 0.14)} blur={0.4} />
                </span>
              ) : (
                <span className="flex min-h-0 flex-1 items-center gap-[5%] px-[6%]">
                  <Avatar data={data} size={Math.round(Math.min(ph * 0.42, 120))} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold leading-none tracking-[-0.045em]" style={{ fontSize: Math.max(22, Math.min(pw * 0.08, 48)) }}>{name}</span>
                    {data.bio ? <span className="mt-2 line-clamp-3 block text-[clamp(10px,2.4cqw,13px)] opacity-60">{data.bio}</span> : null}
                    <span className="mt-2 block text-[clamp(9px,2.2cqw,12px)] opacity-50">{n ? `${n} pages below · scroll to flip` : ""}</span>
                  </span>
                </span>
              )}
            </button>
          );
        }) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 bottom-8" /> : null}
      </div>
      <div className="relative z-10 flex shrink-0 flex-col items-center gap-1 pb-1" aria-live="polite">
        {sel > 0 ? (
          <a ref={openRef} key={sel} href={data.links[sel - 1].url} {...linkTarget(mode, data.links[sel - 1].url)} className="lm-pop max-w-[80%] truncate text-[13px] font-medium text-white/80 hover:underline">
            {data.links[sel - 1].title} ↗
          </a>
        ) : <p className="text-[12px] text-white/45">Scroll or swipe to flip through</p>}
        <SocialRow socials={data.socials} mode={mode} iconClass="size-9! text-white/75 hover:bg-white/10" size={18} />
      </div>
    </ThemeRoot>
  );
}
