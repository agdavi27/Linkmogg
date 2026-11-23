"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Avatar, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { buzz, tick } from "../motion";
import type { ThemeProps } from "../types";

const MIN = 88;
const MAX = 108;
const LOCK = 0.55;

/** Soft radio static while the visitor is tuning. Quiet, and only after they touch the dial. */
function useStatic() {
  const ref = useRef<{ ctx: AudioContext; gain: GainNode } | null>(null);
  const stopT = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { ref.current?.ctx.close().catch(() => {}); }, []);
  return (level: number) => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
      if (!ref.current) {
        const ctx = new AudioContext();
        const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buf; src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass"; filter.frequency.value = 2400; filter.Q.value = 0.6;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start();
        ref.current = { ctx, gain };
      }
      const { ctx, gain } = ref.current;
      if (ctx.state === "suspended") void ctx.resume();
      gain.gain.setTargetAtTime(level * 0.035, ctx.currentTime, 0.04);
      if (stopT.current) clearTimeout(stopT.current);
      stopT.current = setTimeout(() => gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15), 450);
    } catch { /* no audio */ }
  };
}

export default function Radio({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const stations = useMemo(
    () => data.links.map((l, i) => ({ link: l, f: n === 1 ? 98 : MIN + 1.5 + (i * (MAX - MIN - 3)) / Math.max(1, n - 1) })),
    [data.links, n],
  );
  const [freq, setFreq] = useState(stations[0]?.f ?? 98);
  const anim = useRef(0);
  const knob = useRef<HTMLDivElement>(null);
  const turn = useRef<{ a: number } | null>(null);
  const noise = useStatic();
  const wasLocked = useRef<string | null>(stations[0]?.link.id ?? null);

  const nearest = stations.reduce<{ s: (typeof stations)[number]; d: number } | null>((best, s) => {
    const d = Math.abs(s.f - freq);
    return !best || d < best.d ? { s, d } : best;
  }, null);
  const locked = nearest && nearest.d <= LOCK ? nearest.s : undefined;
  const signal = nearest ? Math.max(0, 1 - nearest.d / 1.6) : 0; // 0..1 for the tuning eye
  const pct = ((freq - MIN) / (MAX - MIN)) * 100;

  useEffect(() => {
    const id = locked?.link.id ?? null;
    if (id && id !== wasLocked.current) { tick(880, 0.09, 0.03); buzz(10); }
    wasLocked.current = id;
  }, [locked]);
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const tune = (f: number) => {
    const v = Math.max(MIN, Math.min(MAX, f));
    setFreq(v);
    const nd = stations.reduce((m, s) => Math.min(m, Math.abs(s.f - v)), 9);
    noise(nd <= LOCK ? 0.1 : Math.min(1, nd / 1.2));
  };

  const glide = (to: number) => {
    cancelAnimationFrame(anim.current);
    const from = freq;
    const t0 = performance.now();
    const dur = 650;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      tune(from + (to - from) * e);
      if (t < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };

  const seek = (dir: 1 | -1) => {
    if (!stations.length) return;
    const sorted = dir > 0 ? stations : [...stations].reverse();
    const next = sorted.find((s) => (dir > 0 ? s.f > freq + 0.05 : s.f < freq - 0.05)) ?? sorted[0];
    glide(next.f);
  };

  const angleAt = (e: React.PointerEvent) => {
    const r = knob.current!.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Radio Dial" badgeTone="light" className="lm-rd-room relative overflow-hidden text-[#f7ead2]">
      <div className="relative mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 pt-8">
        <div className="lm-pop flex items-center gap-3">
          <Avatar data={data} size={56} className="border-2 border-[#e8b86b]/60 bg-[#4a3324]! text-[#f7ead2]" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-semibold tracking-[-0.01em]">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="line-clamp-2 text-sm text-[#dcc7a4]">{data.bio}</p> : null}
          </div>
        </div>

        <div className="lm-radio relative mt-6 rounded-[26px_26px_18px_18px] p-4">
          <div aria-hidden className="lm-rd-arch" />
          <div aria-hidden className="relative grid h-28 grid-cols-[1fr_auto] gap-3">
            <div className="lm-grille relative overflow-hidden rounded-xl">
              <span className={`lm-rd-cone ${locked ? "lm-rd-cone-on" : ""}`} />
              <span className="lm-rd-cloth" />
            </div>
            <div className="lm-rd-eye grid size-[70px] place-items-center self-center rounded-full">
              <span className="lm-rd-eye-fan" style={{ ["--open" as string]: `${(1 - signal) * 150 + 8}deg` } as CSSProperties} />
              <span className="absolute size-5 rounded-full bg-[#0b1a0e] shadow-[0_0_0_2px_#1c2b1e]" />
            </div>
          </div>

          <div className="lm-dial relative mt-4 h-[78px] overflow-hidden rounded-lg">
            <div aria-hidden className="absolute inset-x-3 top-2 flex justify-between font-mono text-[10px] font-bold text-[#5a3d18]">
              {[88, 92, 96, 100, 104, 108].map((m) => <span key={m}>{m}</span>)}
            </div>
            <div aria-hidden className="lm-ticks absolute inset-x-3 top-6 h-3" />
            {stations.map((s) => (
              <span key={s.link.id} aria-hidden className={`absolute top-[40px] size-2 -translate-x-1/2 rounded-full transition-[background-color,box-shadow] duration-200 ${locked === s ? "bg-[#ff6a2b] shadow-[0_0_10px_#ff6a2b]" : "bg-[#5a3d18]/60"}`}
                style={{ left: `calc(12px + (100% - 24px) * ${(s.f - MIN) / (MAX - MIN)})` }} />
            ))}
            <span aria-hidden className="lm-needle absolute bottom-1 top-1 w-[3px] -translate-x-1/2 rounded-full"
              style={{ left: `calc(12px + (100% - 24px) * ${pct / 100})` }} />
            <p className="absolute inset-x-0 bottom-1.5 text-center font-mono text-[11px] font-bold text-[#5a3d18] tabular-nums">{freq.toFixed(1)} FM</p>
          </div>

          <div className={`lm-display mt-3 flex min-h-[64px] items-center gap-3 overflow-hidden rounded-md px-3 py-2 ${locked ? "lm-display-on" : "lm-static"}`} aria-live="polite">
            {locked ? (
              <>
                <div key={locked.link.id} className="lm-pop min-w-0 flex-1">
                  <p className="truncate font-mono text-base font-bold">{locked.link.title}</p>
                  <p className="truncate font-mono text-[11px] opacity-70">{hostOf(locked.link.url)}</p>
                </div>
                <a href={locked.link.url} {...linkTarget(mode, locked.link.url)}
                  className="shrink-0 rounded-full bg-[#ff6a2b] px-4 py-1.5 text-sm font-bold text-[#21160f] shadow-[0_0_14px_rgba(255,106,43,.55)] transition-transform active:scale-95">Tune in</a>
              </>
            ) : <p className="w-full text-center font-mono text-sm opacity-70">{n ? "~ static ~ keep tuning" : "No stations yet"}</p>}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button type="button" onClick={() => seek(-1)} aria-label="Seek to previous station" className="lm-radio-btn rounded-md px-3 py-2 font-mono text-xs font-bold">◂◂</button>
            <label className="relative flex-1">
              <span className="sr-only">Tuning dial</span>
              <input type="range" min={MIN} max={MAX} step={0.1} value={freq}
                onChange={(e) => { cancelAnimationFrame(anim.current); tune(Number(e.target.value)); }}
                aria-valuetext={locked ? `${freq.toFixed(1)} FM, ${locked.link.title}` : `${freq.toFixed(1)} FM, static`}
                className="lm-tuner w-full" />
            </label>
            <button type="button" onClick={() => seek(1)} aria-label="Seek to next station" className="lm-radio-btn rounded-md px-3 py-2 font-mono text-xs font-bold">▸▸</button>
            <div ref={knob} aria-hidden title="Turn me"
              className="lm-knob-big size-14 shrink-0 touch-none rounded-full"
              style={{ rotate: `${pct * 5.4}deg` }}
              onPointerDown={(e) => { cancelAnimationFrame(anim.current); turn.current = { a: angleAt(e) }; e.currentTarget.setPointerCapture(e.pointerId); }}
              onPointerMove={(e) => {
                if (!turn.current) return;
                const a = angleAt(e);
                let d = a - turn.current.a;
                if (d > 180) d -= 360;
                if (d < -180) d += 360;
                turn.current.a = a;
                tune(freq + d / 27);
              }}
              onPointerUp={() => { turn.current = null; }}
              onPointerCancel={() => { turn.current = null; }} />
          </div>
        </div>
        <div aria-hidden className="mx-auto flex w-[80%] justify-between"><span className="lm-rd-foot" /><span className="lm-rd-foot" /></div>
        <p className="mt-3 text-center text-xs text-[#cbb48e]">Turn the knob, drag the dial, or seek between stations</p>
        <SocialRow socials={data.socials} mode={mode} className="mb-16 mt-4" iconClass="text-[#f7ead2] hover:bg-white/10" />
      </div>
    </ThemeRoot>
  );
}
