"use client";

import type { CSSProperties } from "react";
import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { hash } from "./shared";
import type { ThemeLink } from "./types";

/** Hand-picked palettes for generated cover art: background, mid, accent. */
const PALETTES: [string, string, string][] = [
  ["#1b3fd1", "#3d6bff", "#c9f24a"],
  ["#ff5a1f", "#ff9a5c", "#2a1208"],
  ["#0d0f1a", "#27306b", "#7fa6ff"],
  ["#e8e2d4", "#c9b99a", "#1f1a12"],
  ["#d8263b", "#ff6f7d", "#ffe3e6"],
  ["#0f5c4c", "#2fb38f", "#e7ffe0"],
  ["#f2c230", "#ffe27a", "#3a2a00"],
  ["#6b2fd6", "#a979ff", "#ffd4f2"],
  ["#111111", "#3a3a3a", "#f4f4f4"],
  ["#ff8fc4", "#ffc3de", "#5a1035"],
];

/** FNV alone clusters on similar strings; a murmur-style finalizer spreads them out. */
function mix(s: string) {
  let h = hash(s);
  h ^= h >>> 15; h = Math.imul(h, 2246822507);
  h ^= h >>> 13; h = Math.imul(h, 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function paletteOf(link: ThemeLink) {
  return PALETTES[mix(`${link.title}|${link.url}`) % PALETTES.length];
}

export function platformOf(link: ThemeLink) {
  const p = detectPlatform(link.url)?.platform ?? "website";
  return p === "website" || p === "email" ? null : p;
}

/**
 * Generated artwork for a link: a palette, one of a few abstract compositions, and the platform
 * icon (or the title's first letter). Deterministic, so server and client render the same thing.
 */
export function LinkArt({ link, className = "", icon = 34, mark = true, style }: { link: ThemeLink; className?: string; icon?: number; mark?: boolean; style?: CSSProperties }) {
  const h = mix(link.title + link.id);
  const [bg, mid, acc] = paletteOf(link);
  const kind = h % 4;
  const p = platformOf(link);
  const x = 20 + (h % 60), y = 20 + ((h >> 6) % 60);
  const layers = [
    `radial-gradient(70% 70% at ${x}% ${y}%, ${mid} 0%, transparent 70%)`,
    kind === 0 ? `radial-gradient(circle at ${100 - x}% ${100 - y}%, ${acc} 0 14%, transparent 14.5%)` : "",
    kind === 1 ? `linear-gradient(${(h >> 3) % 180}deg, transparent 45%, ${acc}55 45% 55%, transparent 55%)` : "",
    kind === 2 ? `repeating-radial-gradient(circle at ${x}% 110%, ${acc}22 0 3px, transparent 3px 12px)` : "",
    kind === 3 ? `conic-gradient(from ${(h >> 4) % 360}deg at ${x}% ${y}%, ${bg}, ${mid}, ${acc}88, ${bg})` : "",
    `linear-gradient(160deg, ${bg}, ${mid})`,
  ].filter(Boolean).join(", ");
  return (
    <span aria-hidden className={`${/\b(absolute|fixed)\b/.test(className) ? "" : "relative "}grid place-items-center overflow-hidden ${className}`} style={{ background: layers, ...style }}>
      {mark ? (p
        ? <SocialIcon platform={p} size={icon} color={acc} className="relative drop-shadow-[0_2px_6px_rgba(0,0,0,.25)]" />
        : <span className="relative font-display font-bold leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,.2)]" style={{ color: acc, fontSize: icon * 1.1 }}>{link.title.trim()[0]?.toUpperCase()}</span>) : null}
    </span>
  );
}
