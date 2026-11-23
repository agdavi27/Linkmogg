"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useSize } from "../motion";
import { backdropStyle } from "../backdrops";
import type { ThemeProps, ThemeLink } from "../types";

// Where icons can sit, as a 4 x 6 grid around the window in the middle.
const SLOTS: [number, number][] = [];
for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) if (!(r >= 2 && r <= 3 && c >= 1 && c <= 2)) SLOTS.push([c, r]);
// Fill the corners and edges first so a few links still frame the window.
const ORDER = [0, 16, 3, 18, 8, 11, 1, 17, 4, 15, 2, 7, 12, 5, 14, 6, 13, 9, 10, 19]; // the bin sits in 19

/** A desktop lying in the grass. Your links are files and folders around a little window. */
export default function Meadow({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const [moved, setMoved] = useState<Record<string, [number, number]>>({});
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const drag = useRef<{ id: string; x: number; y: number; ox: number; oy: number; far: boolean } | null>(null);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;
  const shown = data.links.slice(0, ORDER.length);
  const current = sel !== null ? data.links[sel] : null;

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i); tick(1700, 0.01, 0.03); buzz(4);
  };

  // Icons can be dragged around, like a real desktop. A short press still counts as a tap.
  const down = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return;
    const [ox, oy] = moved[id] ?? [0, 0];
    drag.current = { id, x: e.clientX, y: e.clientY, ox, oy, far: false };
  };
  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.far && Math.hypot(dx, dy) < 6) return;
    if (!d.far) (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    d.far = true;
    setMoved((m) => ({ ...m, [d.id]: [d.ox + dx, d.oy + dy] }));
  };
  const up = (i: number) => { const d = drag.current; drag.current = null; if (d && !d.far) pick(i); };

  const top = 44; // leave room for the share button
  const cw = w / 4, ch = (h - top) / 6;
  const icon = Math.max(54, Math.min(cw * 0.56, ch * 0.62, 96));
  const win = { w: Math.min(w * 0.6, 520), h: Math.min(h * 0.32, 380) };

  return (
    <ThemeRoot data={data} mode={mode} label="Meadow" badgeTone="light" className="lm-md bg-[#1f3a16] text-white">
      <div ref={stage} className="lm-md-stage relative min-h-0 flex-1 overflow-hidden" style={backdropStyle(data.backdrop)}>
        {w > 0 ? shown.map((l, i) => {
          const [c, r] = SLOTS[ORDER[i]];
          const k = hash(l.id + l.title);
          const kind = k % 3; // 0 photo, 1 folder, 2 photo with a tilt
          const [mx, my] = moved[l.id] ?? [0, 0];
          const x0 = c * cw + cw / 2 + ((k % 21) - 10) * cw * 0.02 + mx;
          const y0 = top + r * ch + ch / 2 + (((k >>> 5) % 21) - 10) * ch * 0.02 + my;
          // keep every icon fully on screen
          const x = Math.max(icon * 0.75, Math.min(w - icon * 0.75, x0)), y = Math.max(top + icon * 0.5, Math.min(h - icon * 0.6, y0));
          return (
            <button key={l.id} type="button" onPointerDown={(e) => down(e, l.id)} onPointerMove={move} onPointerUp={() => up(i)}
              onPointerCancel={() => { drag.current = null; }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(i); } }}
              aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
              className={`lm-md-icon absolute flex touch-none select-none flex-col items-center outline-none ${sel === i ? "is-on" : ""}`}
              style={{ left: x, top: y, width: icon * 1.5, ["--d" as string]: `${i * 50}ms` } as CSSProperties}>
              {kind === 1 ? <Folder size={icon} /> : (
                <span className="lm-md-photo block" style={{ width: icon, height: icon * 0.78, rotate: kind === 2 ? `${(k % 9) - 4}deg` : undefined }}>
                  <LinkArt link={l} className="size-full" icon={Math.round(icon * 0.28)} blur={0.4} />
                </span>
              )}
              <span className="lm-md-label mt-1 max-w-full truncate px-1 text-[11px] font-medium leading-tight">{fileName(l, kind)}</span>
            </button>
          );
        }) : null}

        {/* the window in the middle: about you, or a peek at the picked link */}
        {w > 0 ? (
          <section className="lm-md-win absolute left-1/2 top-[calc(50%+22px)] flex flex-col overflow-hidden" style={{ width: win.w, height: win.h }} aria-live="polite">
            <header className="lm-md-bar flex h-7 shrink-0 items-center gap-1.5 px-2.5">
              <button type="button" onClick={() => setSel(null)} aria-label="Back to about" className="size-3 rounded-full bg-[#ec6a5e]" />
              <span aria-hidden className="size-3 rounded-full bg-[#f4bf4f]" />
              <span aria-hidden className="size-3 rounded-full bg-[#61c554]" />
              <span className="flex-1 truncate pr-10 text-center text-[12px] font-semibold text-black/70">{current ? hostOf(current.url) : name}</span>
            </header>
            {current ? (
              <div key={current.id} className="lm-pop relative min-h-0 flex-1">
                <LinkArt link={current} className="absolute inset-0" icon={Math.round(win.h * 0.16)} blur={0.5} />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-[#ececec]/95 px-3 py-2 text-black">
                  <span className="min-w-0 truncate text-[14px] font-semibold">{current.title}</span>
                  <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)} className="lm-md-open shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold text-white">Open ↗</a>
                </div>
              </div>
            ) : (
              <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-2 bg-[#2b2b2b] p-4 text-center">
                <Avatar data={data} size={Math.round(Math.min(win.h * 0.32, 110))} className="ring-2 ring-white/20" />
                <h1 className="text-[clamp(18px,5cqw,26px)] font-semibold leading-tight tracking-[-0.02em]">{name}</h1>
                {data.bio && win.h > 250 ? <p className="line-clamp-2 max-w-[36ch] text-[12px] text-white/65">{data.bio}</p> : null}
                <p className="text-[11px] text-white/45">{n ? "Tap a file to look. Tap again to open." : ""}</p>
              </div>
            )}
          </section>
        ) : null}

        {/* the bin, because every desktop has one */}
        <span aria-hidden className="lm-md-bin absolute bottom-3 right-4" />
        {n === 0 ? <Empty className="absolute inset-x-0 bottom-24 text-white" /> : null}
      </div>
      {data.socials.length ? (
        <div className="lm-md-foot relative z-10 flex shrink-0 justify-center pb-1">
          <SocialRow socials={data.socials} mode={mode} iconClass="size-9! text-white hover:bg-white/15" size={18} />
        </div>
      ) : null}
    </ThemeRoot>
  );
}

function fileName(l: ThemeLink, kind: number) {
  const base = l.title.trim().replace(/\s+/g, " ");
  return kind === 1 ? base.toUpperCase() : `${base.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/ /g, "_").slice(0, 24) || "link"}.jpg`;
}

function Folder({ size }: { size: number }) {
  return (
    <svg aria-hidden viewBox="0 0 64 50" width={size} height={size * 0.78} className="lm-md-folder">
      <path d="M2 8 a4 4 0 0 1 4-4 h16 l5 5 h31 a4 4 0 0 1 4 4 v31 a4 4 0 0 1-4 4 H6 a4 4 0 0 1-4-4z" fill="#3d9bd6" />
      <path d="M2 16 a4 4 0 0 1 4-4 h52 a4 4 0 0 1 4 4 v28 a4 4 0 0 1-4 4 H6 a4 4 0 0 1-4-4z" fill="#69bdf0" />
      <path d="M2 16 a4 4 0 0 1 4-4 h52 a4 4 0 0 1 4 4 v2 H2z" fill="#8fd0f6" />
    </svg>
  );
}
