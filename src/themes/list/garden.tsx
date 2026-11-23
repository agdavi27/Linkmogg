"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

const PETALS = ["#ff4d5e", "#ff9cc8", "#ffd23f", "#ffffff", "#a98bff", "#ff8a3d", "#7fd3ff"];
const CENTERS = ["#ffcc33", "#4a2c17", "#ff6a2b", "#fff4c2"];
// petal count, petal length and width (as a share of the head), and how round the tips are
const KINDS: { count: number; len: number; wid: number }[] = [
  { count: 8, len: 0.5, wid: 0.15 },  // daisy
  { count: 5, len: 0.44, wid: 0.3 },  // poppy
  { count: 6, len: 0.48, wid: 0.22 }, // cosmos
  { count: 12, len: 0.46, wid: 0.1 }, // aster
];

/** A flower on a curved stem. Closed it's a bud wrapped in two sepals; open, the petals fan out. */
function Flower({ link, size, open }: { link: ThemeLink; size: number; open: boolean }) {
  const k = hash(link.id + link.title);
  const petal = PETALS[(k >>> 3) % PETALS.length];
  const c0 = CENTERS[(k >>> 6) % CENTERS.length];
  const center = c0 === petal ? "#4a2c17" : c0;
  const kind = KINDS[k % KINDS.length];
  const bend = ((k >>> 9) % 9) - 4; // a little lean, different per flower
  const W = 60, H = 150, cx = 30 + bend * 0.8, cy = 32;
  const r = 33; // head radius in viewBox units; petals may reach a little past the stem's box
  const leafSide = (k >>> 12) % 2 ? 1 : -1;
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} width={size} height={size * H / W} className="block overflow-visible">
      {/* stem and leaves */}
      <path d={`M30 ${H} C 30 ${H - 40}, ${cx - bend * 2} ${cy + 50}, ${cx} ${cy + 8}`} fill="none" stroke="#2f7a30" strokeWidth="4" strokeLinecap="round" />
      <path d={`M30 ${H - 34} c ${leafSide * 6} -14, ${leafSide * 20} -16, ${leafSide * 24} -12 c ${-leafSide * 6} 10, ${-leafSide * 16} 14, ${-leafSide * 24} 12z`} fill="#3f9a3a" />
      <path d={`M${30 + bend * 0.3} ${H - 66} c ${-leafSide * 5} -12, ${-leafSide * 16} -13, ${-leafSide * 20} -9 c ${leafSide * 5} 8, ${leafSide * 13} 11, ${leafSide * 20} 9z`} fill="#4fae44" />
      {open ? (
        <g className="lm-gd-bloom" style={{ transformOrigin: `${cx}px ${cy}px` }}>
          {Array.from({ length: kind.count }, (_, i) => {
            const a = (360 / kind.count) * i + (k % 30);
            return (
              <ellipse key={i} cx={cx} cy={cy - r * kind.len} rx={r * kind.wid} ry={r * kind.len} fill={petal}
                stroke="rgba(0,0,0,.08)" strokeWidth=".6" transform={`rotate(${a} ${cx} ${cy})`} />
            );
          })}
          <circle cx={cx} cy={cy} r={r * 0.24} fill={center} />
          <circle cx={cx - r * 0.07} cy={cy - r * 0.07} r={r * 0.08} fill="#fff" opacity=".35" />
        </g>
      ) : (
        <g transform={`translate(${cx} ${cy + 12}) scale(1.75) translate(${-cx} ${-cy - 12})`}>
        <g className="lm-gd-bud" style={{ transformOrigin: `${cx}px ${cy + 12}px` }}>
          <path d={`M${cx} ${cy - 14} C ${cx + 11} ${cy - 6}, ${cx + 10} ${cy + 8}, ${cx} ${cy + 12} C ${cx - 10} ${cy + 8}, ${cx - 11} ${cy - 6}, ${cx} ${cy - 14}z`} fill={petal} stroke="rgba(0,0,0,.1)" strokeWidth=".6" />
          <path d={`M${cx} ${cy + 13} C ${cx - 12} ${cy + 10}, ${cx - 12} ${cy - 2}, ${cx - 7} ${cy - 6} C ${cx - 6} ${cy + 2}, ${cx - 3} ${cy + 8}, ${cx} ${cy + 13}z`} fill="#3f9a3a" />
          <path d={`M${cx} ${cy + 13} C ${cx + 12} ${cy + 10}, ${cx + 12} ${cy - 2}, ${cx + 7} ${cy - 6} C ${cx + 6} ${cy + 2}, ${cx + 3} ${cy + 8}, ${cx} ${cy + 13}z`} fill="#4fae44" />
        </g>
        </g>
      )}
    </svg>
  );
}

