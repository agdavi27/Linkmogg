"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LiveCanvas, buzz, tick, type DrawFn } from "../motion";
import type { ThemeProps } from "../types";

const MINT = "60,255,180";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const f = () => setNow(new Date());
    f();
    const id = setInterval(f, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Signal({ data, mode }: ThemeProps) {
  const [hot, setHot] = useState<number | null>(null);
  const energy = useRef({ level: 0.15, target: 0.15, freq: 1 });
  const readout = useRef<HTMLSpanElement>(null);
  const now = useClock();
  const n = data.links.length;
  const cols = n > 9 ? 2 : 1;

  const draw = useRef<DrawFn>((g, w, h, t) => {
    const e = energy.current;
    e.level += (e.target - e.level) * 0.06;
    const mid = h / 2;
    // faint grid
    g.strokeStyle = `rgba(${MINT},.07)`;
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x < w; x += 22) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); }
    g.moveTo(0, mid + 0.5); g.lineTo(w, mid + 0.5);
    g.stroke();
    for (let k = 2; k >= 0; k--) {
      g.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const u = x / w;
        const env = Math.pow(Math.sin(Math.PI * u), 1.6);
        const f = (0.018 + k * 0.006) * e.freq;
        const y = mid
          + env * h * (0.14 + e.level * 0.3) * Math.sin(x * f + t * (2.2 + k * 0.7) + k * 1.7)
          + env * h * e.level * 0.16 * Math.sin(x * 0.09 - t * 6.5 + k)
          + env * h * 0.05 * Math.sin(x * 0.004 + t * 0.6);
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.strokeStyle = `rgba(${MINT},${[0.95, 0.45, 0.2][k]})`;
      g.lineWidth = k === 0 ? 1.6 : 1;
      g.shadowColor = `rgba(${MINT},.8)`;
      g.shadowBlur = k === 0 ? 10 : 0;
      g.stroke();
      g.shadowBlur = 0;
    }
    // playhead
    const px = ((t * 0.18) % 1) * w;
    g.fillStyle = `rgba(${MINT},.9)`;
    g.fillRect(px, 0, 1, h);
    if (readout.current && Math.floor(t * 8) % 2 === 0) {
      readout.current.textContent = `${(-48 + e.level * 40 + Math.sin(t * 9) * 2).toFixed(1)} dB`;
    }
  });

  const focusRow = (i: number | null) => {
    setHot(i);
    energy.current.target = i === null ? 0.15 : 0.9;
    energy.current.freq = i === null ? 1 : 1 + (i % 4) * 0.25;
    if (i !== null) tick(2400 + (i % 5) * 160, 0.006, 0.025);
  };

  const clock = now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--";

  return (
    <ThemeRoot data={data} mode={mode} label="Signal" badgeTone="light" className="lm-sg bg-[#040a09] text-[#d8fff0]">
      <div aria-hidden className="lm-sg-vignette" />
      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[620px] flex-1 flex-col px-4 pb-2 pt-4 @min-[640px]:px-8 @min-[640px]:pt-7">
        <div className="lm-sg-in flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-[#3cffb4]/70">
          <span className="flex items-center gap-1.5"><i aria-hidden className="lm-sg-live" /> Live</span>
          <span className="tabular" suppressHydrationWarning>CH {String(n).padStart(2, "0")} · {clock}</span>
        </div>

        <header className="lm-sg-in mt-[clamp(10px,3cqh,28px)] flex items-center gap-3.5" style={{ animationDelay: "80ms" }}>
          <span className="lm-sg-frame relative shrink-0 p-1.5">
            <i aria-hidden /><i aria-hidden /><i aria-hidden /><i aria-hidden />
            <Avatar data={data} size={50} className="rounded-[3px]! bg-[#0d2620]! text-[#3cffb4] saturate-[.6]" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[clamp(20px,6cqw,30px)] font-semibold leading-tight tracking-[-0.02em]">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="line-clamp-2 text-[12.5px] leading-snug text-[#d8fff0]/55">{data.bio}</p> : null}
          </div>
        </header>

        <div className="lm-sg-in lm-sg-scope relative mt-[clamp(10px,3cqh,26px)] h-[clamp(56px,15cqh,150px)] shrink-0" style={{ animationDelay: "160ms" }}>
          <LiveCanvas draw={draw} />
          <span ref={readout} aria-hidden className="absolute right-1.5 top-1 font-mono text-[9.5px] tabular text-[#3cffb4]/70">-42.0 dB</span>
          <span aria-hidden className="absolute bottom-1 left-1.5 font-mono text-[9.5px] text-[#3cffb4]/50">{hot !== null ? `TX ${String(hot + 1).padStart(2, "0")}` : "IDLE"}</span>
        </div>

        <nav aria-label="Links" className="relative mt-[clamp(8px,2.5cqh,22px)] flex min-h-0 flex-1 flex-col">
          <span aria-hidden className="lm-sg-scan" />
          <ul className="grid min-h-0 flex-1 gap-x-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridAutoRows: "minmax(0, 64px)" }}
            onPointerLeave={() => focusRow(null)}>
            {data.links.map((l, i) => (
              <li key={l.id} className="lm-sg-row-in min-h-0" style={{ animationDelay: `${220 + i * 45}ms` }}>
                <a href={l.url} {...linkTarget(mode, l.url)}
                  onPointerEnter={(e) => { if (e.pointerType === "mouse") focusRow(i); }}
                  onFocus={() => focusRow(i)} onBlur={() => focusRow(null)}
                  onPointerDown={() => { focusRow(i); buzz(6); }}
                  className={`lm-sg-row group relative flex h-full items-center gap-3 border-t border-[#3cffb4]/15 px-2 outline-none ${hot === i ? "is-hot" : ""}`}>
                  <span aria-hidden className="lm-sg-br" />
                  <span className="w-5 shrink-0 font-mono text-[10.5px] text-[#3cffb4]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="min-w-0 flex-1 truncate text-[clamp(14px,4cqw,17px)] font-medium tracking-[-0.01em]">{l.title}</span>
                  {cols === 1 ? <span className="hidden max-w-[38%] truncate font-mono text-[10px] text-[#d8fff0]/40 @min-[400px]:block">{hostOf(l.url)}</span> : null}
                  <span aria-hidden className="lm-sg-go font-mono text-[12px] text-[#3cffb4]">→</span>
                </a>
              </li>
            ))}
          </ul>
          {n === 0 ? <Empty className="mt-6 text-[#3cffb4]" /> : null}
        </nav>

        <div className="mt-1 flex shrink-0 items-center gap-2 border-t border-[#3cffb4]/15 pt-1">
          <SocialRow socials={data.socials} mode={mode} className="justify-start!" iconClass="size-9! text-[#3cffb4]/80 hover:bg-[#3cffb4]/10" size={18} />
          <div aria-hidden className="lm-sg-ticker min-w-0 flex-1 overflow-hidden font-mono text-[9.5px] uppercase tracking-[0.14em] text-[#3cffb4]/40">
            <span>{[...data.links, ...data.links].map((l) => hostOf(l.url)).join("  ·  ") || "no signal"}</span>
          </div>
        </div>
      </div>
    </ThemeRoot>
  );
}
