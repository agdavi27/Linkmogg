"use client";

import { useRef, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon, iconFor } from "@/lib/socials/icons";
import { Empty, ThemeRoot, hash, initials, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, useParallax } from "../motion";
import type { ThemeProps } from "../types";

/** Scatter links loosely across the page, jittered per link so it feels placed by hand. */
function spots(n: number) {
  const cols = n <= 4 ? 2 : n <= 9 ? 3 : n <= 16 ? 4 : 5;
  const rows = Math.max(1, Math.ceil(n / cols));
  return Array.from({ length: n }, (_, i) => {
    const r = Math.floor(i / cols), c = i % cols;
    const inRow = r === rows - 1 ? n - r * cols : cols;
    const k = hash(`p${i}`);
    const jx = ((k % 100) / 100 - 0.5) * 0.7, jy = (((k >>> 8) % 100) / 100 - 0.5) * 0.6;
    const x = 4 + ((c + 0.5 + jx + (cols - inRow) / 2) / cols) * 92;
    const y = 6 + ((r + 0.5 + jy) / rows) * 84;
    return { x, y, depth: 0.4 + ((k >>> 16) % 60) / 100, delay: -((k >>> 4) % 70) / 10 };
  });
}

export default function Portrait({ data, mode }: ThemeProps) {
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const n = data.links.length;
  const pts = spots(n);
  const name = data.displayName || data.username;

  return (
    <ThemeRoot data={data} mode={mode} label="Portrait" className="lm-pt bg-[#fafafa] text-[#111]">
      <div ref={stage} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* the person's photo, big, soft and with no background */}
        <div aria-hidden className="lm-pt-photo">
          {data.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={data.avatarUrl} alt="" className="size-full object-cover object-top" />
            : (
              <span className="relative block size-full">
                <span className="absolute left-[30%] top-[12%] h-[46%] w-[40%] rounded-[46%_54%_48%_52%] bg-[radial-gradient(circle_at_60%_45%,#d9a98d,#a8735a_60%,#6d4a3c)]" />
                <span className="absolute left-[24%] top-[6%] h-[22%] w-[52%] rounded-[60%_60%_30%_30%] bg-[radial-gradient(circle_at_40%_40%,#d9d6e8,#a7a3bd)]" />
                <span className="absolute left-[18%] top-[22%] h-[8%] w-[30%] -rotate-6 rounded-[50%] bg-[#b8b4cc]" />
                <span className="absolute left-[38%] top-[52%] h-[12%] w-[22%] bg-[#8a5f4d]" />
                <span className="absolute bottom-[-10%] left-[8%] h-[44%] w-[84%] rounded-t-[48%] bg-[radial-gradient(circle_at_50%_20%,#2b2b2e,#121214_75%)]" />
                <span className="absolute inset-x-0 top-[30%] text-center font-display text-[12cqmin] font-bold text-white/25">{initials(name)}</span>
              </span>
            )}
        </div>

        <h1 className="lm-pt-in relative z-10 shrink-0 px-5 pt-[clamp(10px,2.5cqh,24px)] text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#111]/55">
          {name}{data.bio ? <span className="font-normal normal-case tracking-normal text-[#111]/40"> · {data.bio}</span> : null}
        </h1>

        <ul className="relative z-10 mx-[3%] my-[clamp(6px,2cqh,20px)] min-h-0 flex-1" aria-label="Links">
          {data.links.map((l, i) => {
            const p = pts[i];
            const size = `clamp(38px, ${n > 12 ? 8 : 10.5}cqmin, 76px)`;
            return (
              <li key={l.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <a href={l.url} {...linkTarget(mode, l.url)} onPointerDown={() => buzz(5)}
                  className="lm-pt-item group flex w-[clamp(66px,22cqw,120px)] flex-col items-center gap-1 outline-none"
                  style={{ ["--z" as string]: p.depth, animationDelay: `${p.delay}s, ${120 + i * 60}ms` } as CSSProperties}>
                  <LinkArt link={l} className="lm-pt-thumb" style={{ width: size, height: size }} icon={18} blur={0.3} />
                  <span className="lm-pt-label line-clamp-2 text-center text-[clamp(8.5px,2.2cqmin,10.5px)] font-bold uppercase leading-tight tracking-[0.02em]">{l.title}</span>
                </a>
              </li>
            );
          })}
          {n === 0 ? <Empty className="absolute inset-x-0 top-1/2" /> : null}
        </ul>

        {data.socials.length ? (
          <nav aria-label="Social profiles" className="relative z-10 mx-auto mb-1 shrink-0">
            <ul className="lm-pt-dock flex items-end gap-[clamp(5px,1.4cqw,9px)] rounded-[16px] px-2.5 py-2">
              {data.socials.map((s, i) => {
                const hex = iconFor(s.platform).hex;
                return (
                  <li key={i} className="flex items-end">
                    {i > 0 && i % 3 === 0 ? <span aria-hidden className="mx-1 h-8 w-px self-center bg-black/15" /> : null}
                    <a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)}
                      className="lm-pt-dockicon grid size-[clamp(34px,9cqmin,44px)] place-items-center rounded-[10px] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#111]"
                      style={{ background: `linear-gradient(160deg, #${hex}, color-mix(in oklab, #${hex} 70%, #000))` }}>
                      <SocialIcon platform={s.platform} size={20} color="#fff" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
      </div>
    </ThemeRoot>
  );
}
