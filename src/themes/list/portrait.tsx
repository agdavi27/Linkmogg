"use client";

import { useRef, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { Empty, ThemeRoot, hash, initials, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, useParallax } from "../motion";
import type { ThemeProps } from "../types";

/** Scatter links over a loose grid inside an oval, jittered per link so it feels hand placed. */
function spots(n: number) {
  const cols = n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
  const rows = Math.max(1, Math.ceil(n / cols));
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = r === rows - 1 ? n - r * cols : cols;
    const k = hash(`p${i}`);
    const jx = ((k % 100) / 100 - 0.5) * 0.5, jy = (((k >> 8) % 100) / 100 - 0.5) * 0.45;
    const x = 6 + ((c + 0.5 + jx + (cols - inRow) / 2) / cols) * 88;
    const y = 9 + ((r + 0.5 + jy) / rows) * 78;
    return { x, y, depth: 0.4 + ((k >> 16) % 60) / 100, delay: -((k >> 4) % 70) / 10 };
  });
}

export default function Portrait({ data, mode }: ThemeProps) {
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const n = data.links.length;
  const pts = spots(n);
  const name = data.displayName || data.username;

  return (
    <ThemeRoot data={data} mode={mode} label="Portrait" className="lm-pt bg-[#f2f2f1] text-[#111]">
      <div ref={stage} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* The visitor's own photo, huge and soft, behind everything. */}
        <div aria-hidden className="lm-pt-photo">
          {data.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={data.avatarUrl} alt="" className="size-full object-cover" />
            : <span className="grid size-full place-items-center bg-[radial-gradient(circle_at_40%_35%,#cfcfd6,#8d8f99_60%,#5d5f68)] font-display text-[40cqmin] font-bold text-white/70">{initials(name)}</span>}
        </div>
        <div aria-hidden className="lm-pt-veil" />

        <header className="lm-pt-in relative z-10 flex shrink-0 items-start justify-between gap-3 px-5 pt-[clamp(14px,3.5cqh,32px)]">
          <div className="min-w-0">
            <h1 className="text-[clamp(18px,5cqw,26px)] font-semibold uppercase tracking-[0.06em] text-[#111]">{name}</h1>
            {data.bio ? <p className="mt-1 line-clamp-2 max-w-[40ch] text-[12.5px] leading-snug text-[#111]/65">{data.bio}</p> : null}
          </div>
        </header>

        <ul className="relative z-10 mx-[6%] my-[clamp(10px,3cqh,30px)] min-h-0 flex-1" aria-label="Links">
          {data.links.map((l, i) => {
            const p = pts[i];
            const size = `clamp(46px, ${n > 12 ? 11 : 15}cqmin, 96px)`;
            return (
              <li key={l.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <a href={l.url} {...linkTarget(mode, l.url)} onPointerDown={() => buzz(5)}
                  className="lm-pt-item group flex w-[clamp(70px,24cqw,130px)] flex-col items-center gap-1.5 outline-none"
                  style={{ ["--z" as string]: p.depth, animationDelay: `${p.delay}s, ${120 + i * 60}ms` } as CSSProperties}>
                  <LinkArt link={l} className="lm-pt-thumb rounded-[3px]" style={{ width: size, height: size }} icon={22} />
                  <span className="lm-pt-label line-clamp-2 text-center text-[10.5px] font-bold uppercase leading-tight tracking-[0.04em]">{l.title}</span>
                </a>
              </li>
            );
          })}
          {n === 0 ? <Empty className="absolute inset-x-0 top-1/2 text-[#111]" /> : null}
        </ul>

        {data.socials.length ? (
          <nav aria-label="Social profiles" className="relative z-10 mx-auto mb-1 shrink-0">
            <ul className="lm-pt-dock flex items-end gap-2 rounded-[20px] px-2.5 py-2">
              {data.socials.map((s, i) => (
                <li key={i}>
                  <a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)}
                    className="lm-pt-dockicon grid size-11 place-items-center rounded-[12px] bg-white text-[#111] outline-none focus-visible:ring-2 focus-visible:ring-[#111]">
                    <SocialIcon platform={s.platform} size={22} />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </div>
    </ThemeRoot>
  );
}
