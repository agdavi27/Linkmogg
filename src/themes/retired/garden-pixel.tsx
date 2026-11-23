"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

// Pixel flower parts on a 9 x 17 grid. "p" petal, "c" center, "s" stem, "l" leaf.
const HEADS = [
  [".pp.pp...", "ppppppp..", "ppcccpp..", ".pcccp...", "ppcccpp..", "ppppppp..", ".pp.pp..."],
  ["..ppp....", ".ppppp...", "ppcccpp..", "ppcccpp..", "ppcccpp..", ".ppppp...", "..ppp...."],
  ["p..p..p..", ".p.p.p...", "..ccc....", "ppcccpp..", "..ccc....", ".p.p.p...", "p..p..p.."],
  ["..p.p....", ".ppppp...", "ppcccpp..", ".pcccp...", "ppcccpp..", ".ppppp...", "..p.p...."],
].map((rows) => rows.map((r) => r.slice(0, 7)));
// A closed bud, same footprint as a head so the stem lines up. "p" peeks out between the leaves.
const BUD = [".......", ".......", "..ppp..", ".ppppp.", ".lpppl.", "..lll..", "...l..."];
const STEM = ["...s...", "...s.ll", "...sll.", "ll.s...", ".lls...", "...s...", "...s...", "...s...", "...s...", "...s..."];
const PETALS = ["#ff3b30", "#ff8ac2", "#ffd23f", "#ffffff", "#9b6bff", "#ff8a1f", "#5ad1ff"];
const CENTERS = ["#ffd23f", "#3b2a1a", "#ff5a1f", "#ffffff"];

function Flower({ link, size, open }: { link: ThemeLink; size: number; open: boolean }) {
  const k = hash(link.id + link.title);
  const head = HEADS[k % HEADS.length];
  const petal = PETALS[(k >>> 3) % PETALS.length];
  const center = CENTERS[(k >>> 6) % CENTERS.length] === petal ? "#3b2a1a" : CENTERS[(k >>> 6) % CENTERS.length];
  const rows = [...(open ? head : BUD), ...STEM];
  const px = size / 7;
  return (
    <svg aria-hidden viewBox={`0 0 7 ${rows.length}`} width={size} height={px * rows.length} shapeRendering="crispEdges" className="block overflow-visible">
      <g key={open ? "open" : "bud"} className={open ? "lm-gd-bloom" : undefined} style={{ transformOrigin: "50% 40%" }}>
      {rows.flatMap((r, y) => [...r].map((ch, x) => {
        if (ch === ".") return null;
        const fill = ch === "p" ? petal : ch === "c" ? center : ch === "s" ? "#1f7a34" : "#2fa64c";
        return <rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" fill={fill} />;
      }))}
      </g>
    </svg>
  );
}

export default function GardenPixel({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;
  // wide screens plant one long row; phones plant a few short ones so the name tags stay readable
  const perRow = w > 700 ? Math.max(1, Math.min(n, 7)) : n > 4 ? Math.ceil(n / (n > 12 ? 3 : 2)) : Math.max(n, 1);
  const rows = Math.max(1, Math.ceil(n / perRow));
  // a flower is 17 pixels tall for every 7 wide, plus its name tag; the rows share about 40% of the height
  const flowerW = Math.max(22, Math.min(84, (w * 0.9) / perRow - 26, ((h * 0.4) / rows - 34) * 7 / 17));

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(1200 + (i % 6) * 160, 0.02, 0.04);
    buzz(6);
  };
  const current = sel !== null ? data.links[sel] : null;

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

        {/* the handle, signed at the top */}
        <header className="relative z-10 shrink-0 px-[6%] pt-[max(54px,clamp(14px,4cqh,40px))] text-center">
          <p className="lm-gd-sig font-display text-[clamp(15px,4.4cqw,22px)] font-semibold leading-none tracking-[-0.02em]">@{data.username}</p>
        </header>

        <div className="relative z-10 shrink-0 px-[5%] pt-[clamp(10px,3.5cqh,36px)] text-center">
          {data.bio ? <p className="lm-gd-bio mx-auto line-clamp-1 max-w-[40ch] text-[clamp(11px,3.2cqw,16px)] font-medium uppercase tracking-[0.08em] text-white/90 tracking-[0.02em]">{data.bio}</p> : null}
          <h1 className="lm-gd-title mt-1 truncate font-display font-bold leading-[0.9] tracking-[-0.055em] text-white" style={{ fontSize: `clamp(34px, ${Math.min(17, 120 / Math.max(6, name.length))}cqw, 120px)` }}>{name}</h1>
        </div>

        {/* the flowers, planted on the hill */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-end">
          <ul className="flex flex-wrap items-end justify-center gap-x-[clamp(4px,1.6cqw,18px)] gap-y-1 px-3" style={{ maxWidth: perRow * (flowerW + 40) + 32 }} aria-label="Links">
            {data.links.map((l, i) => (
              <li key={l.id} className="flex flex-col items-center">
                <button type="button" onClick={() => pick(i)} onPointerEnter={(e) => { if (e.pointerType === "mouse") setSel(i); }}
                  aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
                  className={`lm-gd-flower block outline-none ${sel === i ? "is-on" : ""}`} style={{ animationDelay: `${300 + i * 120}ms, ${-(hash(l.id) % 30) / 10}s` } as CSSProperties}>
                  <Flower link={l} size={flowerW} open={sel === i} />
                </button>
                <span aria-hidden className={`lm-gd-tag mx-auto mt-1 line-clamp-2 block text-center leading-[1.1] ${sel === i ? "is-on" : ""}`}
                  style={{ width: flowerW + 18, fontSize: Math.max(9.5, Math.min(13, flowerW * 0.2)) }}>{l.title}</span>
              </li>
            ))}
          </ul>
          {n === 0 ? <Empty className="mb-8 text-white" /> : null}
        </div>

        {/* on the grass: what the chosen flower is */}
        <div className="relative z-10 flex h-[clamp(90px,22cqh,200px)] shrink-0 flex-col items-center justify-center px-[5%] text-center" aria-live="polite">
          {current ? (
            <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)} className="lm-pop group block max-w-full outline-none">
              <span className="lm-gd-pick block truncate font-display font-bold leading-[0.95] tracking-[-0.05em] text-white" style={{ fontSize: `clamp(30px, ${Math.min(12, 100 / Math.max(6, current.title.length))}cqw, 104px)` }}>{current.title}</span>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#1d4f1a] transition-transform group-active:scale-95">{hostOf(current.url)} ↗</span>
            </a>
          ) : (
            <p className="lm-gd-pick font-display text-[clamp(24px,8cqw,64px)] font-bold leading-none tracking-[-0.05em] text-white">{n ? "Pick a bud." : ""}</p>
          )}
        </div>

        {/* bottom: a hint, then every social as a plain icon row */}
        <div className="relative z-10 shrink-0 px-5 pb-1">
          <p className="text-center text-[12px] text-white/70">{n ? "Tap a bud and it blooms. Tap the flower again to open the link." : ""}</p>
          {data.socials.length ? <SocialRow socials={data.socials} mode={mode} className="mt-0.5" iconClass="size-9! text-white/85 hover:bg-white/10" size={18} /> : null}
        </div>
      </div>
    </ThemeRoot>
  );
}
