"use client";

import { useRef, useState } from "react";
import { Avatar, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

export default function Rolodex({ data, mode }: ThemeProps) {
  const [idx, setIdx] = useState(0);
  const n = data.links.length;
  const start = useRef<number | null>(null);
  const moved = useRef(false);
  const go = (d: number) => setIdx((i) => (n ? (i + d + n) % n : 0));

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Rolodex"
      className="bg-[#d9d2c3] bg-[radial-gradient(100%_70%_at_50%_10%,#efe9dc_0%,#cfc6b4_100%)] text-[#231f1a]">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center px-4 pt-10">
        <Avatar data={data} size={72} className="shadow-[0_6px_16px_-6px_rgba(0,0,0,.4)]" />
        <h1 className="mt-3 text-center font-mono text-xl font-bold tracking-tight">{data.displayName || `@${data.username}`}</h1>
        {data.bio ? <p className="mt-1 max-w-[34ch] text-center text-sm text-[#5d564b]">{data.bio}</p> : null}

        <div className="relative mt-8 w-full max-w-[340px]" onKeyDown={onKey}>
          <div className="relative h-[210px] [perspective:900px]"
            onWheel={(e) => go(e.deltaY > 0 ? 1 : -1)}
            onPointerDown={(e) => { start.current = e.clientY; moved.current = false; }}
            onPointerMove={(e) => {
              if (start.current === null) return;
              const dy = e.clientY - start.current;
              if (Math.abs(dy) > 36) { go(dy < 0 ? 1 : -1); start.current = e.clientY; moved.current = true; }
            }}
            onPointerUp={() => { start.current = null; }}
            onPointerLeave={() => { start.current = null; }}
            style={{ touchAction: "pan-x" }}>
            {data.links.map((l, i) => {
              const off = (i - idx + n) % n;
              const visible = off <= 3;
              const flipped = off === n - 1 && n > 2;
              const transform = flipped
                ? "translateY(40px) rotateX(-95deg)"
                : `translateY(${-off * 12}px) scale(${1 - off * 0.045})`;
              return (
                <a key={l.id} href={l.url} {...linkTarget(mode, l.url)}
                  tabIndex={off === 0 ? 0 : -1} aria-hidden={off !== 0}
                  onClick={(e) => { if (moved.current) { e.preventDefault(); moved.current = false; } }}
                  className="lm-card absolute inset-x-0 bottom-0 block h-[180px] origin-bottom rounded-lg p-5 outline-none transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] focus-visible:ring-2 focus-visible:ring-[#c2410c]"
                  style={{ transform, opacity: visible || flipped ? (flipped ? 0 : 1) : 0, zIndex: n - off, pointerEvents: off === 0 ? "auto" : "none" }}>
                  <span aria-hidden className="absolute -top-3 left-6 rounded-t-md bg-[#f7e7a8] px-3 pt-0.5 font-mono text-xs font-bold">{l.title.trim()[0]?.toUpperCase()}</span>
                  <span aria-hidden className="absolute bottom-3 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full bg-[#d9d2c3] shadow-[inset_0_1px_2px_rgba(0,0,0,.35)]" />
                  <span className="block font-mono text-[11px] uppercase tracking-widest text-[#8a8070]">{String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}</span>
                  <span className="mt-3 block border-b border-[#c8bfae] pb-1 font-mono text-xl font-bold leading-snug line-clamp-2">{l.title}</span>
                  <span className="mt-2 block truncate font-mono text-xs text-[#6b6355]">{hostOf(l.url)}</span>
                </a>
              );
            })}
            {n === 0 ? <div className="lm-card absolute inset-x-0 bottom-0 grid h-[180px] place-items-center rounded-lg font-mono text-sm opacity-70">No cards yet.</div> : null}
          </div>
          <div aria-hidden className="lm-rolo-base mx-auto -mt-1 h-5 w-[92%] rounded-b-xl" />
          <div className="mt-5 flex items-center justify-center gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Previous card"
              className="lm-knob grid size-11 place-items-center rounded-full text-lg font-bold active:scale-95">‹</button>
            <span className="min-w-16 text-center font-mono text-xs text-[#6b6355]" aria-live="polite">{n ? `${idx + 1} of ${n}` : ""}</span>
            <button type="button" onClick={() => go(1)} aria-label="Next card"
              className="lm-knob grid size-11 place-items-center rounded-full text-lg font-bold active:scale-95">›</button>
          </div>
          <p className="mt-2 text-center text-xs text-[#7d7465]">Flip with a swipe, tap a card to open</p>
        </div>
        <SocialRow socials={data.socials} mode={mode} className="my-5" iconClass="text-[#2c2620] hover:bg-black/5" />
      </div>
    </ThemeRoot>
  );
}
