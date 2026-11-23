"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useParallax, useSize } from "../motion";
import type { ThemeProps } from "../types";

/** A glowing folder in the dark, with your links floating out of it as little files. */
export default function Glow({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  useParallax(stage);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;
  const current = sel !== null ? data.links[sel] : null;

  const m = Math.min(w, h * 0.9);
  const folder = Math.max(140, Math.min(m * 0.42, 280));
  const file = Math.max(30, Math.min(m * 0.085, 48));
  // Files fan out in an arch over the folder, in two rows if there are many.
  const spots = data.links.map((_, i) => {
    const row = n > 9 && i % 2 ? 1 : 0;
    const per = n > 9 ? Math.ceil(n / 2) : n;
    const j = n > 9 ? Math.floor(i / 2) : i;
    const span = Math.min(w < 500 ? 130 : 200, 40 + per * 20);
    const a = (per === 1 ? 0 : (j / (per - 1) - 0.5) * span) * (Math.PI / 180);
    const R = folder * (0.95 + row * 0.42);
    const edge = w / 2 - 46; // keep labels on screen
    return { x: Math.max(-edge, Math.min(edge, Math.sin(a) * R)), y: -Math.cos(a) * R * 0.78 };
  });

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i); tick(1900 + (i % 5) * 120, 0.012, 0.04); buzz(4);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Glow" badgeTone="light" className="lm-gl bg-black text-white">
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="lm-gl-light" />
        {w > 0 ? (
          <div className="lm-gl-scene absolute left-1/2" style={{ top: `${Math.max(56, h * 0.18) + folder * 1.05}px` }}>
            {/* the files */}
            <ul aria-label="Links">
              {data.links.map((l, i) => (
                <li key={l.id} className="lm-gl-orbit absolute" style={{ left: spots[i].x, top: spots[i].y, ["--i" as string]: i } as CSSProperties}>
                  <button type="button" onClick={() => pick(i)} aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
                    className={`lm-gl-file flex -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none ${sel === i ? "is-on" : ""}`}>
                    <span className="lm-gl-doc relative block" style={{ width: file, height: file * 1.25 }}>
                      <LinkArt link={l} className="absolute inset-x-[14%] bottom-[16%] top-[30%] rounded-[2px]" icon={Math.round(file * 0.26)} blur={0.3} />
                    </span>
                    <span className="mt-1 max-w-[84px] truncate text-[10px] text-white/70">{l.title}</span>
                  </button>
                </li>
              ))}
            </ul>

            {/* the folder */}
            <div className="lm-gl-folder absolute" style={{ width: folder, height: folder * 0.72, left: -folder / 2, top: -folder * 0.36 }}>
              <span aria-hidden className="lm-gl-back" />
              <span aria-hidden className="lm-gl-front" />
              <span aria-hidden className="lm-gl-flare" />
              <p className="absolute inset-x-0 bottom-[14%] z-10 truncate px-3 text-center text-[clamp(13px,3.4cqw,17px)] font-medium text-white/95">
                {current ? hostOf(current.url) : `${data.username} ${new Date().getFullYear()}`}
              </p>
            </div>
          </div>
        ) : null}

        {/* below the folder: what you picked */}
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-2 px-6 text-center" aria-live="polite">
          {current ? (
            <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)}
              className="lm-pop flex max-w-full items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-[14px] font-semibold text-black">
              <span className="truncate">{current.title}</span>
              <span className="lm-gl-go shrink-0 rounded-full px-3 py-1 text-[12px] text-white">Open ↗</span>
            </a>
          ) : (
            <div className="lm-pop">
              <h1 className="text-[clamp(20px,5.6cqw,30px)] font-semibold tracking-[-0.03em]">{name}</h1>
              {data.bio ? <p className="mx-auto mt-1 line-clamp-2 max-w-[40ch] text-[12px] text-white/55">{data.bio}</p> : null}
            </div>
          )}
          <SocialRow socials={data.socials} mode={mode} iconClass="size-9! text-white/75 hover:bg-white/10" size={18} />
        </div>
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3" /> : null}
      </div>
    </ThemeRoot>
  );
}
