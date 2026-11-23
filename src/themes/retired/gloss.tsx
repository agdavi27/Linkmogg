"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { platformLabel } from "@/lib/socials/platforms";
import { Avatar, ThemeRoot, hash, linkTarget } from "../shared";
import { buzz, tick, useParallax } from "../motion";
import type { ThemeProps } from "../types";

// Glossy icon tints, one per link (stable by id).
const TINTS = ["#2f8cff", "#34c759", "#ff9f0a", "#ff375f", "#5ac8fa", "#ffcc00", "#30b0c7", "#ff6b3d", "#8e5cf7", "#64d2a0"];

// Water drops on the wallpaper. Deterministic so server and client agree.
const DROPS = Array.from({ length: 120 }, (_, i) => {
  const h = hash(`gd${i}`);
  const size = i < 22 ? 22 + ((h >> 15) % 26) : i < 60 ? 9 + ((h >> 15) % 12) : 3 + ((h >> 15) % 6);
  return { x: h % 100, y: (h >> 8) % 100, s: size, squish: 0.82 + ((h >> 20) % 30) / 100 };
});
const TRICKLES = [{ x: 18, d: 0, t: 11 }, { x: 63, d: 4.5, t: 14 }, { x: 84, d: 8, t: 12 }];

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const f = () => setNow(new Date());
    f();
    const id = setInterval(f, 15_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Wallpaper() {
  return (
    <div aria-hidden className="lm-gw absolute inset-[-24px]">
      {DROPS.map((d, i) => (
        <span key={i} className="lm-gdrop absolute rounded-[50%]"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s * d.squish }} />
      ))}
      {TRICKLES.map((t, i) => (
        <span key={`t${i}`} className="lm-gtrickle absolute top-0"
          style={{ left: `${t.x}%`, animationDelay: `${t.d}s`, animationDuration: `${t.t}s` }} />
      ))}
    </div>
  );
}

function StatusBar({ now }: { now: Date | null }) {
  return (
    <div className={`relative z-20 flex h-5 items-center justify-between px-1.5 text-[11px] font-bold text-white bg-black/40`}>
      <span aria-hidden className="flex items-center gap-1">
        <span className="flex items-end gap-[1.5px]">{[3, 5, 7, 9, 11].map((h, i) => <i key={h} className={`block w-[3px] rounded-[1px] ${i < 4 ? "bg-white" : "bg-white/35"}`} style={{ height: h }} />)}</span>
        Mogg <span className="font-semibold">3G</span>
      </span>
      <span suppressHydrationWarning>{now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) ?? ""}</span>
      <span aria-hidden className="lm-gbatt" />
    </div>
  );
}

/** Drag-to-open slider. Also opens on Enter/Space, and on a click for anyone who can't drag. */
function SlideToOpen({ onOpen }: { onOpen: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [drag, setDrag] = useState(false);
  const start = useRef(0);
  const max = () => (track.current ? track.current.clientWidth - 52 : 200);
  return (
    <div ref={track} className="lm-gslide relative mx-auto h-[52px] w-[min(272px,84%)] rounded-[13px] p-[3px]">
      <span className="lm-gshimmer pointer-events-none absolute inset-0 grid place-items-center pl-12 text-[19px] font-normal"
        style={{ opacity: Math.max(0, 1 - x / 90) }}>slide to open</span>
      <button type="button" aria-label="Slide to open the page"
        className="lm-gknob relative z-10 grid h-[46px] w-[58px] touch-none place-items-center rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ transform: `translateX(${x}px)`, transition: drag ? "none" : "transform .35s cubic-bezier(0.23,1,0.32,1)" }}
        onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); start.current = e.clientX - x; setDrag(true); }}
        onPointerMove={(e) => { if (drag) setX(Math.max(0, Math.min(max(), e.clientX - start.current))); }}
        onPointerUp={() => {
          setDrag(false);
          if (x > max() * 0.82) { setX(max()); buzz(12); onOpen(); } else if (x < 4) { setX(max()); setTimeout(onOpen, 220); } else setX(0);
        }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") { e.preventDefault(); setX(max()); setTimeout(onOpen, 220); } }}>
        <svg width="26" height="20" viewBox="0 0 26 20" aria-hidden><path d="M2 10h18M13 3l7 7-7 7" fill="none" stroke="#7b7f86" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}

const SKIP_KEY = "lm-gloss-open";

