"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { Empty, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

const MINOR = 4; // small ticks between two links

/** A huge dial off the right edge. Turn it and each link comes round as a sticker. */
export default function Dial({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const wheelAcc = useRef(0);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  // The circle's left edge sits about a fifth of the way in; its center is off screen to the right.
  const R = w < 700 ? Math.max(260, Math.min(h * 0.62, w * 1.4)) : Math.max(h * 0.8, w * 0.62);
  const cx = (w < 700 ? Math.min(w * 0.2, 120) : w * 0.26) + R;
  const cy = h / 2;
  const itemR = R - Math.max(150, Math.min(R * 0.42, 240));
  const sticker = Math.max(56, Math.min(R * 0.2, 110));
  // degrees between links: at least 16, and wide enough that stickers never pile up
  const STEP = Math.max(16, ((sticker * 1.25) / itemR) * (180 / Math.PI));
  const pos = sel - drag;

  const go = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== sel) { tick(1700, 0.008, 0.05); buzz(3); }
    setSel(next);
  };
  const dragProps = useDragX(
    (dy) => setDrag(dy / (R * (STEP * Math.PI / 180))),
    (dy, vy) => { const fling = Math.round(dy / (R * (STEP * Math.PI / 180)) + vy * 0.8); setDrag(0); go(sel - fling); },
    "y",
  );
  const current = data.links[sel];
  const ticks = n ? (n - 1) * MINOR + 1 + MINOR * 6 : 0;

  return (
    <ThemeRoot data={data} mode={mode} label="Dial" badgeTone="light" className="lm-di bg-black text-white">
      <header className="relative z-20 flex shrink-0 items-start justify-between gap-4 px-[clamp(12px,3cqw,24px)] pt-[clamp(10px,2.4cqh,20px)]">
        <h1 className="truncate text-[clamp(16px,4.4cqw,22px)] font-semibold lowercase tracking-[-0.03em]">{name}</h1>
        <p className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-white/70">@{data.username}</p>
      </header>

      <div ref={stage} {...dragProps} tabIndex={-1}
        onWheel={(e) => { wheelAcc.current += e.deltaY; if (Math.abs(wheelAcc.current) > 50) { go(sel + Math.sign(wheelAcc.current)); wheelAcc.current = 0; } }}
        onKeyDown={(e) => { if (e.key === "ArrowDown" || e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(sel - 1); }}
        className="relative min-h-0 flex-1 cursor-grab touch-pan-x select-none overflow-hidden outline-none active:cursor-grabbing">
        {w > 0 ? (
          // Everything hangs off the dial's center and turns together.
          <div className={`lm-di-dial absolute ${drag ? "" : "lm-di-turn"}`} style={{ left: cx, top: cy, transform: `rotate(${pos * STEP}deg)` }}>
            {Array.from({ length: ticks }, (_, t) => {
              const a = (t - MINOR * 3) * (STEP / MINOR); // a little runway before the first link
              const major = (t - MINOR * 3) % MINOR === 0;
              return <span key={t} aria-hidden className={`lm-di-tick ${major ? "is-major" : ""}`} style={{ transform: `rotate(${180 - a}deg) translateX(${R}px)`, width: major ? 34 : 22 }} />;
            })}
            {data.links.map((l, i) => {
              const a = i * STEP;
              const d = Math.abs(i - pos);
              const on = i === sel;
              if (d > 9) return null;
              return (
                <div key={l.id} className="absolute left-0 top-0" style={{ transform: `rotate(${180 - a}deg)`, opacity: Math.max(0, 1 - d * 0.14) }}>
                  {/* the label, reading along the dial */}
                  <span className={`lm-di-label absolute whitespace-nowrap text-right ${on ? "is-on" : ""}`}
                    style={{ transform: `translateX(${R - 16}px) translateY(-50%) rotate(180deg)`, right: 0 }}>
                    <span className="block max-w-[min(26cqw,190px)] truncate">{l.title}</span>
                  </span>
                  {/* the sticker, upright */}
                  <div className="absolute" style={{ transform: `translateX(${itemR}px)` }}>
                    <button type="button" aria-label={on ? `Open ${l.title}` : `Show ${l.title}`} aria-current={on || undefined}
                      onClick={() => (on ? openRef.current?.click() : go(i))}
                      className={`lm-di-sticker absolute outline-none ${on ? "is-on" : ""} ${drag ? "" : "lm-di-turn"}`}
                      style={{ transform: `translate(-50%, -50%) rotate(${-(180 - a) - pos * STEP}deg)` }}>
                      <Sticker link={l} size={sticker} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {/* the one that's facing you */}
        {current && w > 0 ? (
          <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)}
            className="lm-pop absolute z-10 flex items-center gap-1.5 rounded-full border border-white/25 px-3 py-1 text-[11px] text-white/80 hover:bg-white hover:text-black"
            style={{ left: cx - R + 4, top: cy + 14 }}>
            {hostOf(current.url)} <span aria-hidden>↗</span>
          </a>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/2 text-white" /> : null}
      </div>

      <footer className="relative z-20 flex shrink-0 justify-between gap-3 px-[clamp(12px,3cqw,24px)] pb-1 text-[10.5px] uppercase tracking-[0.08em]">
        {data.socials.length ? data.socials.slice(0, 3).map((s, i) => (
          <a key={i} href={s.url} {...linkTarget(mode, s.url)} className="text-white/75 hover:text-white">{platformLabel(s.platform)}</a>
        )) : <span className="text-white/50">{data.bio}</span>}
      </footer>
    </ThemeRoot>
  );
}

/** Each link gets a sticker style of its own: a round photo, a tile, an outlined pill or a word with a squiggle. */
function Sticker({ link, size }: { link: ThemeLink; size: number }) {
  const k = hash(link.id + link.title);
  const kind = k % 4;
  const tilt = ((k >>> 5) % 30) - 15;
  let body: ReactNode;
  if (kind === 0) {
    body = <LinkArt link={link} className="rounded-full" style={{ width: size, height: size }} icon={Math.round(size * 0.3)} blur={0.3} />;
  } else if (kind === 1) {
    body = <LinkArt link={link} className="rounded-[18%]" style={{ width: size * 0.92, height: size * 0.78 }} icon={Math.round(size * 0.28)} blur={0.3} />;
  } else if (kind === 2) {
    body = (
      <span className="lm-di-pill grid place-items-center rounded-full border-2 border-white px-[0.7em] font-medium uppercase"
        style={{ fontSize: size * 0.22, height: size * 0.56, maxWidth: size * 2 }}>
        <span className="truncate">{link.title.split(" ")[0]}</span>
      </span>
    );
  } else {
    body = (
      <span className="relative block font-semibold tracking-[-0.03em]" style={{ fontSize: size * 0.32 }}>
        <span className="block max-w-[6em] truncate">{link.title.split(" ").slice(0, 2).join(" ")}</span>
        <svg aria-hidden viewBox="0 0 100 10" className="absolute -bottom-[0.25em] left-0 w-full" preserveAspectRatio="none" height={size * 0.09}>
          <path d="M0 5 Q 6 0 12 5 T 24 5 T 36 5 T 48 5 T 60 5 T 72 5 T 84 5 T 96 5" fill="none" stroke="#ff4b2b" strokeWidth="2.4" />
        </svg>
      </span>
    );
  }
  return <span className="block" style={{ transform: `rotate(${tilt}deg)` } as CSSProperties}>{body}</span>;
}
