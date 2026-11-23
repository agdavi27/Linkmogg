"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

// Sky colors for each link: [top, middle, horizon].
const SKIES: [string, string, string][] = [
  ["#1f5b66", "#3f7f86", "#e6b48c"], ["#173a5c", "#3d6f9a", "#f0c49a"], ["#2b4a5e", "#6a8ea0", "#f2d1b0"],
  ["#123447", "#2f6e7e", "#d9a07c"], ["#3a3f6b", "#7a7fa8", "#f3b8a0"], ["#0f3b4a", "#3c8a8c", "#f6d7a8"],
];

/** A plane window. The view and its little flight readout change as you swipe to the next link. */
export default function Window({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(0);
  const [blink, setBlink] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(stage);
  const [now, setNow] = useState("");
  useEffect(() => {
    const fmt = () => setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }));
    fmt();
    const t = setInterval(fmt, 30_000);
    return () => clearInterval(t);
  }, []);

  const go = (i: number) => {
    if (!n) return;
    const next = ((i % n) + n) % n;
    if (next === sel) return;
    setSel(next); setBlink((b) => b + 1);
    tick(900, 0.03, 0.03); buzz(6);
  };
  const dragProps = useDragX(() => {}, (dx) => { if (Math.abs(dx) > 40) go(sel + (dx < 0 ? 1 : -1)); });
  const l = data.links[sel];
  const k = l ? hash(l.id + l.title) : 0;
  const sky = SKIES[k % SKIES.length];
  const name = data.displayName || data.username;

  // The window keeps its shape and fills most of the screen.
  const WH = Math.min(h * 0.9, (w * 0.86) / 0.72);
  const WW = WH * 0.72;
  const wave = Array.from({ length: 60 }, (_, i) => 8 + Math.sin(i * 0.5 + (k % 7)) * 3 + Math.sin(i * 1.7 + (k % 5)) * 2.5);

  return (
    <ThemeRoot data={data} mode={mode} label="Window" badgeTone="light" className="lm-wi bg-[#0c0e10] text-[#eafbe9]">
      <div ref={stage} {...dragProps} tabIndex={-1}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowLeft") go(sel - 1); }}
        className="relative flex min-h-0 flex-1 cursor-grab touch-pan-y select-none items-center justify-center overflow-hidden outline-none active:cursor-grabbing">
        <div aria-hidden className="lm-wi-wall absolute inset-0" />
        {w > 0 ? (
          <div className="lm-wi-frame relative" style={{ width: WW, height: WH, ["--u" as string]: `${WW / 100}px` } as CSSProperties}>
            <div className="lm-wi-glass absolute overflow-hidden" style={{ background: `linear-gradient(180deg, ${sky[0]} 0%, ${sky[1]} 55%, ${sky[2]} 78%, ${sky[1]} 100%)` }}>
              {/* the view: clouds drifting under a wing */}
              <div key={`v${sel}`} className="lm-wi-view absolute inset-0">
                <span aria-hidden className="lm-wi-clouds" />
                <span aria-hidden className="lm-wi-clouds is-far" />
                <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="lm-wi-wing absolute bottom-[22%] right-0 h-[30%] w-[62%]">
                  <path d="M100 58 L38 74 C 33 75, 31 72, 34 69 L60 50 L52 2 C 51 0, 54 0, 55 2 L74 42 L100 34 Z" fill="#1d2a30" />
                  <path d="M100 52 L42 70 L60 50 L100 40 Z" fill="#2b3b42" opacity=".7" />
                </svg>
              </div>

              {/* the readout over the view */}
              <div className="lm-wi-hud absolute inset-0 flex flex-col px-[9%] pb-[8%] pt-[11%]" aria-live="polite">
                <Compass k={k} />
                <div className="mt-[3%] flex items-end justify-between">
                  <span className="text-[calc(var(--u)*6.4)] font-semibold leading-none tracking-[-0.03em]">{now}</span>
                  <span className="flex items-end gap-[calc(var(--u)*1.5)]">
                    <span className="text-right leading-none">
                      <span className="block text-[calc(var(--u)*1.8)] opacity-80">{String(sel + 1).padStart(4, "0")}</span>
                      <span className="text-[calc(var(--u)*3.4)] font-medium">{name.split(" ")[0]}</span>
                    </span>
                    {l ? <LinkArt link={l} className="size-[calc(var(--u)*7)] rounded-[2px] ring-1 ring-[#eafbe9]/60" icon={0} mark={false} /> : null}
                  </span>
                </div>
                <div className="mt-[1.5%] flex justify-between border-t border-[#eafbe9]/50 pt-[0.6%] text-[calc(var(--u)*1.7)] uppercase opacity-85">
                  <span>Link {sel + 1} of {n}</span><span>{l ? hostOf(l.url) : ""}</span>
                </div>
                <svg aria-hidden viewBox="0 0 120 16" preserveAspectRatio="none" className="mt-[2%] h-[calc(var(--u)*5)] w-full opacity-80">
                  {wave.map((v, i) => <line key={i} x1={i * 2 + 1} x2={i * 2 + 1} y1={16 - v} y2={16} stroke="#eafbe9" strokeWidth=".5" />)}
                  <path d={`M0 15.5 H120`} stroke="#eafbe9" strokeWidth=".4" />
                </svg>

                {l ? (
                  <a key={l.id} href={l.url} {...linkTarget(mode, l.url)} className="lm-wi-title group mt-[5%] block outline-none">
                    <span className="flex items-end gap-[calc(var(--u)*2)]">
                      <span className="line-clamp-2 text-[calc(var(--u)*10.5)] font-semibold leading-[0.95] tracking-[-0.045em]">{l.title}</span>
                    </span>
                    <span className="mt-[calc(var(--u)*2.4)] flex items-center gap-[calc(var(--u)*2)] text-[calc(var(--u)*2.4)] font-medium">
                      <span className="lm-wi-tag px-[calc(var(--u)*1.2)] uppercase">Open ↗</span>
                      <span className="opacity-85">@{data.username} → {hostOf(l.url)}</span>
                    </span>
                  </a>
                ) : <Empty className="mt-[20%] text-[#eafbe9]" />}

                <div aria-hidden className="relative mt-auto">
                  <div className="mb-[4%] flex items-center justify-center gap-[6%] opacity-70">
                    <span className="h-px flex-1 bg-[#eafbe9]/60" /><span className="size-[calc(var(--u)*3)] rounded-full border border-[#eafbe9]/80" /><span className="h-px flex-1 bg-[#eafbe9]/60" />
                  </div>
                  <p className="text-[calc(var(--u)*7)] font-semibold leading-none tracking-[-0.03em]">{String(sel + 1).padStart(2, "0")} <span className="text-[0.6em]">{"NESW"[k % 4]}</span></p>
                  <div className="mt-[2%] grid grid-cols-2 gap-x-[6%] border-t border-[#eafbe9]/50 pt-[1%] text-[calc(var(--u)*1.7)] uppercase">
                    <span className="flex justify-between"><span className="opacity-75">From</span><span className="lm-wi-tag px-1">@{data.username}</span></span>
                    <span className="flex justify-between"><span className="opacity-75">Links</span><span>{n}</span></span>
                  </div>
                </div>

                {/* the next and previous links, like tabs along the bottom */}
                <nav aria-label="Links" className="mt-[5%] flex items-center justify-center gap-[5%] text-[calc(var(--u)*2.6)]">
                  <button type="button" onClick={() => go(sel - 1)} className="max-w-[30%] truncate opacity-40 hover:opacity-80" aria-label="Previous link">{n > 1 ? data.links[(sel - 1 + n) % n].title : ""}</button>
                  <span aria-hidden className="opacity-50">‹</span>
                  <span className="max-w-[34%] truncate font-semibold">{l?.title}</span>
                  <span aria-hidden className="opacity-50">›</span>
                  <button type="button" onClick={() => go(sel + 1)} className="max-w-[30%] truncate opacity-40 hover:opacity-80" aria-label="Next link">{n > 1 ? data.links[(sel + 1) % n].title : ""}</button>
                </nav>
              </div>
              {/* the shade drops for a blink between links */}
              {blink ? <span key={blink} aria-hidden className="lm-wi-shade absolute inset-0" /> : null}
            </div>
          </div>
        ) : null}
      </div>
      <div className="relative z-10 flex shrink-0 flex-col items-center pb-1">
        <p className="text-[11px] text-[#eafbe9]/55">Swipe for the next link</p>
        <SocialRow socials={data.socials} mode={mode} iconClass="size-9! text-[#eafbe9]/80 hover:bg-white/10" size={18} />
      </div>
    </ThemeRoot>
  );
}

function Compass({ k }: { k: number }) {
  const heading = (k % 360);
  return (
    <div aria-hidden className="text-[calc(var(--u)*1.5)] opacity-80">
      <p className="text-center">{heading}° {(k >>> 4) % 60}′ {(k >>> 8) % 60}″ E</p>
      <div className="relative mt-[1%] flex h-[calc(var(--u)*2)] items-end justify-between border-b border-[#eafbe9]/70">
        {Array.from({ length: 25 }, (_, i) => <span key={i} className="w-px bg-[#eafbe9]/70" style={{ height: i % 6 === 0 ? "100%" : "45%" }} />)}
      </div>
      <div className="mt-[0.5%] flex justify-between"><span>W</span><span>NW</span><span>N</span><span>NE</span><span>E</span></div>
    </div>
  );
}
