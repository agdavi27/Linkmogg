"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, ThemeRoot, hostOf, linkTarget } from "../shared";
import { buzz, tick } from "../motion";
import type { ThemeProps } from "../types";

type Pos = { x: number; y: number };

/** A window you can drag by its title bar (mouse or touch). */
function Win({ title, onClose, children, className = "", style, pos, onMove, onFocus }: {
  title: string; onClose?: () => void; children: ReactNode; className?: string; style?: CSSProperties;
  pos: Pos; onMove: (p: Pos) => void; onFocus?: () => void;
}) {
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  return (
    <section className={`lm-win ${className}`} aria-label={title} onPointerDown={onFocus}
      style={{ ...style, translate: `${pos.x}px ${pos.y}px` }}>
      <header className="lm-win-bar flex cursor-grab touch-none select-none items-center gap-2 px-1.5 py-1 active:cursor-grabbing"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => { const d = drag.current; if (d) onMove({ x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }); }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}>
        <span aria-hidden className="lm-win-stripes h-3 flex-1" />
        <h2 className="px-1 font-pixel text-lg leading-none">{title}</h2>
        <span aria-hidden className="lm-win-stripes h-3 flex-1" />
        {onClose ? (
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}
            className="lm-win-btn grid size-5 place-items-center font-pixel text-base leading-none">×</button>
        ) : null}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function DocGlyph({ tint }: { tint: string }) {
  return (
    <svg aria-hidden width="40" height="44" viewBox="0 0 20 22" shapeRendering="crispEdges">
      <path d="M2 1h11l5 5v15H2z" fill="#fffdf4" stroke="#1d1d1b" strokeWidth="1.2" />
      <path d="M13 1v5h5" fill={tint} stroke="#1d1d1b" strokeWidth="1.2" />
      <path d="M5 10h10M5 13h10M5 16h7" stroke="#1d1d1b" strokeWidth="1.2" />
    </svg>
  );
}

const TINTS = ["#f2c94c", "#7fb7a4", "#f2994a", "#bb6bd9", "#56ccf2", "#eb5757"];
const BOOT_KEY = "lm-moggos-booted";

