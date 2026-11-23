"use client";

import { useMemo, useState } from "react";
import { Avatar, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

const MIN = 88;
const MAX = 108;
const LOCK = 0.55;

export default function Radio({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const stations = useMemo(
    () => data.links.map((l, i) => ({ link: l, f: n === 1 ? 98 : MIN + 1.5 + (i * (MAX - MIN - 3)) / Math.max(1, n - 1) })),
    [data.links, n],
  );
  const [freq, setFreq] = useState(stations[0]?.f ?? 98);
  const locked = stations.reduce<{ s: (typeof stations)[number]; d: number } | null>((best, s) => {
    const d = Math.abs(s.f - freq);
    return d <= LOCK && (!best || d < best.d) ? { s, d } : best;
  }, null)?.s;
  const pct = ((freq - MIN) / (MAX - MIN)) * 100;

  const seek = (dir: 1 | -1) => {
    if (!stations.length) return;
    const sorted = dir > 0 ? stations : [...stations].reverse();
    const next = sorted.find((s) => (dir > 0 ? s.f > freq + 0.05 : s.f < freq - 0.05)) ?? sorted[0];
    setFreq(next.f);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Radio Dial" badgeTone="light"
      className="bg-[#2b1e16] bg-[radial-gradient(90%_60%_at_50%_0%,#4a3324_0%,#21160f_75%)] text-[#f7ead2]">
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 pt-8">
        <div className="flex items-center gap-3">
          <Avatar data={data} size={56} className="border-2 border-[#e8b86b]/50" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-[-0.01em]">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="line-clamp-2 text-sm text-[#dcc7a4]">{data.bio}</p> : null}
          </div>
        </div>

        <div className="lm-radio mt-6 rounded-[22px] p-4">
          <div aria-hidden className="lm-grille h-24 rounded-xl" />
          <div className="lm-dial relative mt-4 h-[74px] overflow-hidden rounded-lg">
            <div aria-hidden className="absolute inset-x-3 top-2 flex justify-between font-mono text-[10px] text-[#5a3d18]">
              {[88, 92, 96, 100, 104, 108].map((m) => <span key={m}>{m}</span>)}
            </div>
            <div aria-hidden className="lm-ticks absolute inset-x-3 top-6 h-3" />
            {stations.map((s) => (
              <span key={s.link.id} aria-hidden className={`absolute top-[38px] size-2 -translate-x-1/2 rounded-full ${locked === s ? "bg-[#ff6a2b] shadow-[0_0_8px_#ff6a2b]" : "bg-[#5a3d18]/60"}`}
                style={{ left: `calc(12px + (100% - 24px) * ${(s.f - MIN) / (MAX - MIN)})` }} />
            ))}
            <span aria-hidden className="lm-needle absolute bottom-1 top-1 w-[3px] -translate-x-1/2 rounded-full"
              style={{ left: `calc(12px + (100% - 24px) * ${pct / 100})` }} />
            <p className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[11px] font-bold text-[#5a3d18]">{freq.toFixed(1)} FM</p>
          </div>

          <div className={`lm-display mt-3 flex min-h-[64px] items-center gap-3 rounded-md px-3 py-2 ${locked ? "lm-display-on" : "lm-static"}`} aria-live="polite">
            {locked ? (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-base font-bold">{locked.link.title}</p>
                  <p className="truncate font-mono text-[11px] opacity-70">{hostOf(locked.link.url)}</p>
                </div>
                <a href={locked.link.url} {...linkTarget(mode, locked.link.url)}
                  className="shrink-0 rounded-full bg-[#ff6a2b] px-4 py-1.5 text-sm font-bold text-[#21160f] transition-transform active:scale-95">Tune in</a>
              </>
            ) : <p className="w-full text-center font-mono text-sm opacity-70">{n ? "~ static ~ keep tuning" : "No stations yet"}</p>}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => seek(-1)} aria-label="Seek to previous station" className="lm-radio-btn rounded-md px-3 py-2 font-mono text-xs font-bold">◂◂</button>
            <label className="relative flex-1">
              <span className="sr-only">Tuning dial</span>
              <input type="range" min={MIN} max={MAX} step={0.1} value={freq}
                onChange={(e) => setFreq(Number(e.target.value))}
                aria-valuetext={locked ? `${freq.toFixed(1)} FM, ${locked.link.title}` : `${freq.toFixed(1)} FM, static`}
                className="lm-tuner w-full" />
            </label>
            <button type="button" onClick={() => seek(1)} aria-label="Seek to next station" className="lm-radio-btn rounded-md px-3 py-2 font-mono text-xs font-bold">▸▸</button>
            <span aria-hidden className="lm-knob-big size-12 rounded-full" style={{ rotate: `${pct * 3.2}deg` }} />
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[#cbb48e]">Drag the dial or seek between stations</p>
        <SocialRow socials={data.socials} mode={mode} className="my-5" iconClass="text-[#f7ead2] hover:bg-white/10" />
      </div>
    </ThemeRoot>
  );
}
