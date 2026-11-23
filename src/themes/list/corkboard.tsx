"use client";

import { useRef, useState, type CSSProperties } from "react";
import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick } from "../motion";
import type { ThemeProps } from "../types";

const PHOTO = [
  ["#f6a57a", "#e2573b"], ["#8fd3c1", "#2f7f6f"], ["#f9dc7a", "#e09b2d"],
  ["#a9c4f5", "#3e64b8"], ["#f3b4c8", "#c2457a"], ["#c9e59a", "#5e8c2a"],
];
const PINS = ["#e2453b", "#2f6fd6", "#f2b632", "#2fa36b", "#f2f2f2"];
const BULBS = ["#ffd36e", "#ff8a8a", "#8fe3ff", "#b8ff9a", "#ffd36e", "#ffb0ec"];

type Offset = { x: number; y: number };

export default function Corkboard({ data, mode }: ThemeProps) {
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});
  const [lifted, setLifted] = useState<string | null>(null);
  const [toss, setToss] = useState(0);
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppress = useRef(false);

  const shuffle = () => {
    const next: Record<string, Offset> = {};
    data.links.forEach((l, i) => {
      const h = hash(l.id + toss + i);
      next[l.id] = { x: ((h % 41) - 20), y: (((h >> 6) % 31) - 15) };
    });
    setOffsets(next);
    setToss((t) => t + 1);
    tick(500, 0.05, 0.04);
    buzz(10);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Corkboard" badgeTone="light" className="lm-cork relative overflow-hidden text-[#2a1f14]">
      <div aria-hidden className="lm-ck-lights">
        <svg className="absolute inset-x-0 top-0 h-16 w-full" viewBox="0 0 400 60" preserveAspectRatio="none"><path d="M0 8 Q 100 52 200 14 T 400 10" fill="none" stroke="#2a2018" strokeWidth="1.5" /></svg>
        {BULBS.concat(BULBS).map((c, i) => {
          const x = (i + 0.5) / 12;
          const y = 8 + Math.sin(x * Math.PI * 2.2) * -10 + (x < 0.5 ? x * 36 : (1 - x) * 26);
          return <span key={i} className="lm-ck-bulb" style={{ left: `${x * 100}%`, top: y, ["--c" as string]: c, animationDelay: `${-i * 0.37}s` } as CSSProperties} />;
        })}
      </div>

      <div className="relative mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-14">
        <div className="lm-note lm-ck-in relative mx-auto flex w-[90%] -rotate-1 items-center gap-3 p-4">
          <span aria-hidden className="lm-ck-tape absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2" />
          <Avatar data={data} size={58} className="border-2 border-white bg-[#f3e3a0]! shadow-[0_2px_4px_rgba(0,0,0,.25)]" />
          <div className="min-w-0">
            <h1 className="font-hand truncate text-3xl leading-none">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="font-hand mt-1 line-clamp-3 text-lg leading-tight text-[#4a3b28]">{data.bio}</p> : null}
          </div>
        </div>

        <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7" aria-label="Links">
          {data.links.map((l, i) => {
            const h = hash(l.id + l.url);
            const rot = ((h % 9) - 4) * 1.3;
            const p = detectPlatform(l.url)?.platform ?? "website";
            const [c1, c2] = PHOTO[h % PHOTO.length];
            const o = offsets[l.id] ?? { x: 0, y: 0 };
            const up = lifted === l.id;
            return (
              <li key={l.id} className="flex justify-center" style={{ zIndex: up ? 20 : 1 }}>
                <a href={l.url} {...linkTarget(mode, l.url)}
                  onPointerDown={(e) => {
                    if (e.pointerType !== "mouse" || e.button !== 0) return;
                    drag.current = { id: l.id, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y, moved: false };
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d || d.id !== l.id) return;
                    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
                    if (!d.moved && Math.hypot(dx, dy) < 5) return;
                    if (!d.moved) { d.moved = true; setLifted(l.id); tick(900, 0.02, 0.03); }
                    setOffsets((s) => ({ ...s, [l.id]: { x: d.ox + dx, y: d.oy + dy } }));
                  }}
                  onPointerUp={() => {
                    if (drag.current?.moved) { suppress.current = true; tick(420, 0.04, 0.05); buzz(8); }
                    drag.current = null;
                    setLifted(null);
                  }}
                  onClick={(e) => { if (suppress.current) { e.preventDefault(); suppress.current = false; } }}
                  onDragStart={(e) => e.preventDefault()}
                  className={`lm-polaroid lm-ck-drop group relative block w-full max-w-[190px] bg-[#fdfbf6] p-2.5 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fd6] ${up ? "lm-ck-lifted" : ""}`}
                  style={{ ["--rot" as string]: `${rot}deg`, translate: `${o.x}px ${o.y}px`, animationDelay: `${200 + i * 110}ms` } as CSSProperties}>
                  <span aria-hidden className="lm-pin absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full" style={{ background: PINS[(h >> 3) % PINS.length] }} />
                  <span className="lm-ck-photo relative grid aspect-square place-items-center overflow-hidden text-white"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})`, animationDelay: `${500 + i * 160}ms` }}>
                    <span aria-hidden className="lm-ck-glare" />
                    {p !== "website" && p !== "email"
                      ? <SocialIcon platform={p} size={44} color="#fff" className="relative opacity-95 drop-shadow-[0_2px_3px_rgba(0,0,0,.25)]" />
                      : <span className="relative font-display text-5xl font-bold opacity-95">{l.title.trim()[0]?.toUpperCase()}</span>}
                  </span>
                  <span className="font-hand mt-2 block truncate text-center text-xl leading-tight">{l.title}</span>
                  <span className="block truncate text-center text-[10px] text-[#8a7a62]">{hostOf(l.url)}</span>
                </a>
              </li>
            );
          })}
        </ul>
        {data.links.length === 0 ? <p className="font-hand mt-8 text-center text-2xl text-[#fdf6e6]">Nothing pinned yet.</p> : null}
        {data.links.length > 1 ? (
          <button type="button" onClick={shuffle} className="font-hand mx-auto mt-6 -rotate-2 rounded-[3px] bg-[#fdfbf6] px-4 py-1.5 text-xl shadow-[0_6px_12px_-6px_rgba(0,0,0,.6)] transition-transform duration-150 hover:rotate-0 active:scale-95">
            shuffle the board
          </button>
        ) : null}
        <SocialRow socials={data.socials} mode={mode} className="mx-auto mb-16 mt-5 rounded-full bg-[#fdfbf6]/90 px-2 py-1 shadow-md" iconClass="text-[#2a1f14] hover:bg-black/5" />
      </div>
    </ThemeRoot>
  );
}