export default function Desktop({ data, mode }: ThemeProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [origin, setOrigin] = useState("50% 50%");
  const [start, setStart] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [boot, setBoot] = useState<"on" | "done">("on");
  const [saver, setSaver] = useState(false);
  const [pos, setPos] = useState<Record<string, Pos>>({});
  const [front, setFront] = useState("profile");
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desk = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(BOOT_KEY) === "1"; } catch { /* storage blocked */ }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => { setBoot("done"); try { sessionStorage.setItem(BOOT_KEY, "1"); } catch { /* blocked */ } }, seen || reduce ? 0 : 1700);
    const f = () => setTime(new Date());
    f();
    const id = setInterval(f, 1000);
    return () => { clearTimeout(t); clearInterval(id); };
  }, []);

  // Screensaver after 25s of no input. Any input wakes it.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const wake = () => {
      setSaver(false);
      if (idle.current) clearTimeout(idle.current);
      idle.current = setTimeout(() => setSaver(true), 25_000);
    };
    wake();
    const evs = ["pointermove", "pointerdown", "keydown", "scroll", "touchstart"] as const;
    evs.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => { evs.forEach((e) => window.removeEventListener(e, wake)); if (idle.current) clearTimeout(idle.current); };
  }, []);

  const current = open !== null ? data.links[open] : null;
  const p = (k: string) => pos[k] ?? { x: 0, y: 0 };
  const move = (k: string) => (v: Pos) => setPos((s) => ({ ...s, [k]: v }));
  const clock = time?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? "";

  const openFile = (i: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const d = desk.current!.getBoundingClientRect();
    setOrigin(`${r.left + r.width / 2 - d.left}px ${r.top + r.height / 2 - d.top}px`);
    setOpen(i);
    setFront("link");
    setPos((s) => ({ ...s, link: { x: 0, y: 0 } }));
    tick(1200, 0.02, 0.04);
    buzz(6);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Mogg OS desktop" className="lm-desk relative overflow-hidden text-[#1d1d1b]">
      <div ref={desk} className="relative mx-auto flex w-full max-w-[520px] flex-1 flex-col px-3 pb-16 pt-4">
        <Win title="profile.txt" pos={p("profile")} onMove={move("profile")} onFocus={() => setFront("profile")}
          className="lm-win-in relative" style={{ zIndex: front === "profile" ? 15 : 5 }}>
          <div className="flex items-center gap-3">
            <Avatar data={data} size={56} className="rounded-none! border-2 border-[#1d1d1b] bg-[#f2c94c]! text-[#1d1d1b]" />
            <div className="min-w-0">
              <h1 className="truncate font-pixel text-[28px] leading-none">{data.displayName || `@${data.username}`}</h1>
              {data.bio ? <p className="mt-1 line-clamp-3 text-sm leading-snug">{data.bio}</p> : null}
            </div>
          </div>
        </Win>

        <ul className="mt-4 grid grid-cols-3 gap-2 @min-[480px]:grid-cols-4" aria-label="Files. Each opens a link window.">
          {data.links.map((l, i) => (
            <li key={l.id} className="lm-icon-in" style={{ animationDelay: `${(boot === "on" ? 1800 : 0) + i * 60}ms` }}>
              <button type="button" onClick={(e) => openFile(i, e.currentTarget)}
                className={`group flex w-full flex-col items-center gap-1 p-1.5 outline-none ${open === i ? "lm-icon-sel" : ""} focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-[#1d1d1b]`}>
                <span className="transition-transform duration-150 group-hover:-translate-y-0.5 group-active:scale-95"><DocGlyph tint={TINTS[i % TINTS.length]} /></span>
                <span className="lm-icon-label line-clamp-2 px-1 text-center font-pixel text-base leading-[1]">{l.title}</span>
              </button>
            </li>
          ))}
        </ul>
        {data.links.length === 0 ? <p className="mt-6 text-center font-pixel text-xl">This disk is empty.</p> : null}

        {current ? (
          <div key={open} className="lm-zoom pointer-events-none absolute inset-x-6 top-28 z-20 mx-auto max-w-[420px]" style={{ transformOrigin: origin }}>
            <Win title={`${current.title.slice(0, 18)}.lnk`} onClose={() => setOpen(null)} pos={p("link")} onMove={move("link")} onFocus={() => setFront("link")}
              className="pointer-events-auto shadow-[6px_6px_0_rgba(0,0,0,.35)]" style={{ zIndex: front === "link" ? 15 : 5 }}>
              <p className="font-pixel text-[26px] leading-none">{current.title}</p>
              <p className="mt-1 truncate text-sm text-[#4b4a44]">{hostOf(current.url)}</p>
              <div className="lm-win-inset mt-3 h-3 overflow-hidden"><span className="lm-progress block h-full" /></div>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(null)} className="lm-win-btn px-3 py-1 font-pixel text-lg">Cancel</button>
                <a href={current.url} {...linkTarget(mode, current.url)} autoFocus className="lm-win-btn lm-win-primary px-4 py-1 font-pixel text-lg">Open</a>
              </div>
            </Win>
          </div>
        ) : null}
      </div>

      <div aria-hidden className="lm-icon-in absolute right-4 z-10 flex flex-col items-center gap-1" style={{ bottom: (data.showBadge ? 52 : 0) + 58, animationDelay: boot === "on" ? "1.9s" : "0s" }}>
        <svg width="34" height="40" viewBox="0 0 17 20" shapeRendering="crispEdges"><path d="M2 4h13M6 4V2h5v2M3 4l1 15h9l1-15" fill="#fffdf4" stroke="#1d1d1b" strokeWidth="1.2" /><path d="M7 7v9M10 7v9" stroke="#1d1d1b" strokeWidth="1.1" /></svg>
        <span className="lm-icon-label px-1 font-pixel text-base leading-none">Trash</span>
      </div>

      <div className="lm-taskbar absolute inset-x-0 bottom-0 z-30 flex items-center gap-2 px-2 py-1.5" style={{ bottom: data.showBadge ? 52 : 0 }}>
        <button type="button" onClick={() => { setStart((s) => !s); tick(1500, 0.015); }} aria-expanded={start}
          className="lm-win-btn flex items-center gap-1 px-2 py-0.5 font-pixel text-lg">✦ Start</button>
        {current ? <span className="lm-win-inset hidden max-w-[40%] truncate px-2 py-0.5 font-pixel text-lg @min-[380px]:block">{current.title}</span> : null}
        <span className="flex-1" />
        <span className="lm-win-inset px-2 py-0.5 font-pixel text-lg tabular-nums" suppressHydrationWarning>{clock.replace(":", time && time.getSeconds() % 2 ? " " : ":")}</span>
        {start ? (
          <div className="lm-win lm-menu absolute bottom-full left-2 mb-1 w-56">
            <p className="lm-win-bar px-2 py-1 font-pixel text-lg">Find me on</p>
            <ul className="p-1">
              {data.socials.map((s, i) => (
                <li key={i}>
                  <a href={s.url} {...linkTarget(mode, s.url)} className="flex items-center gap-2 px-2 py-1.5 font-pixel text-lg hover:bg-[#1d1d1b] hover:text-[#fffdf4]">
                    <SocialIcon platform={s.platform} size={16} /> {platformLabel(s.platform)}
                  </a>
                </li>
              ))}
              {data.socials.length === 0 ? <li className="px-2 py-1.5 font-pixel text-lg opacity-60">Nothing here</li> : null}
            </ul>
          </div>
        ) : null}
      </div>

      {boot === "on" ? (
        <div className="lm-boot absolute inset-0 z-50 grid place-items-center bg-[#1d1d1b] text-[#fffdf4]" onClick={() => setBoot("done")}>
          <div className="flex flex-col items-center gap-4">
            <span aria-hidden className="lm-boot-logo grid size-16 place-items-center border-2 border-[#fffdf4] font-pixel text-4xl">M</span>
            <p className="font-pixel text-2xl">Mogg OS</p>
            <div className="h-3 w-40 border-2 border-[#fffdf4] p-[1px]"><span className="lm-boot-bar block h-full bg-[#f2c94c]" /></div>
            <p className="font-pixel text-base opacity-60">loading {data.links.length} files…</p>
          </div>
        </div>
      ) : null}

      {saver ? (
        <div aria-hidden className="lm-saver absolute inset-0 z-40 bg-black/85">
          <span className="lm-saver-x"><span className="lm-saver-y grid h-12 w-28 place-items-center border-2 font-pixel text-3xl">{(data.displayName || data.username).split(" ")[0].slice(0, 8)}</span></span>
        </div>
      ) : null}
    </ThemeRoot>
  );
}
