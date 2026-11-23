"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick, useParallax } from "../motion";
import type { ThemeProps } from "../types";

const COLS = 3;
const ROWS = "ABCDEFGH";
const WRAPPERS = ["#e2453b", "#f2b632", "#2f6fd6", "#2fa36b", "#9b5de5", "#ff7a3d", "#14b8a6", "#ec4899"];

function Coil({ turning }: { turning: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 100 14" preserveAspectRatio="none" className={`lm-vd-coil mt-1 h-3 w-[92%] ${turning ? "lm-vd-coil-on" : ""}`}>
      {Array.from({ length: 9 }).map((_, i) => (
        <ellipse key={i} cx={6 + i * 11} cy="7" rx="5.5" ry="6" fill="none" stroke="url(#lm-vd-chrome)" strokeWidth="2" />
      ))}
    </svg>
  );
}

export default function Vending({ data, mode }: ThemeProps) {
  const [code, setCode] = useState("");
  const [vended, setVended] = useState<number | null>(null);
  const [dropping, setDropping] = useState<number | null>(null);
  const [pressed, setPressed] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const n = data.links.length;
  const rows = Math.ceil(n / COLS);
  const codeOf = (i: number) => `${ROWS[Math.floor(i / COLS)] ?? "Z"}${(i % COLS) + 1}`;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const vend = (i: number) => {
    if (dropping !== null) return;
    setCode(codeOf(i));
    setDropping(i);
    setVended(null);
    tick(160, 0.4, 0.035); // motor hum
    buzz(30);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    later(() => { tick(120, 0.08, 0.09); buzz([20, 40, 20]); }, reduce ? 0 : 1050);
    later(() => { setDropping(null); setVended(i); setCode(""); }, reduce ? 0 : 1100);
  };

  const press = (k: string) => {
    setPressed(k);
    later(() => setPressed(null), 130);
    tick(1500, 0.015, 0.04);
    const next = (code.length >= 2 || code === "ERR" ? "" : code) + k;
    setCode(next);
    if (next.length === 2) {
      const r = ROWS.indexOf(next[0]);
      const c = Number(next[1]) - 1;
      const i = r * COLS + c;
      if (r >= 0 && c >= 0 && c < COLS && i < n) vend(i);
      else later(() => setCode("ERR"), 120);
    }
  };

  const current = vended !== null ? data.links[vended] : null;
  const usedRows = ROWS.slice(0, Math.max(1, rows)).split("");
  const name = data.displayName || `@${data.username}`;

  return (
    <ThemeRoot data={data} mode={mode} label="Vending Machine" badgeTone="light" className="lm-vd-bg relative overflow-hidden text-white">
      <svg width="0" height="0" aria-hidden className="absolute"><defs><linearGradient id="lm-vd-chrome" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f4f7fa" /><stop offset=".5" stopColor="#8a96a3" /><stop offset="1" stopColor="#dfe5ea" /></linearGradient></defs></svg>
      <div ref={stage} className="relative mx-auto flex w-full max-w-[460px] flex-1 flex-col px-3 pt-6">
        <div className="lm-vend lm-vd-in relative rounded-[20px] p-3">
          {/* lit sign */}
          <div className="lm-vd-sign relative flex items-center gap-2.5 overflow-hidden rounded-[10px] px-3 py-2">
            <Avatar data={data} size={38} className="border-2 border-white/70 bg-[#ffe066]! text-[#7a1a12]" />
            <div className="min-w-0">
              <h1 className="lm-vd-neon truncate text-[17px] font-black uppercase tracking-[.06em]">{name}</h1>
              {data.bio ? <p className="truncate text-[11px] font-medium text-white/85">{data.bio}</p> : null}
            </div>
          </div>

          <div className="lm-vend-glass relative mt-3 overflow-hidden rounded-[10px] p-2 pt-3">
            <span aria-hidden className="lm-vd-tube" />
            <span aria-hidden className="lm-vd-reflect" />
            <ul className="relative grid grid-cols-3 gap-x-2 gap-y-3" aria-label="Snacks. Each is a link.">
              {data.links.map((l, i) => {
                const color = WRAPPERS[hash(l.id) % WRAPPERS.length];
                const gone = vended === i;
                return (
                  <li key={l.id} className="flex flex-col items-center">
                    <button type="button" onClick={() => vend(i)} aria-label={`${codeOf(i)}: ${l.title}`}
                      className={`lm-snack relative flex h-[78px] w-full flex-col items-center justify-center overflow-hidden rounded-[6px] px-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#ffe066] ${dropping === i ? "lm-drop-anim" : ""} ${gone ? "opacity-0" : ""}`}
                      style={{ ["--wrap" as string]: color } as CSSProperties}>
                      <span aria-hidden className="lm-vd-crinkle" />
                      <span className="relative line-clamp-3 text-[11px] font-black uppercase leading-tight tracking-tight">{l.title}</span>
                    </button>
                    <Coil turning={dropping === i} />
                    <span className="mt-1 rounded-[3px] bg-black/70 px-1.5 font-mono text-[10px] font-bold text-[#ffe066] shadow-[0_0_6px_rgba(255,224,102,.35)]">{codeOf(i)}</span>
                  </li>
                );
              })}
            </ul>
            {n === 0 ? <p className="py-10 text-center text-sm text-white/60">Sold out. No links yet.</p> : null}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <div className="flex flex-col gap-2">
              <div className="lm-led flex items-center justify-between rounded-[6px] px-3 py-2 font-mono text-lg tracking-[.3em] text-[#ff5e3a]" aria-live="polite">
                <span>{code || (current ? "ENJOY" : dropping !== null ? "...." : "INSERT")}</span>
                <span aria-hidden className={`lm-vd-coin ${!code && !current && dropping === null ? "lm-vd-blink" : ""}`} />
              </div>
              <div className="lm-tray relative flex min-h-[70px] items-center justify-center overflow-hidden rounded-[6px] p-2">
                <span aria-hidden className={`lm-vd-flap ${current ? "lm-vd-flap-open" : ""}`} />
                {current ? (
                  <a key={vended} href={current.url} {...linkTarget(mode, current.url)}
                    className="lm-vd-land relative flex w-full items-center justify-between gap-2 rounded-[6px] bg-[#ffe066] px-3 py-2 text-sm font-bold text-[#1b1b1b] shadow-[0_4px_10px_rgba(0,0,0,.5)] transition-transform active:scale-95">
                    <span className="min-w-0 truncate">{current.title}<span className="block truncate text-[10px] font-medium opacity-70">{hostOf(current.url)}</span></span>
                    <span className="shrink-0">Take it →</span>
                  </a>
                ) : <span className="relative text-[11px] font-bold uppercase tracking-widest text-white/40">Push</span>}
              </div>
            </div>
            <div className="lm-vd-pad grid grid-cols-3 gap-1.5 rounded-[8px] p-1.5" role="group" aria-label="Keypad">
              {[...usedRows.slice(0, 6), "1", "2", "3"].map((k) => (
                <button key={k} type="button" onClick={() => press(k)}
                  className={`lm-key grid size-9 place-items-center rounded-[6px] font-mono text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#ffe066] ${pressed === k ? "lm-key-down" : ""}`}>{k}</button>
              ))}
            </div>
          </div>
          <div aria-hidden className="mt-3 flex justify-between px-2"><span className="lm-vd-foot" /><span className="lm-vd-foot" /></div>
        </div>
        <SocialRow socials={data.socials} mode={mode} className="mb-16 mt-5" iconClass="text-white/90 hover:bg-white/10" />
      </div>
    </ThemeRoot>
  );
}
