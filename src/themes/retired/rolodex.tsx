"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick } from "../motion";
import type { ThemeProps } from "../types";

const TABS = ["#f7e7a8", "#bfe0f5", "#f6c3c3", "#c9ecc4", "#e4d3f5"];

export default function Rolodex({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const slots = Math.max(n, 1);
  const step = 20; // degrees of drag per card
  const [idx, setIdx] = useState(0);
  const wheel = useRef<HTMLDivElement>(null);
  const rot = useRef(0); // degrees; card i faces front at rot = i * step
  const vel = useRef(0);
  const raf = useRef(0);
  const dragging = useRef<{ y: number; t: number; moved: number } | null>(null);
  const lastIdx = useRef(0);
  const target = useRef(0);

  const paint = useCallback(() => {
    wheel.current?.style.setProperty("--pos", (rot.current / step).toFixed(3));
    const i = ((Math.round(rot.current / step) % slots) + slots) % slots;
    if (i !== lastIdx.current) {
      lastIdx.current = i;
      tick(2600, 0.006, 0.05);
      buzz(3);
      setIdx(i);
    }
  }, [slots, step]);

  const settle = useCallback(() => {
    cancelAnimationFrame(raf.current);
    const loop = () => {
      if (Math.abs(vel.current) > 0.15) {
        rot.current += vel.current;
        vel.current *= 0.93;
      } else {
        const target_ = Math.round(rot.current / step) * step;
        const d = target_ - rot.current;
        target.current = target_;
        if (Math.abs(d) < 0.05) { rot.current = target_; paint(); return; }
        rot.current += d * 0.2;
      }
      // don't spin into empty slots: clamp to the real cards
      const maxRot = (n - 1) * step;
      if (n && (rot.current < -step * 0.4 || rot.current > maxRot + step * 0.4)) {
        rot.current = Math.max(-step * 0.4, Math.min(maxRot + step * 0.4, rot.current));
        vel.current = 0;
      }
      paint();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  }, [n, paint, step]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const go = (d: number) => {
    if (!n) return;
    const cur = Math.round(target.current / step);
    const next = Math.max(0, Math.min(n - 1, cur + d));
    vel.current = 0;
    cancelAnimationFrame(raf.current);
    target.current = next * step;
    const loop = () => {
      const dd = target.current - rot.current;
      if (Math.abs(dd) < 0.05) { rot.current = target.current; paint(); return; }
      rot.current += dd * 0.18;
      paint();
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); go(1); }
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
  };

  const current = data.links[Math.min(idx, n - 1)];

  return (
    <ThemeRoot data={data} mode={mode} label="Rolodex" className="lm-rx-desk relative overflow-hidden text-[#231f1a]">
      <div aria-hidden className="lm-rx-lamp" />
      <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center px-4 pt-10">
        <div className="lm-pop flex flex-col items-center">
          <Avatar data={data} size={72} className="border-4 border-[#fffdf7] bg-[#e8dfcd]! shadow-[0_8px_18px_-8px_rgba(0,0,0,.5)]" />
          <h1 className="mt-3 text-center font-mono text-xl font-bold tracking-tight">{data.displayName || `@${data.username}`}</h1>
          {data.bio ? <p className="mt-1 max-w-[34ch] text-center text-sm text-[#5d564b]">{data.bio}</p> : null}
        </div>

        <div className="relative mt-6 w-full max-w-[340px]" onKeyDown={onKey}>
          <div className="lm-rx-stage relative h-[270px] touch-none select-none"
            onWheel={(e) => { vel.current += e.deltaY * 0.02; settle(); }}
            onPointerDown={(e) => {
              cancelAnimationFrame(raf.current);
              target.current = rot.current;
              dragging.current = { y: e.clientY, t: performance.now(), moved: 0 };
              vel.current = 0;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = dragging.current;
              if (!d) return;
              const dy = d.y - e.clientY;
              const now = performance.now();
              rot.current += dy * 0.35;
              vel.current = (dy * 0.35) / Math.max(1, (now - d.t) / 16);
              d.moved += Math.abs(dy);
              d.y = e.clientY;
              d.t = now;
              paint();
            }}
            onPointerUp={(e) => {
              const d = dragging.current;
              dragging.current = null;
              if (d && d.moved < 6) {
                // a tap: open the front card if the tap landed on it
                const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLAnchorElement>("a[data-front]");
                el?.click();
              }
              settle();
            }}
            onPointerCancel={() => { dragging.current = null; settle(); }}>
            <div aria-hidden className="lm-rx-rail" />
            <div ref={wheel} className="lm-rx-wheel absolute inset-0" style={{ ["--pos" as string]: 0 } as CSSProperties}>
              {data.links.map((l, i) => {
                const front = i === idx;
                const tab = TABS[hash(l.id) % TABS.length];
                return (
                  <a key={l.id} href={l.url} {...linkTarget(mode, l.url)} data-front={front || undefined}
                    tabIndex={front ? 0 : -1} aria-hidden={!front}
                    onClick={(e) => { if (dragging.current) e.preventDefault(); }}
                    className="lm-card lm-rx-card absolute bottom-[34px] left-0 right-0 block h-[168px] rounded-[10px] p-5 outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c]"
                    style={{ ["--i" as string]: i, zIndex: front ? n + 1 : n - Math.abs(i - idx) } as CSSProperties}>
                    <span aria-hidden className="absolute -top-[14px] rounded-t-md px-3 pt-0.5 font-mono text-xs font-bold shadow-[0_-1px_2px_rgba(0,0,0,.1)]"
                      style={{ background: tab, left: `${12 + (i % 4) * 20}%` }}>{l.title.trim()[0]?.toUpperCase()}</span>
                    <span aria-hidden className="lm-rx-slot absolute bottom-3 left-1/2 h-3 w-16 -translate-x-1/2 rounded-full" />
                    <span className="block font-mono text-[11px] uppercase tracking-widest text-[#8a8070]">No. {String(i + 1).padStart(2, "0")}</span>
                    <span className="mt-2 block border-b border-[#c8bfae] pb-1 font-mono text-xl font-bold leading-snug line-clamp-2">{l.title}</span>
                    <span className="mt-2 block truncate font-mono text-xs text-[#6b6355]">{hostOf(l.url)}</span>
                  </a>
                );
              })}
              {n === 0 ? <div className="lm-card absolute inset-x-0 bottom-[34px] grid h-[168px] place-items-center rounded-lg font-mono text-sm opacity-70">No cards yet.</div> : null}
            </div>
            <div aria-hidden className="lm-rx-axle"><span /><span /></div>
          </div>
          <div aria-hidden className="lm-rolo-base relative mx-auto -mt-6 h-9 w-[96%] rounded-[10px_10px_18px_18px]" />

          <div className="mt-5 flex items-center justify-center gap-3">
            <button type="button" onClick={() => go(-1)} aria-label="Previous card"
              className="lm-knob grid size-11 place-items-center rounded-full text-lg font-bold transition-transform duration-100 active:scale-95">‹</button>
            <span className="min-w-28 text-center font-mono text-xs text-[#6b6355]" aria-live="polite">{current ? `${idx + 1} of ${n}` : ""}</span>
            <button type="button" onClick={() => go(1)} aria-label="Next card"
              className="lm-knob grid size-11 place-items-center rounded-full text-lg font-bold transition-transform duration-100 active:scale-95">›</button>
          </div>
          <p className="mt-2 text-center text-xs text-[#7d7465]">Spin the cards. Tap the front one to open it.</p>
        </div>
        <SocialRow socials={data.socials} mode={mode} className="my-5" iconClass="text-[#2c2620] hover:bg-black/5" />
      </div>
    </ThemeRoot>
  );
}
