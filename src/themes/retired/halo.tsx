"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useSize } from "../motion";
import type { ThemeProps } from "../types";

const SPIN = 5; // degrees per second while idle

export default function Halo({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);
  const sim = useRef({ spin: 0, target: null as number | null, hover: false });

  // Repeat the links so the arch always looks full.
  const R = Math.max(120, Math.min(w * 0.47, h * 0.62, 460));
  const RY = Math.min(Math.max(R, Math.min(h * 0.56, R * 1.7)), h * 0.66 - 62); // tall phones get a taller arch
  const fit = (Math.PI * (R + RY)) / 1.18; // circumference the tiles can share
  const tile = Math.max(30, Math.min(R * 0.34, 104, n ? fit / n : 104));
  const T = n ? Math.max(n, Math.floor(fit / tile)) : 0; // tiles past n repeat earlier links
  const copies = n ? Math.ceil(T / n) : 0;
  const cx = w / 2, cy = h * 0.66;

  const arc = w < 600 ? 88 : 112; // how far down the sides the arch reaches
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now();
    const place = () => {
      const s = sim.current;
      for (let k = 0; k < T; k++) {
        const el = tiles.current[k];
        if (!el) continue;
        let a = ((k / T) * 360 + s.spin) % 360;
        if (a > 180) a -= 360; // -180..180, 0 = top
        const vis = Math.max(0, Math.min(1, (arc - Math.abs(a)) / 22));
        const rad = (a * Math.PI) / 180;
        const x = cx + Math.sin(rad) * R, y = cy - Math.cos(rad) * RY;
        el.style.transform = `translate3d(${(x - tile / 2).toFixed(1)}px, ${(y - tile / 2).toFixed(1)}px, 0) rotate(${(a * 0.35).toFixed(1)}deg)`;
        el.style.opacity = vis.toFixed(2);
        el.style.visibility = vis < 0.02 ? "hidden" : "visible";
        el.tabIndex = vis > 0.5 && k < n ? 0 : -1;
      }
    };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sim.current;
      if (s.target !== null) {
        let d = s.target - s.spin;
        d = ((d % 360) + 540) % 360 - 180;
        s.spin += d * Math.min(1, dt * 6);
      } else if (!s.hover) s.spin += SPIN * dt;
      place();
      raf = requestAnimationFrame(frame);
    };
    if (still) { place(); return; }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [T, n, R, RY, tile, cx, cy, arc]);

  const choose = (i: number, k?: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    // bring the nearest copy of this link to the top of the arch
    const s = sim.current;
    const ks = Array.from({ length: copies }, (_, c) => c * n + i).filter((kk) => kk < T);
    const best = k ?? ks.reduce((b, kk) => {
      const d = Math.abs(((((-(kk / T) * 360 - s.spin) % 360) + 540) % 360) - 180);
      const bd = Math.abs(((((-(b / T) * 360 - s.spin) % 360) + 540) % 360) - 180);
      return d < bd ? kk : b;
    }, ks[0]);
    s.target = -(best / T) * 360;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) s.spin = s.target;
    tick(1400 + (i % 6) * 140, 0.02, 0.03);
    buzz(6);
  };
  const next = () => n && choose(sel === null ? 0 : (sel + 1) % n);
  const current = sel !== null ? data.links[sel] : null;

  return (
    <ThemeRoot data={data} mode={mode} label="Halo" badgeTone="light" className="lm-hl bg-[#07080b] text-white">
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") sim.current.hover = true; }}
        onPointerLeave={() => { sim.current.hover = false; }}>
        <div aria-hidden className="lm-hl-glow" style={{ left: cx, top: cy }} />
        <ul aria-label="Links">
          {w > 0 && Array.from({ length: T }, (_, k) => {
            const i = k % n;
            const l = data.links[i];
            return (
              <li key={`${l.id}-${k}`} aria-hidden={k >= n || undefined}>
                <button ref={(el) => { tiles.current[k] = el; }} type="button" onClick={() => choose(i, k)}
                  aria-label={k < n ? `${l.title}${sel === i ? ", selected. Press again to open" : ""}` : undefined}
                  className={`lm-hl-tile absolute left-0 top-0 outline-none ${sel === i ? "is-on" : ""}`} style={{ width: tile, height: tile, visibility: "hidden" }}>
                  <LinkArt link={l} className="size-full rounded-[24%]" icon={Math.round(tile * 0.36)} />
                </button>
              </li>
            );
          })}
        </ul>

        <div className="absolute inset-x-0 z-10 flex flex-col items-center px-6 text-center" style={{ top: cy - Math.min(R * 0.62, 150), }}>
          <Avatar data={data} size={44} className="lm-hl-in mb-2 bg-white/10! text-white ring-1 ring-white/20" />
          <h1 className="lm-hl-in text-[clamp(22px,6.4cqw,34px)] font-semibold tracking-[-0.025em]">{data.displayName || `@${data.username}`}</h1>
          <div className="mt-1.5 h-[64px] w-full" style={{ maxWidth: Math.min(R * 1.45, 380) }} aria-live="polite">
            {current ? (
              <div key={current.id} className="lm-pop">
                <p className="truncate text-[15px] font-medium">{current.title}</p>
                <p className="truncate text-[12px] text-white/45">{hostOf(current.url)}</p>
              </div>
            ) : (
              <p className="line-clamp-3 text-[13px] leading-snug text-white/50">{data.bio || "Tap a tile to see where it goes."}</p>
            )}
          </div>
          {current ? (
            <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
              className="lm-pop mt-1 rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#07080b] transition-transform duration-150 ease-out active:scale-95">
              Open {current.title.length > 22 ? "link" : current.title}
            </a>
          ) : (
            <button type="button" onClick={next} className="mt-1 rounded-full bg-white px-5 py-2 text-[13px] font-semibold text-[#07080b] transition-transform duration-150 ease-out active:scale-95">{n ? "Show me" : "No links yet"}</button>
          )}
        </div>
        {n > 1 ? (
          <button type="button" onClick={next} aria-label="Next link"
            className="absolute right-[4%] z-20 grid size-14 place-items-center rounded-full bg-white/10 text-2xl text-white backdrop-blur-md transition-[background-color,transform] duration-150 hover:bg-white/20 active:scale-95"
            style={{ top: cy - R * 0.62 }}>›</button>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3 text-white" /> : null}
      </div>
      <SocialRow socials={data.socials} mode={mode} className="relative z-10 shrink-0 pb-1" iconClass="size-9! text-white/75 hover:bg-white/10" size={18} />
    </ThemeRoot>
  );
}
