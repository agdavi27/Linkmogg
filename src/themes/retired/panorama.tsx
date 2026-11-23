"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget, usePrefersReducedMotion } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

/** Dark screens on the inside of a slowly turning band. The first screen says hello, the rest are links. */
export default function Panorama({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const total = n + 1; // the hello screen, then one screen per link
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState(0);
  const [idle, setIdle] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const wheelAcc = useRef(0);
  const reduced = usePrefersReducedMotion();
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  // Landscape screens on wide stages, taller ones on phones.
  const tall = w < 620;
  const cw = Math.max(180, Math.min(tall ? w * 0.7 : w * 0.56, tall ? h * 0.62 / 1.2 : (h * 0.7) / 0.62, 620));
  const ch = cw * (tall ? 1.2 : 0.62);
  const gap = cw * 0.06;
  const R = Math.max(cw * 2.4, w * 0.7);
  const step = ((cw + gap) / R) * (180 / Math.PI);
  const pos = sel - drag;

  const go = (i: number) => {
    const next = ((i % total) + total) % total;
    if (next !== sel) { tick(1300, 0.012, 0.035); buzz(4); }
    setSel(next);
  };
  const stop = () => setIdle(false);

  // Drift on its own until someone touches it.
  useEffect(() => {
    if (!idle || reduced || total < 2) return;
    const t = setInterval(() => setSel((s) => (s + 1) % total), 3600);
    return () => clearInterval(t);
  }, [idle, reduced, total]);

  const dragProps = useDragX(
    (dx) => { stop(); setDrag(dx / (cw + gap)); },
    (dx, vx) => { const fling = Math.round(dx / (cw + gap) + vx * 0.8); setDrag(0); go(sel - fling); },
  );
  const current = sel > 0 ? data.links[sel - 1] : null;

  // Show the nearest copy of each screen, so the band loops.
  const nearest = (i: number) => { let d = i - pos; d -= Math.round(d / total) * total; return d; };

  return (
    <ThemeRoot data={data} mode={mode} label="Panorama" className="lm-pa bg-[#dcdcda] text-[#111]">
      <div ref={stage} {...dragProps} tabIndex={-1}
        onWheel={(e) => { stop(); wheelAcc.current += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; if (Math.abs(wheelAcc.current) > 60) { go(sel + Math.sign(wheelAcc.current)); wheelAcc.current = 0; } }}
        onKeyDown={(e) => { if (e.key === "ArrowRight") { stop(); go(sel + 1); } if (e.key === "ArrowLeft") { stop(); go(sel - 1); } }}
        className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden outline-none active:cursor-grabbing"
        style={{ perspective: R * 1.6 }}>
        <div aria-hidden className="lm-pa-floor" style={{ marginTop: (cw * (tall ? 1.2 : 0.62)) * 0.4 }} />
        {w > 0 ? (
          <div className="lm-pa-ring absolute left-1/2 top-1/2" style={{ transform: `translateZ(${R}px)` }}>
            {Array.from({ length: total }, (_, i) => {
              const d = nearest(i);
              const a = d * step;
              if (Math.abs(a) > 68) return null;
              const on = i === sel;
              const link = i > 0 ? data.links[i - 1] : null;
              return (
                <div key={i} className={`absolute ${drag ? "" : "lm-pa-turn"}`}
                  style={{ width: cw, height: ch, left: -cw / 2, top: -ch / 2, transform: `rotateY(${-a}deg) translateZ(${-R}px)` }}>
                  <button type="button" aria-current={on || undefined}
                    aria-label={link ? (on ? `Open ${link.title}` : `Show ${link.title}`) : `Hello from ${name}`}
                    onClick={() => { stop(); if (on && link) openRef.current?.click(); else go(i); }}
                    className={`lm-pa-screen relative flex size-full flex-col overflow-hidden text-left outline-none ${on ? "is-on" : ""}`}
                    style={{ ["--d" as string]: Math.min(1, Math.abs(a) / 60) } as CSSProperties}>
                    <span className="flex shrink-0 items-center justify-between px-[4%] pt-[3%] text-[clamp(7px,1.6cqmin,10px)] text-white/45">
                      <span>{name}</span><span>{link ? hostOf(link.url) : `@${data.username}`}</span>
                    </span>
                    {link ? (
                      <span className={`flex min-h-0 flex-1 gap-[4%] p-[4%] ${tall ? "flex-col" : ""}`}>
                        <LinkArt link={link} className={`${tall ? "h-[52%] w-full" : "h-full w-[42%]"} shrink-0 rounded-[3px]`} icon={Math.round(cw * 0.1)} blur={0.4} />
                        <span className="flex min-w-0 flex-1 flex-col justify-between">
                          <span className="font-mono text-[clamp(8px,1.8cqmin,11px)] text-white/40">{String(i).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
                          <span className="line-clamp-3 font-semibold leading-[0.98] tracking-[-0.04em] text-white" style={{ fontSize: Math.max(16, Math.min(cw * 0.075, 40)) }}>{link.title}</span>
                          <span className="text-[clamp(8px,1.8cqmin,11px)] text-white/55">{on ? "Tap to open ↗" : "Tap to look"}</span>
                        </span>
                      </span>
                    ) : (
                      <span className="flex min-h-0 flex-1 flex-col justify-center gap-[4%] px-[7%]">
                        <span className="flex flex-wrap items-center gap-x-[0.25em] font-semibold leading-none tracking-[-0.05em] text-white" style={{ fontSize: Math.max(22, Math.min(cw * 0.1, 56)) }}>
                          Hello, I&apos;m <Avatar data={data} size={Math.max(22, Math.min(cw * 0.085, 48))} className="bg-white/15! text-white" /> {name}.
                        </span>
                        {data.bio ? <span className="line-clamp-3 max-w-[40ch] text-[clamp(10px,2.4cqmin,13px)] leading-snug text-white/55">{data.bio}</span> : null}
                        <span className="text-[clamp(8px,1.8cqmin,11px)] text-white/40">{n ? `${n} link${n === 1 ? "" : "s"} · drag to look around` : ""}</span>
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 bottom-8" /> : null}
      </div>

      <div className="relative z-10 flex shrink-0 flex-col items-center gap-1 px-5 pb-1" aria-live="polite">
        <div className="flex items-center gap-2" role="tablist" aria-label="Screens">
          {Array.from({ length: total }, (_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === sel} aria-label={i ? data.links[i - 1].title : "Hello"}
              onClick={() => { stop(); go(i); }} className={`lm-pa-dot ${i === sel ? "is-on" : ""}`} />
          ))}
        </div>
        {current ? (
          <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)} className="lm-pop mt-1 truncate text-[13px] font-medium text-[#111]/70 underline-offset-2 hover:underline">
            {current.title} ↗
          </a>
        ) : <p className="mt-1 text-[13px] text-[#111]/45">@{data.username}</p>}
        <SocialRow socials={data.socials} mode={mode} iconClass="size-9! text-[#111]/70 hover:bg-black/5" size={18} />
      </div>
    </ThemeRoot>
  );
}
