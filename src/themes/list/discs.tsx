"use client";

import { useRef, useState, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { Empty, ThemeRoot, hash, hostOf, initials, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

// A loop drawn by hand, a little past where it started.
const LOOP = "M104 10 C158 8 194 50 192 104 C190 160 146 193 96 191 C42 189 7 150 9 98 C11 45 52 11 110 13 C150 15 182 38 191 66";

/** A row of discs. Slide through them; the one in the middle gets circled in marker. */
export default function Discs({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const wheelAcc = useRef(0);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  const D = Math.max(140, Math.min(w * (w < 620 ? 0.62 : 0.36), h * 0.58, 440));
  const gapX = D * 0.74;
  const pos = sel - drag;

  const go = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== sel) { tick(1100, 0.014, 0.04); buzz(5); }
    setSel(next);
  };
  const dragProps = useDragX(
    (dx) => setDrag(dx / gapX),
    (dx, vx) => { const fling = Math.round(dx / gapX + vx * 0.8); setDrag(0); go(sel - fling); },
  );
  const current = data.links[sel];

  return (
    <ThemeRoot data={data} mode={mode} label="Discs" className="lm-dc bg-[#efeeeb] text-[#141414]">
      {/* top: the chosen link like a film's credits, the name in the middle, socials on the right */}
      <header className="relative z-20 grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4 px-[clamp(14px,4cqw,36px)] pt-[clamp(12px,3cqh,28px)] @min-[700px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="min-w-0 max-w-[260px]" aria-live="polite">
          <p key={current?.id ?? "none"} className="lm-pop truncate font-serif text-[clamp(20px,5.4cqw,30px)] uppercase leading-none tracking-[-0.01em]">{current ? current.title : name}</p>
          <dl className="mt-2 text-[10px] uppercase tracking-[0.08em]">
            <div className="flex justify-between gap-3 border-t border-black/25 py-0.5"><dt className="text-black/50">Link</dt><dd className="truncate normal-case tracking-normal">{current ? hostOf(current.url) : "—"}</dd></div>
            <div className="flex justify-between gap-3 border-t border-black/25 py-0.5"><dt className="text-black/50">No.</dt><dd className="tabular">{n ? `${sel + 1} of ${n}` : "—"}</dd></div>
            <div className="flex justify-between gap-3 border-t border-black/25 py-0.5"><dt className="text-black/50">From</dt><dd className="truncate normal-case tracking-normal">@{data.username}</dd></div>
          </dl>
        </div>
        <h1 className="hidden text-center text-[13px] font-bold uppercase tracking-[0.18em] @min-[700px]:block">{name}</h1>
        <nav aria-label="Social profiles" className="flex flex-col items-end gap-0.5 text-right">
          {data.socials.slice(0, 4).map((s, i) => (
            <a key={i} href={s.url} {...linkTarget(mode, s.url)} className="text-[12px] text-black/65 hover:text-black hover:underline">{platformLabel(s.platform)}</a>
          ))}
        </nav>
      </header>

      <div ref={stage} {...dragProps} tabIndex={-1}
        onWheel={(e) => { wheelAcc.current += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(wheelAcc.current) > 60) { go(sel + Math.sign(wheelAcc.current)); wheelAcc.current = 0; } }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowLeft") go(sel - 1); }}
        className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden outline-none active:cursor-grabbing">
        {w > 0 ? (
          <ul aria-label="Links" className="absolute inset-0">
            {data.links.map((l, i) => {
              const d = i - pos;
              if (Math.abs(d) > 4) return null;
              const on = i === sel;
              const k = hash(l.id + l.title);
              const s = on ? 1 : 0.8 - Math.min(0.2, Math.abs(d) * 0.04);
              const x = w / 2 + d * gapX + Math.sign(d) * D * 0.06;
              const y = h * 0.47 + (on ? 0 : D * (0.08 + ((k >>> 4) % 10) / 100));
              return (
                <li key={l.id} className={`absolute left-0 top-0 ${drag ? "" : "lm-dc-slide"}`}
                  style={{ width: D, height: D, transform: `translate(${x - D / 2}px, ${y - D / 2}px) scale(${s})`, zIndex: 50 - Math.round(Math.abs(d) * 2) }}>
                  <button type="button" aria-label={on ? `Open ${l.title}` : `Show ${l.title}`} aria-current={on || undefined}
                    onClick={() => (on ? openRef.current?.click() : go(i))}
                    className={`lm-dc-disc relative block size-full rounded-full outline-none ${on ? "is-on" : ""}`}
                    style={{ ["--tilt" as string]: `${((k >>> 8) % 40) - 20}deg` } as CSSProperties}>
                    <span className="lm-dc-face absolute inset-0 overflow-hidden rounded-full">
                      <LinkArt link={l} className="absolute inset-0" icon={0} blur={0.2} mark={false} />
                      <span className="absolute inset-x-[16%] bottom-[13%] flex flex-col items-center gap-[0.2em] text-center" style={{ fontSize: D * 0.075 }}>
                        <span className="lm-dc-label line-clamp-2 font-serif leading-[0.95]">{l.title}</span>
                        <span className="text-[0.38em] font-bold tracking-[0.2em] opacity-80">{initials(name)}</span>
                      </span>
                      <span aria-hidden className="lm-dc-sheen absolute inset-0" />
                    </span>
                    <span aria-hidden className="lm-dc-hub absolute left-1/2 top-1/2 size-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {/* the marker loop around the one in the middle */}
        {w > 0 && n ? (
          <svg key={sel} aria-hidden viewBox="0 0 200 200" className="lm-dc-loop pointer-events-none absolute"
            style={{ width: D * 1.16, height: D * 1.16, left: w / 2 - D * 0.58, top: h * 0.47 - D * 0.58, zIndex: 60 }}>
            <path d={LOOP} pathLength={1} />
            <path d={LOOP} pathLength={1} transform="rotate(-4 100 100) translate(2 -2)" className="lm-dc-loop2" />
          </svg>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/2" /> : null}
      </div>

      {/* two little quotes under the disc */}
      <div className="relative z-20 grid shrink-0 grid-cols-2 gap-6 px-[clamp(14px,6cqw,60px)] pb-2 text-center" aria-live="polite">
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.3em]">★★★★★</p>
          <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/55">{current ? hostOf(current.url) : ""}</p>
          <p className="mt-0.5 line-clamp-2 font-serif text-[clamp(12px,3.2cqw,16px)] uppercase leading-tight">“{current ? current.title : name}”</p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.3em]">★★★★★</p>
          <p className="mt-0.5 text-[8.5px] font-bold uppercase tracking-[0.14em] text-black/55">@{data.username}</p>
          <p className="mt-0.5 line-clamp-2 font-serif text-[clamp(12px,3.2cqw,16px)] uppercase leading-tight">“{data.bio || "Tap the circled one to open it"}”</p>
        </div>
        {current ? <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)} tabIndex={-1} aria-hidden className="sr-only">{current.title}</a> : null}
      </div>
    </ThemeRoot>
  );
}
