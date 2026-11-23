"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget, usePrefersReducedMotion } from "../shared";
import { useSize } from "../motion";
import type { ThemeProps } from "../types";

// Shown until someone uploads their own reels: Drew's own clips, with stills for reduced motion.
const SAMPLE = ["/backdrops/field.mp4", "/backdrops/peaks.mp4", "/backdrops/sea.mp4"];
const still = (src: string) => (src.startsWith("/backdrops/") ? src.replace(/\.mp4$/, ".jpg") : undefined);

/** A wall of your reels, small and soft-focus, with your links written over them in white. */
export default function Reels({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const stage = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(stage);
  const reduced = usePrefersReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const handle = data.instagram?.handle || data.username;
  const name = data.displayName || handle;
  const reels = data.instagram?.reels.length ? data.instagram.reels : SAMPLE;

  // a profile-style grid of 9:16 tiles that covers the whole screen
  const cols = w > 900 ? 5 : w > 560 ? 4 : 3;
  const tileW = w / cols, tileH = tileW * 16 / 9;
  const rows = tileH ? Math.min(4, Math.ceil(h / tileH)) : 0;
  const tiles = Array.from({ length: cols * rows }, (_, i) => reels[i % reels.length]);
  const big = n <= 5;
  const small = n > 9;

  return (
    <ThemeRoot data={data} mode={mode} label="Reels" badgeTone="light" className="lm-rl bg-[#0c0c0c] text-white">
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="lm-rl-wall absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {tiles.map((src, i) => (
            <div key={i} className="relative overflow-hidden" style={{ height: tileH }}>
              {reduced ? (
                <video src={still(src) ? src : `${src}#t=0.1`} poster={still(src)} muted playsInline preload={still(src) ? "none" : "metadata"} className="size-full object-cover" />
              ) : (
                <video src={src} muted playsInline loop autoPlay preload="metadata" poster={still(src)} className="size-full object-cover"
                  style={{ animationDelay: `${(i % 7) * -0.6}s` } as CSSProperties} />
              )}
            </div>
          ))}
        </div>
        <div aria-hidden className="lm-rl-veil absolute inset-0" />

        <div className="relative z-10 flex h-full flex-col px-[7%] pb-3 pt-[max(56px,6cqh)]">
          <header className="flex shrink-0 items-center gap-3">
            <Avatar data={data} size={Math.round(Math.max(48, Math.min(72, w * 0.14)))} className="shrink-0 ring-2 ring-white/90 ring-offset-2 ring-offset-black/30" />
            <div className="min-w-0">
              <h1 className="truncate text-[clamp(20px,6cqw,34px)] font-semibold leading-tight tracking-[-0.03em]">{name}</h1>
              <p className="truncate text-[13px] text-white/75">@{handle}</p>
            </div>
          </header>
          {data.bio ? <p className="mt-3 line-clamp-2 max-w-[44ch] text-[14px] leading-snug text-white/85">{data.bio}</p> : null}

          <nav aria-label="Links" className="lm-rl-list mt-auto min-h-0 overflow-y-auto overscroll-contain">
            <ul className="flex flex-col">
              {data.links.map((l, i) => (
                <li key={l.id} className="lm-rl-row border-t border-white/25 last:border-b" style={{ ["--d" as string]: `${120 + i * 60}ms` } as CSSProperties}>
                  <a href={l.url} {...linkTarget(mode, l.url)}
                    onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                    className={`group flex items-baseline justify-between gap-3 py-[clamp(8px,1.6cqh,14px)] outline-none transition-opacity duration-200 focus-visible:underline ${hover !== null && hover !== i ? "opacity-55" : ""}`}>
                    <span className={`min-w-0 truncate font-semibold leading-[1.02] tracking-[-0.035em] ${big ? "text-[clamp(26px,8.4cqw,54px)]" : small ? "text-[clamp(17px,4.6cqw,28px)]" : "text-[clamp(20px,6cqw,40px)]"}`}>{l.title}</span>
                    <span className="shrink-0 text-[12px] text-white/70 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5">{hostOf(l.url)} ↗</span>
                  </a>
                </li>
              ))}
            </ul>
            {n === 0 ? <Empty className="text-white" /> : null}
          </nav>
          <SocialRow socials={data.socials} mode={mode} className="mt-3 shrink-0" iconClass="size-9! text-white/85 hover:bg-white/10" size={18} />
        </div>
      </div>
    </ThemeRoot>
  );
}
