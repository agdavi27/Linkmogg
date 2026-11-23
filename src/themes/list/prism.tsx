"use client";

import { useRef, type CSSProperties } from "react";
import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { useParallax } from "../motion";
import type { ThemeProps } from "../types";

export default function Prism({ data, mode }: ThemeProps) {
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const n = data.links.length;
  const cols = n <= 1 ? 1 : n <= 8 ? 2 : 3;
  const compact = n > 10;

  const track = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
  };
  const reset = (e: React.PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Prism" className="lm-pr bg-[#eceef5] text-[#15151c]">
      <div ref={stage} className="relative flex min-h-0 flex-1 flex-col">
        <div aria-hidden className="lm-pr-light">
          <span className="lm-pr-blob" style={{ background: "#8b6cff", left: "-18%", top: "-8%", animationDuration: "19s" }} />
          <span className="lm-pr-blob" style={{ background: "#4fd6ff", right: "-24%", top: "18%", animationDuration: "23s", animationDelay: "-7s" }} />
          <span className="lm-pr-blob" style={{ background: "#ff8bd0", left: "4%", bottom: "-22%", animationDuration: "21s", animationDelay: "-12s" }} />
          <span className="lm-pr-blob lm-pr-blob-sm" style={{ background: "#c6ff7a", right: "6%", bottom: "8%", animationDuration: "17s", animationDelay: "-4s" }} />
          <span className="lm-pr-caustic" />
        </div>
        <div aria-hidden className="lm-pr-grain" />

        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col px-4 pb-2 pt-[clamp(14px,4cqh,44px)]">
          <header className="lm-pr-in flex flex-col items-center text-center">
            <span className="lm-pr-halo relative grid place-items-center rounded-full p-[3px]">
              <Avatar data={data} size={68} className="relative border-[3px] border-white/80 bg-white/70! text-[#15151c]" />
            </span>
            <h1 className="mt-3 text-[clamp(22px,6.4cqw,32px)] font-semibold leading-tight tracking-[-0.03em]">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="mt-1 line-clamp-2 max-w-[38ch] text-[13px] leading-snug text-[#15151c]/60 text-pretty">{data.bio}</p> : null}
          </header>

          <ul className="mt-[clamp(12px,3.5cqh,32px)] grid min-h-0 flex-1 gap-2.5" aria-label="Links"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridAutoRows: "minmax(0, 150px)" }}>
            {data.links.map((l, i) => {
              const p = detectPlatform(l.url)?.platform;
              const wide = cols === 2 && n % 2 === 1 && i === n - 1;
              return (
                <li key={l.id} className="lm-pr-tile-in min-h-0 [perspective:700px]" style={{ gridColumn: wide ? "span 2" : undefined, animationDelay: `${120 + i * 55}ms` } as CSSProperties}>
                  <a href={l.url} {...linkTarget(mode, l.url)} onPointerMove={track} onPointerLeave={reset}
                    className="lm-pr-tile group relative flex h-full min-h-0 flex-col justify-between overflow-hidden rounded-[clamp(14px,4cqw,22px)] p-[clamp(9px,2.6cqw,14px)] outline-none"
                    style={{ ["--d" as string]: `${i * 0.7}s` } as CSSProperties}>
                    <span aria-hidden className="lm-pr-spec" />
                    <span aria-hidden className="lm-pr-sweep" />
                    <span className="relative flex items-start justify-between">
                      <span aria-hidden className="grid size-[clamp(24px,7cqw,34px)] place-items-center rounded-[10px] bg-white/70 shadow-[0_1px_0_#fff_inset,0_2px_6px_-2px_rgba(40,30,90,.25)]">
                        {p && p !== "website" ? <SocialIcon platform={p} size={16} /> : <span className="text-[13px] font-bold">{l.title.trim()[0]?.toUpperCase()}</span>}
                      </span>
                      <span aria-hidden className="text-[15px] text-[#15151c]/40 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#7a5cff]">↗</span>
                    </span>
                    <span className="relative min-w-0">
                      <span className={`block font-semibold leading-tight tracking-[-0.015em] ${compact ? "truncate text-[13px]" : "line-clamp-2 text-[clamp(13px,3.8cqw,16px)]"}`}>{l.title}</span>
                      {!compact ? <span className="mt-0.5 block truncate text-[11px] text-[#15151c]/50">{hostOf(l.url)}</span> : null}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
          {n === 0 ? <Empty className="mt-6" /> : null}
          <SocialRow socials={data.socials} mode={mode} className="mt-2 shrink-0" iconClass="text-[#15151c]/80 hover:bg-white/50" size={20} />
        </div>
      </div>
    </ThemeRoot>
  );
}
