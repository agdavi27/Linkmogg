"use client";

import { useState } from "react";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

const COLS = 3;
const ROWS = "ABCDEFGH";
const WRAPPERS = ["#e2453b", "#f2b632", "#2f6fd6", "#2fa36b", "#9b5de5", "#ff7a3d", "#14b8a6", "#ec4899"];

export default function Vending({ data, mode }: ThemeProps) {
  const [code, setCode] = useState("");
  const [vended, setVended] = useState<number | null>(null);
  const [dropping, setDropping] = useState<number | null>(null);
  const n = data.links.length;
  const rows = Math.ceil(n / COLS);
  const codeOf = (i: number) => `${ROWS[Math.floor(i / COLS)] ?? "Z"}${(i % COLS) + 1}`;

  const vend = (i: number) => {
    setCode(codeOf(i));
    setDropping(i);
    setVended(null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setTimeout(() => { setDropping(null); setVended(i); setCode(""); }, reduce ? 0 : 650);
  };

  const press = (k: string) => {
    const next = (code.length >= 2 ? "" : code) + k;
    setCode(next);
    if (next.length === 2) {
      const r = ROWS.indexOf(next[0]);
      const c = Number(next[1]) - 1;
      const i = r * COLS + c;
      if (r >= 0 && c >= 0 && c < COLS && i < n) vend(i);
      else setTimeout(() => setCode("ERR"), 120);
    }
  };

  const current = vended !== null ? data.links[vended] : null;
  const usedRows = ROWS.slice(0, Math.max(1, rows)).split("");

  return (
    <ThemeRoot data={data} mode={mode} label="Vending Machine" badgeTone="light"
      className="bg-[#14202b] bg-[radial-gradient(80%_50%_at_50%_0%,#24384a_0%,#14202b_70%)] text-white">
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-3 pt-6">
        <div className="lm-vend rounded-[18px] p-3">
          <div className="flex items-center gap-2 rounded-lg bg-[#0e1720] px-3 py-2">
            <Avatar data={data} size={36} />
            <div className="min-w-0">
              <h1 className="truncate text-sm font-extrabold tracking-wide">{data.displayName || `@${data.username}`}</h1>
              {data.bio ? <p className="truncate text-[11px] text-white/60">{data.bio}</p> : null}
            </div>
          </div>

          <div className="lm-vend-glass mt-3 rounded-lg p-2">
            <ul className="grid grid-cols-3 gap-x-2 gap-y-3" aria-label="Snacks. Each is a link.">
              {data.links.map((l, i) => {
                const color = WRAPPERS[hash(l.id) % WRAPPERS.length];
                const hidden = vended === i;
                return (
                  <li key={l.id} className="flex flex-col items-center">
                    <button type="button" onClick={() => vend(i)} aria-label={`${codeOf(i)}: ${l.title}`}
                      className={`lm-snack relative flex h-[74px] w-full flex-col items-center justify-center overflow-hidden rounded-md px-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#ffe066] ${dropping === i ? "lm-drop-anim" : ""} ${hidden ? "opacity-0" : ""}`}
                      style={{ ["--wrap" as string]: color }}>
                      <span className="relative line-clamp-3 text-[11px] font-black uppercase leading-tight tracking-tight">{l.title}</span>
                    </button>
                    <span aria-hidden className="lm-coil mt-1 h-2 w-[88%]" />
                    <span className="mt-0.5 rounded bg-black/60 px-1.5 font-mono text-[10px] text-[#ffe066]">{codeOf(i)}</span>
                  </li>
                );
              })}
            </ul>
            {n === 0 ? <p className="py-10 text-center text-sm text-white/60">Sold out. No links yet.</p> : null}
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <div className="flex flex-col gap-2">
              <div className="lm-led rounded-md px-3 py-2 font-mono text-lg tracking-[.3em] text-[#ff5e3a]" aria-live="polite">
                {code || (current ? "ENJOY" : "INSERT")}
              </div>
              <div className="lm-tray flex min-h-[64px] items-center justify-center rounded-md p-2">
                {current ? (
                  <a href={current.url} {...linkTarget(mode, current.url)}
                    className="lm-pop flex w-full items-center justify-between gap-2 rounded-md bg-[#ffe066] px-3 py-2 text-sm font-bold text-[#1b1b1b] transition-transform active:scale-95">
                    <span className="min-w-0 truncate">{current.title}<span className="block truncate text-[10px] font-medium opacity-70">{hostOf(current.url)}</span></span>
                    <span className="shrink-0">Take it →</span>
                  </a>
                ) : <span className="text-[11px] uppercase tracking-widest text-white/40">Push</span>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Keypad">
              {[...usedRows.slice(0, 6), "1", "2", "3"].map((k) => (
                <button key={k} type="button" onClick={() => press(k)}
                  className="lm-key grid size-9 place-items-center rounded-md font-mono text-sm font-bold active:translate-y-px">{k}</button>
              ))}
            </div>
          </div>
        </div>
        <SocialRow socials={data.socials} mode={mode} className="my-5" iconClass="text-white/90 hover:bg-white/10" />
      </div>
    </ThemeRoot>
  );
}