/** A strip of grass blades, tiled sideways, that the stems grow out of. */
function GrassFringe({ id }: { id: string }) {
  return (
    <svg aria-hidden className="lm-gd-fringe" width="100%" height="34" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="46" height="34" patternUnits="userSpaceOnUse">
          <path d="M0 34 Q3 18 1 6 Q6 20 7 34Z M8 34 Q12 14 16 2 Q14 20 15 34Z M17 34 Q18 22 24 12 Q22 24 23 34Z M25 34 Q27 16 30 4 Q31 20 31 34Z M32 34 Q36 20 42 10 Q38 24 39 34Z M40 34 Q42 22 46 8 Q46 24 46 34Z" fill="#3e8a2f" />
          <path d="M4 34 Q7 22 11 14 Q10 26 11 34Z M20 34 Q22 24 27 18 Q25 28 26 34Z M34 34 Q35 24 37 16 Q39 26 38 34Z" fill="#6cbd4a" />
        </pattern>
      </defs>
      <rect width="100%" height="34" fill={`url(#${id})`} />
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
  // wide screens plant one long row; phones plant a few short ones so the name tags stay readable
  const perRow = w > 700 ? Math.max(1, Math.min(n, 7)) : n > 4 ? Math.ceil(n / (n > 12 ? 3 : 2)) : Math.max(n, 1);
  const rows = Math.max(1, Math.ceil(n / perRow));
  // a flower is 17 pixels tall for every 7 wide, plus its name tag; the rows share about 40% of the height
  const flowerW = Math.max(26, Math.min(80, (w * 0.9) / perRow - 22, ((h * 0.42) / rows - 40) * 60 / 150));
  const beds = Array.from({ length: rows }, (_, r) => data.links.slice(r * perRow, (r + 1) * perRow));

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
        <div aria-hidden className="lm-gd-grain" />

        {/* the handle, signed at the top */}
        <header className="relative z-10 shrink-0 px-[6%] pt-[max(54px,clamp(14px,4cqh,40px))] text-center">
          <p className="lm-gd-sig font-display text-[clamp(15px,4.4cqw,22px)] font-semibold leading-none tracking-[-0.02em]">@{data.username}</p>
        </header>

        <div className="relative z-10 shrink-0 px-[5%] pt-[clamp(10px,3.5cqh,36px)] text-center">
          {data.bio ? <p className="lm-gd-bio mx-auto line-clamp-1 max-w-[40ch] text-[clamp(11px,3.2cqw,16px)] font-medium uppercase tracking-[0.08em] text-white/90 tracking-[0.02em]">{data.bio}</p> : null}
          <h1 className="lm-gd-title mt-1 truncate font-display font-bold leading-[0.9] tracking-[-0.055em] text-white" style={{ fontSize: `clamp(34px, ${Math.min(17, 120 / Math.max(6, name.length))}cqw, 120px)` }}>{name}</h1>
        </div>

        {/* in the sky: what the chosen flower is */}
        <div className="relative z-10 flex min-h-[clamp(80px,16cqh,170px)] flex-1 flex-col items-center justify-center px-[5%] text-center" aria-live="polite">
          {current ? (
            <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)} className="lm-pop group block max-w-full outline-none">
              <span className="lm-gd-pick block truncate font-display font-bold leading-[0.95] tracking-[-0.05em] text-white" style={{ fontSize: `clamp(30px, ${Math.min(12, 100 / Math.max(6, current.title.length))}cqw, 104px)` }}>{current.title}</span>
              <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-semibold text-[#1d4f1a] transition-transform group-active:scale-95">{hostOf(current.url)} ↗</span>
            </a>
          ) : (
            <p className="lm-gd-pick font-display text-[clamp(24px,8cqw,64px)] font-bold leading-none tracking-[-0.05em] text-white">{n ? "Pick a bud." : ""}</p>
          )}
        </div>

        {/* the flowers, planted in rows of grass, each with a little name marker in front */}
        <div className="relative z-10 flex shrink-0 flex-col items-stretch" aria-label="Links" role="list">
          <div aria-hidden className="lm-gd-hill" style={{ top: flowerW * 2.5 - 30 }} />
          {beds.map((bed, r) => (
            <div key={r} className="lm-gd-bed relative">
              <ul className="relative mx-auto flex items-end justify-center gap-x-[clamp(6px,2cqw,22px)] px-3" role="presentation">
                {bed.map((l, k) => {
                  const i = r * perRow + k;
                  return (
                    <li key={l.id} role="listitem" className="relative flex flex-col items-center" style={{ width: flowerW + 20 }}>
                      <button type="button" onClick={() => pick(i)} onPointerEnter={(e) => { if (e.pointerType === "mouse") setSel(i); }}
                        aria-label={`${l.title}${sel === i ? ", in bloom. Press again to open" : ""}`}
                        className={`lm-gd-flower relative z-0 -mb-[22px] block outline-none ${sel === i ? "is-on" : ""}`} style={{ animationDelay: `${200 + i * 90}ms, ${-(hash(l.id) % 30) / 10}s` } as CSSProperties}>
                        <Flower link={l} size={flowerW} open={sel === i} />
                      </button>
                    </li>
                  );
                })}
              </ul>
              <GrassFringe id={`lm-gd-blades-${r}`} />
              <ul aria-hidden className="relative z-10 -mt-[18px] flex justify-center gap-x-[clamp(6px,2cqw,22px)] px-3">
                {bed.map((l, k) => (
                  <li key={l.id} className="flex justify-center" style={{ width: flowerW + 20 }}>
                    <span className={`lm-gd-tag line-clamp-2 max-w-full text-center ${sel === r * perRow + k ? "is-on" : ""}`}
                      style={{ fontSize: Math.max(9.5, Math.min(12.5, flowerW * 0.19)) }}>{l.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {n === 0 ? <Empty className="mb-8 text-white" /> : null}
        </div>

        {/* bottom: a hint, then every social as a plain icon row */}
        <div className="lm-gd-ground relative z-10 shrink-0 px-5 pb-1 pt-2">
          <p className="text-center text-[12px] text-white/80">{n ? "Tap a bud and it blooms. Tap the flower again to open it." : ""}</p>
          {data.socials.length ? <SocialRow socials={data.socials} mode={mode} className="mt-0.5" iconClass="size-9! text-white/85 hover:bg-white/10" size={18} /> : null}
        </div>
      </div>
    </ThemeRoot>
  );
}
