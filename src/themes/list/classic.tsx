"use client";

import type { CSSProperties } from "react";
import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

export default function Classic({ data, mode }: ThemeProps) {
  return (
    <ThemeRoot data={data} mode={mode} label="Classic" className="lm-cl-bg relative overflow-hidden text-[#1d1a16]">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="lm-cl-blob" style={{ left: "-20%", top: "-10%", background: "#ffcf9e", animationDuration: "22s" }} />
        <span className="lm-cl-blob" style={{ right: "-25%", top: "20%", background: "#ffb3a1", animationDuration: "28s", animationDelay: "-8s" }} />
        <span className="lm-cl-blob" style={{ left: "10%", bottom: "-20%", background: "#f6e3a8", animationDuration: "25s", animationDelay: "-14s" }} />
      </div>
      <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center px-5 pb-8 pt-12">
        <div className="lm-cl-in relative" style={{ ["--i" as string]: 0 } as CSSProperties}>
          <span aria-hidden className="lm-cl-ring" />
          <Avatar data={data} size={92} className="relative bg-[#efe6d6]! ring-4 ring-white shadow-[0_6px_20px_-8px_rgba(40,30,10,.35)]" />
        </div>
        <h1 className="lm-cl-in mt-4 text-center font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-balance" style={{ ["--i" as string]: 1 } as CSSProperties}>
          {data.displayName || `@${data.username}`}
        </h1>
        {data.bio ? <p className="lm-cl-in mt-2 max-w-[34ch] text-center text-[0.95rem] leading-relaxed text-[#5b5348] text-pretty" style={{ ["--i" as string]: 2 } as CSSProperties}>{data.bio}</p> : null}
        <div className="lm-cl-in" style={{ ["--i" as string]: 3 } as CSSProperties}>
          <SocialRow socials={data.socials} mode={mode} className="mt-4" iconClass="text-[#2a251f] hover:bg-black/5" />
        </div>
        <ul className="mt-6 flex w-full flex-col gap-2.5" aria-label="Links">
          {data.links.map((l, i) => {
            const p = detectPlatform(l.url)?.platform;
            return (
              <li key={l.id} className="lm-cl-in" style={{ ["--i" as string]: 4 + i } as CSSProperties}>
                <a href={l.url} {...linkTarget(mode, l.url)}
                  onPointerMove={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
                    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
                  }}
                  className="lm-cl-link group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-black/[.07] bg-white px-4 py-3.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5b2e]">
                  <span aria-hidden className="lm-cl-spot" />
                  <span aria-hidden className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-[#f4efe6] text-[#2a251f] transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105">
                    {p && p !== "website" ? <SocialIcon platform={p} size={18} /> : <span className="text-sm font-bold">{l.title.trim()[0]?.toUpperCase()}</span>}
                  </span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate font-medium">{l.title}</span>
                    <span className="block truncate text-xs text-[#8a8174]">{hostOf(l.url)}</span>
                  </span>
                  <span aria-hidden className="relative text-[#b3a99a] transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-[#ff5b2e]">→</span>
                </a>
              </li>
            );
          })}
        </ul>
        {data.links.length === 0 ? <Empty className="mt-6" /> : null}
      </div>
    </ThemeRoot>
  );
}
