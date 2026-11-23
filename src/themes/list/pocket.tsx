"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

const STEP_DEG = 22;

export default function PocketPlayer({ data, mode }: ThemeProps) {
  const [sel, setSel] = useState(0);
  const [about, setAbout] = useState(false);
  const openRef = useRef<HTMLAnchorElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const drag = useRef<{ angle: number; acc: number } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const n = data.links.length;
  const current = data.links[Math.min(sel, Math.max(0, n - 1))];

  const step = (d: number) => {
    if (!n) return;
    setAbout(false);
    setSel((s) => Math.max(0, Math.min(n - 1, s + d)));
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(4);
  };

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [sel]);

  const angleAt = (e: React.PointerEvent) => {
    const r = wheelRef.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,a")) return;
    drag.current = { angle: angleAt(e), acc: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const a = angleAt(e);
    let d = a - drag.current.angle;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    drag.current.angle = a;
    drag.current.acc += d;
    while (Math.abs(drag.current.acc) >= STEP_DEG) {
      const dir = Math.sign(drag.current.acc);
      step(dir);
      drag.current.acc -= dir * STEP_DEG;
    }
  };
  const onUp = () => { drag.current = null; };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRef.current?.click(); }
    else if (e.key === "Escape") setAbout((a) => !a);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Pocket Player"
      className="bg-[radial-gradient(120%_80%_at_50%_0%,#e9e4dc_0%,#c9c1b4_100%)] text-[#1b1b1b]">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="lm-pocket-body w-[min(320px,88vw)] rounded-[34px] p-5 pb-7">
          {/* Screen */}
          <div className="lm-pocket-screen overflow-hidden rounded-[10px]">
            <div className="flex items-center justify-between border-b border-black/20 bg-gradient-to-b from-[#f4f6f8] to-[#c9d0d6] px-2.5 py-1 text-[11px] font-semibold">
              <span className="truncate">{about ? "About" : `@${data.username}`}</span>
              <span aria-hidden className="lm-pocket-battery" />
            </div>
            <div className="relative h-[168px] bg-[#f7f9fa]">
              {about || n === 0 ? (
                <div className="flex h-full items-center gap-3 px-3">
                  <Avatar data={data} size={64} className="rounded-md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{data.displayName || data.username}</p>
                    <p className="line-clamp-4 text-[11px] leading-snug text-black/70">{data.bio || (n === 0 ? "No links yet." : "")}</p>
                  </div>
                </div>
              ) : (
                <ul ref={listRef} role="listbox" tabIndex={0} aria-label="Links. Use arrow keys, Enter to open."
                  aria-activedescendant={`pk-${sel}`} onKeyDown={onKey}
                  className="h-full overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a7de1] [scrollbar-width:none]">
                  {data.links.map((l, i) => (
                    <li key={l.id} id={`pk-${i}`} data-i={i} role="option" aria-selected={i === sel}
                      onClick={() => (i === sel ? openRef.current?.click() : setSel(i))}
                      className={`flex cursor-pointer items-center justify-between px-2.5 py-[5px] text-[13px] ${
                        i === sel ? "bg-gradient-to-b from-[#5aa2f0] to-[#2a6fd0] text-white" : ""}`}>
                      <span className="truncate font-medium">{l.title}</span>
                      <span aria-hidden className="pl-2 text-[11px]">›</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {current && !about ? (
              <div className="truncate border-t border-black/10 bg-[#eef1f3] px-2.5 py-1 text-[10px] text-black/60">{hostOf(current.url)}</div>
            ) : null}
          </div>

          {/* Click wheel */}
          <div ref={wheelRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            onWheel={(e) => step(e.deltaY > 0 ? 1 : -1)}
            className="lm-pocket-wheel relative mx-auto mt-6 aspect-square w-[78%] touch-none select-none rounded-full">
            <button type="button" onClick={() => setAbout((a) => !a)} aria-label="Menu: about"
              className="absolute left-1/2 top-[7%] -translate-x-1/2 text-[11px] font-bold tracking-[0.12em] text-[#9aa0a6]">MENU</button>
            <button type="button" onClick={() => step(-1)} aria-label="Previous link"
              className="absolute left-[7%] top-1/2 -translate-y-1/2 p-1 text-[#9aa0a6]">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden><path d="M0 6l8-6v12zM8 6l8-6v12z" /><rect x="16" width="2" height="12" /></svg>
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next link"
              className="absolute right-[7%] top-1/2 -translate-y-1/2 p-1 text-[#9aa0a6]">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden><rect width="2" height="12" /><path d="M2 0l8 6-8 6zM10 0l8 6-8 6z" /></svg>
            </button>
            <span aria-hidden className="absolute bottom-[8%] left-1/2 -translate-x-1/2 text-[#9aa0a6]">
              <svg width="20" height="12" viewBox="0 0 20 12" fill="currentColor"><path d="M0 0l8 6-8 6z" /><rect x="11" width="3" height="12" /><rect x="16" width="3" height="12" /></svg>
            </span>
            {current ? (
              <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)} aria-label={`Open ${current.title}`}
                className="lm-pocket-center absolute left-1/2 top-1/2 size-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform duration-100 ease-out active:scale-95" />
            ) : <span className="lm-pocket-center absolute left-1/2 top-1/2 size-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full" />}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-black/50">Spin the wheel, press the center to open</p>
        <SocialRow socials={data.socials} mode={mode} className="mt-3" iconClass="text-[#2b2b2b] hover:bg-black/5" />
      </div>
    </ThemeRoot>
  );
}
