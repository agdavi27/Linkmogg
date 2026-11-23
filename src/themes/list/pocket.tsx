"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick, useParallax } from "../motion";
import { LinkArt } from "../art";
import type { ThemeProps } from "../types";

const STEP_DEG = 24;
const ART = [["#ff6b6b", "#ffd93d"], ["#6bcBef", "#4d5bf5"], ["#7cf29a", "#1f8a70"], ["#f7a1d8", "#7b2ff7"], ["#ffb36b", "#d1495b"], ["#9be7ff", "#00a6a6"]];

export default function PocketPlayer({ data, mode }: ThemeProps) {
  const [sel, setSel] = useState(() => Math.max(0, Math.floor((data.links.length - 1) / 2)));
  const [view, setView] = useState<"list" | "about" | "playing">("list");
  const [pressed, setPressed] = useState<string | null>(null);
  const [touch, setTouch] = useState<number | null>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const swipe = useRef<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{ angle: number; acc: number } | null>(null);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useParallax(stage);
  const n = data.links.length;
  const idx = Math.min(sel, Math.max(0, n - 1));
  const current = data.links[idx];

  useEffect(() => {
    const onShow = () => setView("list");
    window.addEventListener("pageshow", onShow);
    return () => { window.removeEventListener("pageshow", onShow); if (playTimer.current) clearTimeout(playTimer.current); };
  }, []);

  const flash = (k: string) => { setPressed(k); setTimeout(() => setPressed(null), 140); };

  const step = (d: number) => {
    if (!n) return;
    setView("list");
    setSel((s) => {
      const next = Math.max(0, Math.min(n - 1, s + d));
      if (next !== s) { tick(2200, 0.008, 0.05); buzz(4); }
      return next;
    });
  };

  const play = () => {
    if (!current) return;
    flash("center");
    tick(700, 0.04, 0.06);
    buzz(12);
    setView("playing");
    if (playTimer.current) clearTimeout(playTimer.current);
    playTimer.current = setTimeout(() => openRef.current?.click(), 900);
  };

  const angleAt = (e: React.PointerEvent) => {
    const r = wheelRef.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button,a")) return;
    const a = angleAt(e);
    drag.current = { angle: a, acc: 0 };
    setTouch(a);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const a = angleAt(e);
    setTouch(a);
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
  const onUp = () => { drag.current = null; setTouch(null); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); play(); }
    else if (e.key === "Escape") setView((v) => (v === "about" ? "list" : "about"));
  };

  const art = ART[current ? hash(current.id) % ART.length : 0];

  return (
    <ThemeRoot data={data} mode={mode} label="Pocket Player" className="lm-pk-bg overflow-hidden text-[#1b1b1b]">
      <div ref={stage} className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 pt-12">
        <div aria-hidden className="lm-pk-glow" />
        <div className="relative z-10 mb-4 flex flex-col items-center">
          <SocialRow socials={data.socials} mode={mode} iconClass="text-white hover:bg-white/15" />
          <p className="text-center text-xs text-white/80">Spin the wheel or swipe the covers. Press the center to open.</p>
        </div>
        <div className="relative">
          <div className="lm-pocket-body relative rounded-[30px] p-[18px] pb-7" style={{ width: "min(330px, 74cqw, calc((100cqh - 230px) / 1.63))" }}>
            <div aria-hidden className="lm-pk-sheen" />
            {/* Screen */}
            <div className="lm-pocket-screen relative overflow-hidden rounded-[9px]">
              <div className="relative z-10 flex items-center justify-between border-b border-black/25 bg-gradient-to-b from-[#fbfcfd] to-[#b9c3cc] px-2 py-[3px] text-[10px] font-bold">
                <span aria-hidden className="w-4 text-[9px]">{view === "playing" ? "▶" : ""}</span>
                <span className="truncate">{view === "about" ? "About" : view === "playing" ? "Now Playing" : "Player"}</span>
                <span aria-hidden className="lm-pocket-battery" />
              </div>
              <div className="lm-pk-lcd relative aspect-[1.32] overflow-hidden">
                {/* cover view: one album cover per link */}
                <div className={`absolute inset-0 flex flex-col transition-[transform,opacity] duration-300 ${view === "list" ? "" : "pointer-events-none -translate-x-[30%] opacity-0"}`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}>
                  <div role="listbox" tabIndex={0} aria-label="Links. Use arrow keys, Enter to open."
                    aria-activedescendant={n ? `pk-${idx}` : undefined} onKeyDown={onKey}
                    onPointerDown={(e) => { swipe.current = e.clientX; }}
                    onPointerUp={(e) => { if (swipe.current === null) return; const dx = e.clientX - swipe.current; swipe.current = null; if (Math.abs(dx) > 24) step(dx < 0 ? 1 : -1); }}
                    className="lm-pk-flow relative min-h-0 flex-1 touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2a7de1]">
                    {/* full-screen cover art, one per link, sliding sideways */}
                    {data.links.map((l, i) => {
                      const d = i - idx;
                      if (Math.abs(d) > 1) return null;
                      return (
                        <div key={l.id} id={`pk-${i}`} role="option" aria-selected={d === 0} aria-label={l.title}
                          onClick={() => (d === 0 ? play() : (setSel(i), tick(2200, 0.008, 0.05)))}
                          className="lm-pk-full absolute inset-0 cursor-pointer" style={{ transform: `translateX(${d * 100}%)` }}>
                          <LinkArt link={l} className="absolute inset-0" icon={44} blur={0.6} />
                          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
                          <span className="absolute inset-x-2.5 bottom-2 text-left text-white">
                            <span className="block truncate text-[13px] font-bold leading-tight drop-shadow">{l.title}</span>
                            <span className="block truncate text-[10.5px] text-white/75">{hostOf(l.url)} · {i + 1} of {n}</span>
                          </span>
                        </div>
                      );
                    })}
                    {n === 0 ? <p className="p-3 text-center text-xs">No links yet.</p> : null}
                  </div>
                </div>

                {/* about */}
                <div className={`absolute inset-0 flex items-center gap-3 px-3 transition-[transform,opacity] duration-300 ${view === "about" ? "" : "pointer-events-none translate-x-[30%] opacity-0"}`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}>
                  <Avatar data={data} size={68} className="rounded-md shadow-[0_2px_6px_rgba(0,0,0,.3)]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{data.displayName || data.username}</p>
                    <p className="line-clamp-5 text-[11px] leading-snug text-black/70">{data.bio}</p>
                  </div>
                </div>

                {/* now playing */}
                <div className={`absolute inset-0 flex flex-col justify-center gap-2 px-3 transition-[transform,opacity] duration-300 ${view === "playing" ? "" : "pointer-events-none translate-x-[30%] opacity-0"}`}
                  style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }} aria-live="polite">
                  {current && view === "playing" ? (
                    <>
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="lm-pk-art lm-pk-cover grid size-[70px] shrink-0 place-items-center rounded-[4px]" style={{ ["--a" as string]: art[0], ["--b" as string]: art[1] } as CSSProperties}>
                          <span className="text-3xl font-black text-white">{current.title.trim()[0]?.toUpperCase()}</span>
                        </span>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-[13px] font-bold leading-tight">{current.title}</p>
                          <p className="truncate text-[11px] text-black/60">{hostOf(current.url)}</p>
                          <p className="mt-0.5 text-[10px] text-black/50">{idx + 1} of {n}</p>
                        </div>
                      </div>
                      <div className="lm-pk-progress h-[7px] overflow-hidden rounded-full"><span /></div>
                      <p className="text-center text-[10px] font-semibold text-black/55">Opening…</p>
                    </>
                  ) : null}
                </div>
                <div aria-hidden className="lm-pk-glare" />
              </div>
            </div>
            {current ? <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)} tabIndex={-1} aria-hidden className="hidden">{current.title}</a> : null}

            {/* Click wheel */}
            <div ref={wheelRef} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              onWheel={(e) => step(e.deltaY > 0 ? 1 : -1)}
              className="lm-pocket-wheel relative mx-auto mt-[9%] aspect-square w-[76%] touch-none select-none rounded-full">
              {touch !== null ? <span aria-hidden className="lm-pk-touch" style={{ transform: `rotate(${touch + 90}deg)` }} /> : null}
              <button type="button" onClick={() => { flash("menu"); tick(1600, 0.01); setView((v) => (v === "about" ? "list" : "about")); }} aria-label="Menu: about"
                className={`absolute left-1/2 top-[6%] -translate-x-1/2 px-2 py-1 text-[11px] font-bold tracking-[0.14em] text-[#75797e] transition-transform duration-100 ${pressed === "menu" ? "scale-90" : ""}`}>MENU</button>
              <button type="button" onClick={() => { flash("prev"); step(-1); }} aria-label="Previous link"
                className={`absolute left-[6%] top-1/2 -translate-y-1/2 p-1.5 text-[#75797e] transition-transform duration-100 ${pressed === "prev" ? "scale-90" : ""}`}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden><path d="M0 6l8-6v12zM8 6l8-6v12z" /><rect x="16" width="2" height="12" /></svg>
              </button>
              <button type="button" onClick={() => { flash("next"); step(1); }} aria-label="Next link"
                className={`absolute right-[6%] top-1/2 -translate-y-1/2 p-1.5 text-[#75797e] transition-transform duration-100 ${pressed === "next" ? "scale-90" : ""}`}>
                <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden><rect width="2" height="12" /><path d="M2 0l8 6-8 6zM10 0l8 6-8 6z" /></svg>
              </button>
              <button type="button" onClick={play} aria-label={current ? `Play: open ${current.title}` : "Play"}
                className="absolute bottom-[6%] left-1/2 -translate-x-1/2 p-1.5 text-[#75797e]">
                <svg width="20" height="12" viewBox="0 0 20 12" fill="currentColor" aria-hidden><path d="M0 0l8 6-8 6z" /><rect x="11" width="3" height="12" /><rect x="16" width="3" height="12" /></svg>
              </button>
              <button type="button" onClick={play} aria-label={current ? `Open ${current.title}` : "Select"}
                className={`lm-pocket-center absolute left-1/2 top-1/2 size-[37%] -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform duration-100 ${pressed === "center" ? "scale-[.94]" : ""}`} />
            </div>
          </div>
          <div aria-hidden className="lm-pk-cable"><span /></div>
        </div>
      </div>
    </ThemeRoot>
  );
}
