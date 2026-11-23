"use client";

import { useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick } from "../motion";
import { photoOf } from "../art";
import { photoUrl } from "../photos";
import type { ThemeProps } from "../types";

const PINS = ["#e2453b", "#2f6fd6", "#f2b632", "#2fa36b", "#f2f2f2"];

type Offset = { x: number; y: number };

export default function Corkboard({ data, mode }: ThemeProps) {
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});
  const [lifted, setLifted] = useState<string | null>(null);
  const n = data.links.length;
  const cols = n <= 6 ? 2 : n <= 12 ? 3 : 4;
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppress = useRef(false);

  return (
    <ThemeRoot data={data} mode={mode} label="Corkboard" badgeTone="light" className="lm-cork relative overflow-hidden text-[#2a1f14]">
      <div className="relative mx-auto flex min-h-0 w-full max-w-[640px] flex-1 flex-col px-4 pt-[clamp(22px,5cqh,48px)]">
        <div className="lm-note lm-ck-in relative mx-auto flex w-[min(90%,420px)] shrink-0 -rotate-1 items-center gap-3 p-[clamp(10px,2cqh,16px)]">
          <span aria-hidden className="lm-ck-tape absolute -top-3 left-1/2 h-6 w-24 -translate-x-1/2 rotate-2" />
          <Avatar data={data} size={58} className="border-2 border-white bg-[#f3e3a0]! shadow-[0_2px_4px_rgba(0,0,0,.25)]" />
          <div className="min-w-0">
            <h1 className="font-hand truncate text-3xl leading-none">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="font-hand mt-1 line-clamp-2 text-lg leading-tight text-[#4a3b28]">{data.bio}</p> : null}
          </div>
        </div>

        <ul className="mt-[clamp(14px,3.5cqh,32px)] grid min-h-0 flex-1 gap-x-3 gap-y-[clamp(10px,2.5cqh,22px)]" aria-label="Links"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridAutoRows: "minmax(0, 1fr)" }}>
          {data.links.map((l, i) => {
            const h = hash(l.id + l.url);
            const rot = ((h % 9) - 4) * 1.3;
            const p = detectPlatform(l.url)?.platform ?? "website";
            const o = offsets[l.id] ?? { x: 0, y: 0 };
            const up = lifted === l.id;
            return (
              <li key={l.id} className="flex min-h-0 justify-center" style={{ zIndex: up ? 20 : 1 }}>
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
                  className={`lm-polaroid lm-ck-drop group relative flex aspect-[0.8] h-full max-h-[300px] max-w-full flex-col bg-[#fdfbf6] p-[6%] pb-[4%] outline-none focus-visible:ring-2 focus-visible:ring-[#2f6fd6] ${up ? "lm-ck-lifted" : ""}`}
                  style={{ ["--rot" as string]: `${rot}deg`, translate: `${o.x}px ${o.y}px`, animationDelay: `${200 + i * 110}ms` } as CSSProperties}>
                  <span aria-hidden className="lm-pin absolute -top-2 left-1/2 z-10 size-4 -translate-x-1/2 rounded-full" style={{ background: PINS[(h >> 3) % PINS.length] }} />
                  <span className="lm-ck-photo relative block min-h-0 flex-1 overflow-hidden bg-[#2a2520]" style={{ animationDelay: `${500 + i * 160}ms` }}>
                    <Image src={photoUrl(photoOf(l))} alt="" fill sizes="(max-width: 640px) 45vw, 220px" draggable={false} className="object-cover" />
                    <span aria-hidden className="lm-ck-glare" />
                    <span aria-hidden className="absolute bottom-1.5 right-1.5 grid size-7 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm">
                      {p !== "website" && p !== "email"
                        ? <SocialIcon platform={p} size={14} color="#fff" />
                        : <span className="text-[12px] font-bold leading-none">{l.title.trim()[0]?.toUpperCase()}</span>}
                    </span>
                  </span>
                  <span className="font-hand mt-1.5 block shrink-0 truncate text-center text-[clamp(15px,4.4cqw,21px)] leading-tight">{l.title}</span>
                  {n <= 9 ? <span className="block shrink-0 truncate text-center text-[10px] text-[#8a7a62]">{hostOf(l.url)}</span> : null}
                </a>
              </li>
            );
          })}
        </ul>
        {data.links.length === 0 ? <p className="font-hand mt-8 text-center text-2xl text-[#fdf6e6]">Nothing pinned yet.</p> : null}
        <div className="flex shrink-0 items-center justify-center gap-3 pb-1 pt-[clamp(8px,2cqh,18px)]">
        <SocialRow socials={data.socials} mode={mode} className="flex-nowrap! rounded-full bg-[#fdfbf6]/90 px-1 py-0.5 shadow-md" iconClass="size-9! text-[#2a1f14] hover:bg-black/5" size={19} />
        </div>
      </div>
    </ThemeRoot>
  );
}
