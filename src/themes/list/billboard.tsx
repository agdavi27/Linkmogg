"use client";

import { useRef, useState } from "react";
import { Empty, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useSize } from "../motion";
import type { ThemeProps } from "../types";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";

// Where bubbles sit on one tile of the board: [x%, y%, size]. The middle is kept clear for the name.
const SLOTS: [number, number, number][] = [
  [7, 26, 0.95], [19, 13, 1.3], [31, 9, 0.75], [41, 13, 0.62], [13, 50, 0.8], [26, 42, 0.62],
  [17, 76, 1.4], [33, 66, 1.05], [57, 10, 0.75], [67, 14, 0.66], [60, 34, 0.64], [75, 33, 1.25],
  [90, 27, 0.62], [89, 50, 0.9], [69, 68, 0.82], [81, 64, 0.78], [77, 86, 0.55], [93, 78, 1.1],
];

// The field, drawn in a 1000x300 box: soft mounds with a fringe of short blades, generated once.
const BLADES = (() => {
  let d = "M0 300 L0 70";
  for (let i = 0; i <= 500; i++) {
    const x = i * 2;
    const k = hash(`g${i}`);
    const mound = 62 + Math.sin(x * 0.011) * 16 + Math.sin(x * 0.031 + 1) * 9;
    d += ` L${x - 0.6} ${(mound + 4).toFixed(1)} L${x} ${(mound - 6 - ((k >>> 3) % 22)).toFixed(1)} L${x + 0.6} ${(mound + 4).toFixed(1)}`;
  }
  return d + " L1000 300 Z";
})();

const FLOWERS = Array.from({ length: 90 }, (_, i) => {
  const k = hash(`f${i}`);
  const x = i % 3 === 0 ? k % 320 : 560 + (k % 440);
  return { x, y: 52 + ((k >>> 6) % 90), r: 2 + ((k >>> 12) % 10) / 3, c: ["#f7a6bf", "#ffc2d2", "#f08fae", "#ffd9e3"][(k >>> 3) % 4] };
});

