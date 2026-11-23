"use client";

import { useRef, useState, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { Empty, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

// Pixel flower parts on a 9 x 17 grid. "p" petal, "c" center, "s" stem, "l" leaf.
const HEADS = [
  [".pp.pp...", "ppppppp..", "ppcccpp..", ".pcccp...", "ppcccpp..", "ppppppp..", ".pp.pp..."],
  ["..ppp....", ".ppppp...", "ppcccpp..", "ppcccpp..", "ppcccpp..", ".ppppp...", "..ppp...."],
  ["p..p..p..", ".p.p.p...", "..ccc....", "ppcccpp..", "..ccc....", ".p.p.p...", "p..p..p.."],
  ["..p.p....", ".ppppp...", "ppcccpp..", ".pcccp...", "ppcccpp..", ".ppppp...", "..p.p...."],
].map((rows) => rows.map((r) => r.slice(0, 7)));
const STEM = ["...s...", "...s.ll", "...sll.", "ll.s...", ".lls...", "...s...", "...s...", "...s...", "...s...", "...s..."];
const PETALS = ["#ff3b30", "#ff8ac2", "#ffd23f", "#ffffff", "#9b6bff", "#ff8a1f", "#5ad1ff"];
const CENTERS = ["#ffd23f", "#3b2a1a", "#ff5a1f", "#ffffff"];

function Flower({ link, size }: { link: ThemeLink; size: number }) {
  const k = hash(link.id + link.title);
  const head = HEADS[k % HEADS.length];
  const petal = PETALS[(k >>> 3) % PETALS.length];
  const center = CENTERS[(k >>> 6) % CENTERS.length] === petal ? "#3b2a1a" : CENTERS[(k >>> 6) % CENTERS.length];
  const rows = [...head, ...STEM];
  const px = size / 7;
  return (
    <svg aria-hidden viewBox={`0 0 7 ${rows.length}`} width={size} height={px * rows.length} shapeRendering="crispEdges" className="block">
      {rows.flatMap((r, y) => [...r].map((ch, x) => {
        if (ch === ".") return null;
        const fill = ch === "p" ? petal : ch === "c" ? center : ch === "s" ? "#1f7a34" : "#2fa64c";
        return <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={fill} />;
      }))}
    </svg>
  );
}

export default function Garden({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;
  const perRow = n > 8 ? Math.ceil(n / 2) : Math.max(n, 1); // a second row of flowers once there are many
  const flowerW = Math.max(22, Math.min(84, (w * 0.9) / perRow - 8, h * (n > 8 ? 0.075 : 0.11)));

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(1200 + (i % 6) * 160, 0.02, 0.04);
    buzz(6);
  };
  const current = sel !== null ? data.links[sel] : null;
  const top = data.socials.slice(0, 2);
  const rest = data.socials.slice(2);

  return (
    <ThemeRoot data={data} mode={mode} label="Garden" badgeTone="light" className="lm-gd bg-[#3e7f2c] text-white">
      <div ref={stage} className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <div aria-hidden className="lm-gd-sky"><span className="lm-gd-clouds" /><span className="lm-gd-clouds is-2" /></div>
        <svg aria-hidden className="lm-gd-field" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <defs>
            <filter id="lm-gd-grass" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.25 0.9" numOctaves="3" seed="5" />
              <feColorMatrix values="0 0 0 0 0.75  0 0 0 0 0.9  0 0 0 0 0.35  0 0 0 1.8 -0.9" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <linearGradient id="lm-gd-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#5e8f3a" /><stop offset=".25" stopColor="#6fa23f" /><stop offset="1" stopColor="#4d8a2a" />
            </linearGradient>
          </defs>
          <path d="M0 40 C 200 10, 380 8, 560 30 S 860 52, 1000 40 L1000 400 L0 400 Z" fill="url(#lm-gd-green)" />
          <path d="M0 40 C 200 10, 380 8, 560 30 S 860 52, 1000 40 L1000 400 L0 400 Z" fill="#000" filter="url(#lm-gd-grass)" opacity=".55" />
          <path d="M0 40 C 200 10, 380 8, 560 30 S 860 52, 1000 40 L1000 70 C 700 60, 300 48, 0 66 Z" fill="#3f6b2a" opacity=".35" />
        </svg>
        <div aria-hidden className="lm-gd-grain" />

        {/* top corners: socials; middle: handle as a signature */}
        <header className="relative z-10 grid shrink-0 grid-cols-[1fr_auto_1fr] items-start gap-2 px-[6%] pt-[clamp(14px,4cqh,40px)]">
          <div className="flex min-w-0 flex-col items-start gap-1">
            {top[0] ? <SocialTag s={top[0]} mode={mode} /> : null}
          </div>
          <p className="lm-gd-sig text-center font-marker text-[clamp(18px,6cqw,34px)] leading-none">@{data.username}</p>
          <div className="flex min-w-0 flex-col items-end gap-1">
            {top[1] ? <SocialTag s={top[1]} mode={mode} align="end" /> : null}
          </div>
        </header>

        <div className="relative z-10 shrink-0 px-[5%] pt-[clamp(10px,3.5cqh,36px)] text-center">
          {data.bio ? <p className="lm-gd-red lm-gd-bio mx-auto line-clamp-1 max-w-[40ch] text-[clamp(11px,3.2cqw,17px)] font-semibold uppercase tracking-[0.02em]">{data.bio}</p> : null}
          <h1 className="lm-gd-red lm-gd-title mt-1 truncate font-marker uppercase leading-[0.95]" style={{ fontSize: `clamp(34px, ${Math.min(15, 105 / Math.max(6, name.length))}cqw, 120px)` }}>{name}</h1>
        </div>

        {/* the flowers, planted on the hill */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-end">
          <ul className="flex flex-wrap items-end justify-center gap-x-[clamp(4px,1.6cqw,18px)] gap-y-1 px-3" style={{ maxWidth: perRow * (flowerW + 18) }} aria-label="Links">
            {data.links.map((l, i) => (
              <li key={l.id}>
                <button type="button" onClick={() => pick(i)} onPointerEnter={(e) => { if (e.pointerType === "mouse") setSel(i); }}
                  aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
                  className={`lm-gd-flower block outline-none ${sel === i ? "is-on" : ""}`} style={{ animationDelay: `${300 + i * 120}ms, ${-(hash(l.id) % 30) / 10}s` } as CSSProperties}>
                  <Flower link={l} size={flowerW} />
                </button>
              </li>
            ))}
          </ul>
          {n === 0 ? <Empty className="mb-8 text-white" /> : null}
        </div>

        {/* on the grass: what the chosen flower is */}
        <div className="relative z-10 flex h-[clamp(90px,22cqh,200px)] shrink-0 flex-col items-center justify-center px-[5%] text-center" aria-live="polite">
          {current ? (
            <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)} className="lm-pop group block max-w-full outline-none">
              <span className="lm-gd-red block truncate font-marker uppercase leading-[0.95]" style={{ fontSize: `clamp(30px, ${Math.min(12, 95 / Math.max(6, current.title.length))}cqw, 104px)` }}>{current.title}</span>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#d2231a] transition-transform group-active:scale-95">{hostOf(current.url)} ↗</span>
            </a>
          ) : (
            <p className="lm-gd-red font-marker text-[clamp(26px,9cqw,72px)] uppercase leading-none">{n ? "Pick a flower" : ""}</p>
          )}
        </div>

        {/* bottom: the rest of the socials */}
        <footer className="relative z-10 flex shrink-0 items-end justify-between gap-3 px-[6%] pb-[clamp(6px,2cqh,18px)]">
          <div className="min-w-0">
            <p className="text-[clamp(15px,4.6cqw,24px)] font-bold uppercase leading-none tracking-[-0.01em]">Follow <span className="text-[0.6em] align-top">({data.socials.length})</span></p>
            <p className="mt-1 truncate text-[11px] text-white/85">@{data.username}</p>
          </div>
          {rest.length ? (
            <ul className="flex flex-col items-end gap-1.5" aria-label="More social profiles">
              {rest.map((s, i) => (
                <li key={i}>
                  <a href={s.url} {...linkTarget(mode, s.url)} className="flex items-center gap-1.5 font-serif text-[13px] uppercase tracking-[0.12em] text-white/95 hover:underline">
                    <SocialIcon platform={s.platform} size={14} />{platformLabel(s.platform)}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </footer>
      </div>
    </ThemeRoot>
  );
}

function SocialTag({ s, mode, align = "start" }: { s: { platform: string; url: string }; mode: ThemeProps["mode"]; align?: "start" | "end" }) {
  return (
    <a href={s.url} {...linkTarget(mode, s.url)} className={`flex flex-col leading-tight hover:underline ${align === "end" ? "items-end text-right" : ""}`}>
      <span className="flex items-center gap-1 text-[clamp(13px,3.8cqw,18px)] font-bold"><SocialIcon platform={s.platform} size={15} />{platformLabel(s.platform)}</span>
      <span className="text-[11px] text-white/85">Follow along</span>
    </a>
  );
}