export default function GlossPhone({ data, mode }: ThemeProps) {
  const now = useClock();
  const screen = useRef<HTMLDivElement>(null);
  useParallax(screen);
  // Lock screen first, unless this visitor already unlocked during this session.
  const [locked, setLocked] = useState(true);
  const [phase, setPhase] = useState<"lock" | "opening" | "home">("lock");
  const [jiggle, setJiggle] = useState(false);
  const [launch, setLaunch] = useState<{ x: number; y: number; tint: string; title: string } | null>(null);
  const press = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  useEffect(() => {
    let skip = false;
    try { skip = sessionStorage.getItem(SKIP_KEY) === "1"; } catch { /* storage blocked */ }
    if (skip) { setLocked(false); setPhase("home"); } // eslint-disable-line react-hooks/set-state-in-effect
    // Coming back from a link (back/forward cache): close the "app".
    const onShow = () => setLaunch(null);
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const unlock = useCallback(() => {
    tick(900, 0.05, 0.05);
    setLocked(false);
    setPhase("opening");
    try { sessionStorage.setItem(SKIP_KEY, "1"); } catch { /* storage blocked */ }
    setTimeout(() => setPhase("home"), 900);
  }, []);

  const homeButton = () => {
    buzz(10);
    tick(600, 0.03, 0.05);
    if (launch) setLaunch(null);
    else if (jiggle) setJiggle(false);
    else if (locked) unlock();
    else { setPhase("opening"); setTimeout(() => setPhase("home"), 900); }
  };

  const date = now?.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" }) ?? "";
  const time = now?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/i, "") ?? "";
  const name = data.displayName || `@${data.username}`;

  return (
    <ThemeRoot data={data} mode={mode} label="Gloss Phone" badgeTone="light" className="lm-gbg text-white">
      <div className="flex flex-1 items-stretch justify-center @min-[640px]:items-center @min-[640px]:px-4 @min-[640px]:py-10">
        <div className="lm-gphone relative flex w-full flex-col @min-[640px]:w-[372px] @min-[640px]:flex-none">
          <div aria-hidden className="lm-gphone-top hidden @min-[640px]:flex"><i className="lm-gcam" /><i className="lm-gspeaker" /></div>

          <div ref={screen} className="lm-gscreen relative flex min-h-[600px] flex-1 flex-col overflow-hidden @min-[640px]:h-[560px] @min-[640px]:min-h-0 @min-[640px]:flex-none" data-phase={phase} data-jiggle={jiggle || undefined}>
            <Wallpaper />
            <StatusBar now={now} />

            {/* ---------- Home screen ---------- */}
            <div className="lm-ghome relative flex flex-1 flex-col" aria-hidden={locked} inert={locked || undefined}>
              <div className="lm-gicon-in mx-2.5 mt-2.5 flex items-center gap-2.5 rounded-[12px] border border-white/35 p-2 lm-gbanner" style={{ ["--i" as string]: 0 } as CSSProperties}>
                <Avatar data={data} size={42} className="rounded-[9px]! border border-white/60 shadow-[0_1px_3px_rgba(0,0,0,.5)]" />
                <div className="min-w-0 [text-shadow:0_-1px_0_rgba(0,0,0,.45)]">
                  <h1 className="truncate text-[15px] font-bold leading-tight">{name}</h1>
                  {data.bio ? <p className="line-clamp-2 text-[11.5px] leading-[1.25] text-white/90">{data.bio}</p> : null}
                </div>
              </div>

              <ul className="grid grid-cols-4 gap-x-1 gap-y-3.5 px-3 pt-4" aria-label="Links">
                {data.links.map((l, i) => {
                  const p = detectPlatform(l.url)?.platform ?? "website";
                  const known = p !== "website" && p !== "email";
                  const tint = TINTS[hash(l.id) % TINTS.length];
                  return (
                    <li key={l.id} className="lm-gicon-in" style={{ ["--i" as string]: i + 1 } as CSSProperties}>
                      <a href={l.url} {...linkTarget(mode, l.url)}
                        onPointerDown={() => { longPressed.current = false; press.current = setTimeout(() => { longPressed.current = true; setJiggle(true); buzz(20); }, 550); }}
                        onPointerUp={() => press.current && clearTimeout(press.current)}
                        onPointerLeave={() => press.current && clearTimeout(press.current)}
                        onContextMenu={(e) => e.preventDefault()}
                        onClick={(e) => {
                          if (longPressed.current || jiggle) { e.preventDefault(); longPressed.current = false; return; }
                          const r = (e.currentTarget.firstElementChild as HTMLElement).getBoundingClientRect();
                          const s = screen.current!.getBoundingClientRect();
                          tick(1400, 0.02, 0.04);
                          setLaunch({ x: r.left + r.width / 2 - s.left, y: r.top + r.height / 2 - s.top, tint, title: l.title });
                        }}
                        className="group flex select-none flex-col items-center gap-1 rounded-xl outline-none [-webkit-touch-callout:none] focus-visible:ring-2 focus-visible:ring-white/80">
                        <span className="lm-gicon relative grid size-[57px] place-items-center rounded-[13px] transition-[filter] duration-75 group-active:brightness-[.55]"
                          style={{ ["--tint" as string]: tint, animationDelay: `${-(hash(l.id) % 300)}ms` } as CSSProperties}>
                          {known
                            ? <SocialIcon platform={p} size={30} color="#fff" className="relative drop-shadow-[0_-1px_0_rgba(0,0,0,.35)]" />
                            : <span className="relative text-[27px] font-bold leading-none drop-shadow-[0_-1px_0_rgba(0,0,0,.35)]">{l.title.trim()[0]?.toUpperCase() ?? "•"}</span>}
                        </span>
                        <span className="w-full truncate px-0.5 text-center text-[11px] font-bold leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,.9)]">{l.title}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              {data.links.length === 0 ? <p className="mt-8 text-center text-sm [text-shadow:0_1px_2px_#000]">No apps yet.</p> : null}

              <div className="flex-1" />
              <div aria-hidden className="mb-2 flex justify-center gap-2">
                <span className="size-[7px] rounded-full bg-white" /><span className="size-[7px] rounded-full bg-white/35" />
              </div>
              {data.socials.length ? (
                <div className="lm-gdock-wrap lm-gicon-in relative" style={{ ["--i" as string]: data.links.length + 1 } as CSSProperties}>
                  <div aria-hidden className="lm-gshelf absolute inset-x-0 bottom-0 h-[62px]" />
                  <ul className="relative flex justify-center gap-[18px] px-3 pb-[22px] pt-2" aria-label="Social profiles">
                    {data.socials.slice(0, 4).map((s, i) => (
                      <li key={i}>
                        <a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)}
                          className="group block rounded-[13px] outline-none focus-visible:ring-2 focus-visible:ring-white">
                          <span className="lm-gicon lm-greflect relative grid size-[57px] place-items-center rounded-[13px] transition-[filter] duration-75 group-active:brightness-[.55]"
                            style={{ ["--tint" as string]: ["#3478f6", "#1c1c1e", "#e0322a", "#1db954"][i % 4] } as CSSProperties}>
                            <SocialIcon platform={s.platform} size={30} color="#fff" className="relative" />
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : <div className="h-6" />}
            </div>

            {/* ---------- Lock screen ---------- */}
            <div className="lm-glock absolute inset-x-0 bottom-0 top-5 z-10 flex flex-col" aria-hidden={!locked} inert={!locked || undefined}>
              <div className="lm-glock-top relative px-4 pb-2.5 pt-1.5 text-center">
                <p className="text-[64px] font-extralight leading-[1.05] tracking-[-0.01em] [text-shadow:0_-1px_0_rgba(0,0,0,.5)]" suppressHydrationWarning>{time}</p>
                <p className="text-[15px] font-semibold [text-shadow:0_-1px_0_rgba(0,0,0,.5)]" suppressHydrationWarning>{date}</p>
              </div>
              <div className="flex flex-1 items-center justify-center px-4">
                <div className="lm-gnotice w-full max-w-[300px] rounded-[10px] p-2.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar data={data} size={34} className="rounded-[7px]! border border-white/50" />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold leading-tight">{name}</p>
                      <p className="text-[11px] text-white/70">{data.links.length} new {data.links.length === 1 ? "link" : "links"}</p>
                    </div>
                  </div>
                  {data.bio ? <p className="mt-1.5 line-clamp-3 text-[12.5px] leading-snug text-white/90">{data.bio}</p> : null}
                </div>
              </div>
              <div className="lm-glock-bottom px-4 pb-6 pt-4">
                <SlideToOpen onOpen={unlock} />
              </div>
            </div>

            {/* ---------- App launch zoom ---------- */}
            {launch ? (
              <div aria-hidden className="lm-glaunch absolute inset-0 z-30 grid place-items-center"
                style={{ transformOrigin: `${launch.x}px ${launch.y}px`, ["--tint" as string]: launch.tint } as CSSProperties}>
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <span className="lm-gicon relative grid size-[76px] place-items-center rounded-[17px] text-3xl font-bold" style={{ ["--tint" as string]: launch.tint } as CSSProperties}>
                    <span className="relative">{launch.title.trim()[0]?.toUpperCase()}</span>
                  </span>
                  <p className="text-lg font-bold [text-shadow:0_-1px_0_rgba(0,0,0,.4)]">{launch.title}</p>
                  <span className="lm-gspinner" />
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden justify-center py-3 @min-[640px]:flex">
            <button type="button" onClick={homeButton} aria-label={locked ? "Home button: open the page" : "Home button"}
              className="lm-ghomebtn grid size-[54px] place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70">
              <span aria-hidden className="size-[15px] rounded-full border-2 border-white/45" />
            </button>
          </div>
        </div>
      </div>
      {jiggle ? (
        <button type="button" onClick={() => setJiggle(false)} className="absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-black/80 px-4 py-2 text-sm font-semibold text-white">Done</button>
      ) : null}
    </ThemeRoot>
  );
}