export default function Billboard({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w: bw, h: bh } = useSize(board);
  const name = data.displayName || data.username;
  const unit = Math.max(26, bh * 0.19);

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(1500 + (i % 6) * 110, 0.015, 0.04);
    buzz(5);
  };
  const next = () => { if (n) pick(sel === null ? 0 : (sel + 1) % n); };
  const current = sel !== null ? data.links[sel] : null;
  const small = Math.max(9.5, Math.min(bh * 0.04, 14));

  return (
    <ThemeRoot data={data} mode={mode} label="Billboard" badgeTone="light" className="lm-bb bg-[#0b3d22] text-[#121212]">
      <Sky />
      <div aria-hidden className="lm-bb-mountain" />

      <div className="relative z-10 flex min-h-0 flex-1 items-start justify-center px-[5%] pt-[clamp(28px,12cqh,120px)]">
        <div className="lm-bb-sign relative w-full" style={{ maxWidth: "min(820px, 84cqh)" }}>
          <div ref={board} className={`lm-bb-board relative overflow-hidden ${bw && bw < 520 ? "is-narrow" : ""}`} style={{ aspectRatio: bw && bw < 520 ? "1.15" : "1.75" }}>
            {/* drifting bubbles: two copies of one tile, slid sideways forever */}
            <div className="lm-bb-field absolute inset-0">
              <div className="lm-bb-track absolute inset-y-0 left-0 flex w-[200%]">
                {bw > 0 && n > 0 ? [0, 1].map((copy) => (
                  <ul key={copy} className="relative h-full w-1/2" aria-hidden={copy === 1 || undefined} aria-label={copy === 0 ? "Links" : undefined}>
                    {SLOTS.map(([x, y, s], k) => {
                      const i = (k + copy * Math.ceil(n / 2)) % n;
                      const l = data.links[i];
                      const size = unit * s;
                      const real = copy === 0 && k < n; // one focusable bubble per link
                      return (
                        <li key={k} className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}>
                          <button type="button" tabIndex={real ? 0 : -1} aria-hidden={!real || undefined} onClick={() => pick(i)}
                            onPointerEnter={(e) => { if (e.pointerType === "mouse") setSel(i); }}
                            aria-label={real ? `${l.title}${sel === i ? ", selected. Press again to open" : ""}` : undefined}
                            className={`lm-bb-bubble relative block size-full rounded-full outline-none ${sel === i ? "is-on" : ""}`}
                            style={{ animationDelay: `${-(hash(`b${k}`) % 50) / 10}s` }}>
                            <LinkArt link={l} className="size-full rounded-full" icon={Math.round(size * 0.3)} blur={0.6} mark={size > 40} />
                            <span aria-hidden className="lm-bb-gloss" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )) : null}
              </div>
            </div>

            {/* the middle of the board */}
            <div className="pointer-events-none absolute inset-x-0 top-[21%] z-10 flex flex-col items-center px-4 text-center" aria-live="polite">
              <button type="button" onClick={next} aria-label="Next link"
                className="lm-bb-plus pointer-events-auto mb-[3%] grid place-items-center rounded-full text-[#6b6b74]" style={{ width: unit * 0.42, height: unit * 0.42, fontSize: unit * 0.26 }}>+</button>
              <h1 className="max-w-full truncate font-display font-semibold lowercase leading-[0.85] tracking-[-0.06em]" style={{ fontSize: Math.max(30, Math.min(bh * 0.25, bw * 0.13)) }}>{name}</h1>
              <div className="mt-[2.5%] min-h-[2.5em] max-w-[34ch] leading-snug text-[#7a7a80]" style={{ fontSize: small }}>
                {current ? (
                  <p key={current.id} className="lm-pop truncate"><span className="text-[#2a2a2e]">{current.title}</span><br />{hostOf(current.url)}</p>
                ) : (
                  <p className="line-clamp-2">{data.bio || "Tap a bubble to see where it goes."}</p>
                )}
              </div>
              {current ? (
                <a ref={openRef} href={current.url} key={current.id} {...linkTarget(mode, current.url)}
                  className="lm-pop lm-bb-pill pointer-events-auto mt-[2%] rounded-full bg-white px-4 py-1.5 font-semibold" style={{ fontSize: small }}>
                  Open link
                </a>
              ) : (
                <button type="button" onClick={next} className="lm-bb-pill pointer-events-auto mt-[2%] rounded-full bg-white px-4 py-1.5 font-semibold" style={{ fontSize: small }}>
                  {n ? "Show me" : "No links yet"}
                </button>
              )}
            </div>
            {n === 0 ? <Empty className="absolute inset-x-0 bottom-6" /> : null}
          </div>
          <div aria-hidden className="lm-bb-catwalk" />
          <div aria-hidden className="lm-bb-pole" />
        </div>
      </div>

      {/* grass, with a few pink flowers, swaying a little */}
      <div aria-hidden className="lm-bb-grass">
        <svg className="absolute inset-0 size-full" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMin slice">
          <defs>
            <filter id="lm-bb-tex" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.09 0.012" numOctaves="3" seed="3" />
              <feColorMatrix values="0 0 0 0 0.55  0 0 0 0 1  0 0 0 0 0.6  0 0 0 2.2 -1" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <filter id="lm-bb-shade" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves="4" seed="9" />
              <feColorMatrix values="0 0 0 0 0  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 2.4 -1.1" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
            <linearGradient id="lm-bb-green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#27b25c" /><stop offset=".3" stopColor="#139048" /><stop offset=".75" stopColor="#0a6a33" /><stop offset="1" stopColor="#053d1d" />
            </linearGradient>
          </defs>
          <path d={BLADES} fill="url(#lm-bb-green)" />
          <path d={BLADES} fill="#000" filter="url(#lm-bb-shade)" />
          <path d={BLADES} fill="#000" filter="url(#lm-bb-tex)" opacity=".7" />
          {FLOWERS.map((f, i) => <ellipse key={i} cx={f.x} cy={f.y} rx={f.r * 0.7} ry={f.r} fill={f.c} opacity=".85" />)}
        </svg>
      </div>

      {data.socials.length ? (
        <ul className="relative z-20 flex shrink-0 justify-center gap-1 pb-1" aria-label="Social profiles">
          {data.socials.map((s, i) => (
            <li key={i}><a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)} className="grid size-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15"><SocialIcon platform={s.platform} size={18} /></a></li>
          ))}
        </ul>
      ) : null}
    </ThemeRoot>
  );
}

/** A deep blue sky with soft, drifting clouds made from fractal noise. */
function Sky() {
  const tile = (seed: number, fx: string, a: string, key: number) => (
    <svg key={key} className="h-full w-1/2" viewBox="0 0 1200 800" preserveAspectRatio="none">
      <filter id={`lm-bb-cloud-${seed}-${key}`} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={fx} numOctaves="5" seed={seed} stitchTiles="stitch" />
        <feColorMatrix values={`0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  ${a}`} />
      </filter>
      <rect width="1200" height="800" filter={`url(#lm-bb-cloud-${seed}-${key})`} />
    </svg>
  );
  return (
    <div aria-hidden className="lm-bb-sky">
      <div className="lm-bb-clouds lm-bb-c1">{[0, 1].map((k) => tile(7, "0.0028 0.0075", "1.6 0 0 0 -0.72", k))}</div>
      <div className="lm-bb-clouds lm-bb-c2">{[0, 1].map((k) => tile(11, "0.006 0.016", "1.5 0 0 0 -0.8", k))}</div>
    </div>
  );
}
