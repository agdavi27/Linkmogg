"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

const FRAMES = ["gold", "black", "white", "oak"] as const;
const DEG = 180 / Math.PI;

/** Shortest signed turn from a to b, in degrees. */
const delta = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180;

export default function Museum({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);
  const [sel, setSel] = useState(0);
  const [turn, setTurn] = useState(0); // camera yaw, unbounded
  const [drag, setDrag] = useState(0);

  // An n-sided room: one painting per wall, two per wall once there are lots of links.
  const per = n > 8 ? 2 : 1;
  const walls = Math.max(5, Math.ceil(n / per));
  const step = 360 / walls;
  const wallW = Math.min(Math.max(w * (per === 2 ? 1.15 : 0.92), 260), 980);
  const R = wallW / (2 * Math.tan(Math.PI / walls));
  const wallH = Math.max(260, h * 1.25); // taller than the view, so the room never shows a gap above
  const persp = R * 0.92;
  const side = (i: number) => (per === 2 ? (i % 2 ? 1 : -1) : 0);
  const angleOf = (i: number) => Math.floor(i / per) * step + side(i) * Math.atan(wallW / 4 / R) * DEG;
  const yaw = turn - drag * 0.22;

  const go = (i: number) => {
    if (!n) return;
    const next = ((i % n) + n) % n;
    setTurn((t) => t + delta(t, angleOf(next)));
    if (next !== sel) { tick(500, 0.05, 0.04); buzz(6); }
    setSel(next);
  };
  const dragProps = useDragX(
    (dx) => setDrag(dx),
    (dx) => {
      const y = turn - dx * 0.22;
      setDrag(0);
      setTurn(y);
      // land on the painting nearest to where the camera stopped
      let best = 0, bd = 999;
      for (let i = 0; i < n; i++) { const d = Math.abs(delta(y, angleOf(i))); if (d < bd) { bd = d; best = i; } }
      requestAnimationFrame(() => go(best));
    },
  );
  const current = data.links[sel];
  const paintW = Math.min(wallW * (per === 2 ? 0.34 : 0.5), h * 0.36);

  return (
    <ThemeRoot data={data} mode={mode} label="Gallery" badgeTone="light" className="lm-mu bg-[#2a231c] text-[#f4efe6]">
      <div ref={stage} {...dragProps} className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowLeft") go(sel - 1); }}>
        {w > 0 && n > 0 ? (
          <div className="absolute inset-0" style={{ perspective: persp, perspectiveOrigin: "50% 50%" }}>
            <div className={`lm-mu-world absolute left-1/2 top-1/2 ${drag ? "" : "is-anim"}`}
              style={{ transform: `translateZ(${R.toFixed(1)}px) rotateY(${yaw.toFixed(2)}deg)` }}>
              <div aria-hidden className="lm-mu-floor" style={{ width: R * 2.4, height: R * 2.4, transform: `translate(-50%, -50%) translateY(${wallH / 2}px) rotateX(90deg)` }} />
              <div aria-hidden className="lm-mu-ceiling" style={{ width: R * 2.4, height: R * 2.4, transform: `translate(-50%, -50%) translateY(${-wallH / 2}px) rotateX(-90deg)` }} />
              {Array.from({ length: walls }, (_, wi) => (
                <div key={wi} className="lm-mu-wall absolute" style={{ width: wallW + 2, height: wallH, transform: `translate(-50%, -50%) rotateY(${-wi * step}deg) translateZ(${-R}px)` }}>
                  {Array.from({ length: per }, (_, s) => {
                    const i = wi * per + s;
                    const l = data.links[i];
                    if (!l) return s === 0 ? <span key={s} aria-hidden className="lm-mu-door" /> : null;
                    const k = hash(l.id + l.title);
                    const frame = FRAMES[k % FRAMES.length];
                    const tall = k % 3 !== 0;
                    const on = i === sel;
                    return (
                      <div key={l.id} className="absolute top-[46%] -translate-x-1/2 -translate-y-1/2" style={{ left: per === 2 ? (s ? "73%" : "27%") : "50%" }}>
                        <span aria-hidden className="lm-mu-spot" />
                        <button type="button" onClick={() => (on ? openRef.current?.click() : go(i))} tabIndex={on ? 0 : -1}
                          aria-label={on ? `Open ${l.title}` : `Walk to ${l.title}`}
                          className={`lm-mu-frame frame-${frame} relative block outline-none ${on ? "is-on" : ""}`}
                          style={{ width: tall ? paintW : paintW * 1.25, height: tall ? paintW * 1.25 : paintW * 0.9 } as CSSProperties}>
                          <LinkArt link={l} className="lm-mu-canvas absolute inset-0" icon={Math.round(paintW * 0.22)} />
                        </button>
                        <span className="lm-mu-plaque absolute left-1/2 top-[calc(100%+14px)] -translate-x-1/2">
                          <span className="block truncate font-serif text-[11px] font-semibold">{l.title}</span>
                          <span className="block truncate text-[8.5px] text-[#5b5146]">{hostOf(l.url)}</span>
                        </span>
                      </div>
                    );
                  })}
                  <span aria-hidden className="lm-mu-base" />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div aria-hidden className="lm-mu-vignette" />
        <header className="pointer-events-none absolute inset-x-0 top-0 z-10 px-5 pt-[clamp(12px,3cqh,28px)] text-center">
          <h1 className="lm-mu-in font-serif text-[clamp(22px,6cqw,34px)] font-semibold tracking-[-0.01em] text-[#2a231c]">{data.displayName || `@${data.username}`}</h1>
          {data.bio ? <p className="mx-auto mt-0.5 line-clamp-1 max-w-[46ch] text-[12px] text-[#2a231c]/60">{data.bio}</p> : null}
        </header>
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3" /> : null}
      </div>

      <div className="relative z-10 shrink-0 px-4 pb-1 pt-2" aria-live="polite">
        <div className="mx-auto flex max-w-[460px] items-center gap-2">
          <button type="button" aria-label="Previous painting" onClick={() => go(sel - 1)} className="lm-mu-arrow">‹</button>
          {current ? (
            <a ref={openRef} href={current.url} key={current.id} {...linkTarget(mode, current.url)}
              className="lm-pop flex min-w-0 flex-1 items-center justify-between gap-3 rounded-full bg-[#f4efe6] px-4 py-2 text-[#1d1a17] transition-transform duration-150 ease-out active:scale-[.98]">
              <span className="min-w-0">
                <span className="block truncate font-serif text-[15px] font-semibold leading-tight">{current.title}</span>
                <span className="block truncate text-[10.5px] text-[#1d1a17]/55">No. {sel + 1} of {n} · {hostOf(current.url)}</span>
              </span>
              <span aria-hidden className="text-lg">↗</span>
            </a>
          ) : <span className="flex-1" />}
          <button type="button" aria-label="Next painting" onClick={() => go(sel + 1)} className="lm-mu-arrow">›</button>
        </div>
        <SocialRow socials={data.socials} mode={mode} className="mt-1" iconClass="size-9! text-[#f4efe6]/75 hover:bg-white/10" size={18} />
      </div>
    </ThemeRoot>
  );
}
