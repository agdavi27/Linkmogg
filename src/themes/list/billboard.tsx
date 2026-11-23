"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Empty, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useSize } from "../motion";
import type { ThemeProps } from "../types";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import photo from "../assets/billboard.jpg";

// The photo is 1200 x 1500. These are the four corners of the blank board face in it,
// clockwise from top left. The page is drawn flat and then warped onto them.
const IW = 1200, IH = 1500;
const QUAD: [number, number][] = [[229, 415], [937, 523], [939, 867], [228, 826]];
const BOARD = { cx: 584, cy: 640, w: 711 };
const FW = 1000, FH = 500; // the flat size of the board's content

/** The CSS matrix that takes a FW x FH box onto QUAD (a standard square-to-quad homography). */
function warp() {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = QUAD;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / det, h = (dx1 * sy - sx * dy1) / det;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return `matrix3d(${[a / FW, d / FW, 0, g / FW, b / FH, e / FH, 0, h / FH, 0, 0, 1, 0, x0, y0, 0, 1].join(",")})`;
}
const WARP = warp();

// Where bubbles sit on one tile of the board: [x%, y%, size]. The middle is kept clear for the name.
const SLOTS: [number, number, number][] = [
  [7, 26, 0.95], [19, 13, 1.3], [31, 9, 0.75], [41, 13, 0.62], [13, 50, 0.8], [26, 42, 0.62],
  [17, 76, 1.4], [33, 66, 1.05], [57, 10, 0.75], [67, 14, 0.66], [60, 34, 0.64], [75, 33, 1.25],
  [90, 27, 0.62], [89, 50, 0.9], [69, 68, 0.82], [81, 64, 0.78], [77, 86, 0.55], [93, 78, 1.1],
];
const UNIT = FH * 0.19;

export default function Billboard({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  // Cover the screen with the photo, but never let the board get cut off on a narrow phone.
  const s = Math.max(w / IW, Math.min(h / IH, (w * 0.96) / BOARD.w));
  const ox = Math.min(0, Math.max(w - IW * s, w / 2 - BOARD.cx * s));
  const oy = IH * s < h ? h - IH * s : Math.min(0, Math.max(h - IH * s, h * 0.36 - BOARD.cy * s));

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(1500 + (i % 6) * 110, 0.015, 0.04);
    buzz(5);
  };
  const next = () => { if (n) pick(sel === null ? 0 : (sel + 1) % n); };
  const current = sel !== null ? data.links[sel] : null;

  return (
    <ThemeRoot data={data} mode={mode} label="Billboard" badgeTone="light" className="lm-bb bg-[#26598a] text-[#121212]">
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        {w > 0 ? (
          <div className="lm-bb-scene" style={{ transform: `translate(${ox}px, ${oy}px) scale(${s})` }}>
            <div className="lm-bb-move absolute inset-0">
              <Image src={photo} alt="" fill priority sizes="(max-width: 700px) 100vw, 1600px" placeholder="blur" className="pointer-events-none select-none object-cover" />
              <div aria-hidden className="lm-bb-haze" />

              {/* the board face, warped onto the photo */}
              <div className="lm-bb-face" style={{ width: FW, height: FH, transform: WARP }}>
                <div className="lm-bb-field absolute inset-0">
                  <div className="lm-bb-track absolute inset-y-0 left-0 flex w-[200%]">
                    {n > 0 ? [0, 1].map((copy) => (
                      <ul key={copy} className="relative h-full w-1/2" aria-hidden={copy === 1 || undefined} aria-label={copy === 0 ? "Links" : undefined}>
                        {SLOTS.map(([x, y, k], slot) => {
                          const i = (slot + copy * Math.ceil(n / 2)) % n;
                          const l = data.links[i];
                          const size = UNIT * k;
                          const real = copy === 0 && slot < n; // one focusable bubble per link
                          return (
                            <li key={slot} className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}>
                              <button type="button" tabIndex={real ? 0 : -1} aria-hidden={!real || undefined} onClick={() => pick(i)}
                                onPointerEnter={(e) => { if (e.pointerType === "mouse") setSel(i); }}
                                aria-label={real ? `${l.title}${sel === i ? ", selected. Press again to open" : ""}` : undefined}
                                className={`lm-bb-bubble relative block size-full rounded-full outline-none ${sel === i ? "is-on" : ""}`}
                                style={{ animationDelay: `${-(hash(`b${slot}`) % 50) / 10}s` }}>
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

                <div className="pointer-events-none absolute inset-x-0 top-[19%] z-10 flex flex-col items-center px-6 text-center" aria-live="polite">
                  <button type="button" onClick={next} aria-label="Next link"
                    className="lm-bb-plus pointer-events-auto mb-[14px] grid size-[42px] place-items-center rounded-full text-[26px] text-[#6b6b74]">+</button>
                  <h1 className="max-w-[560px] truncate font-display font-semibold lowercase leading-[0.9] tracking-[-0.06em]" style={{ fontSize: Math.min(126, 1000 / Math.max(5, name.length)) }}>{name}</h1>
                  <div className="mt-[12px] min-h-[2.6em] max-w-[420px] text-[22px] leading-snug text-[#7a7a80]">
                    {current ? (
                      <p key={current.id} className="lm-pop truncate"><span className="text-[#2a2a2e]">{current.title}</span><br />{hostOf(current.url)}</p>
                    ) : (
                      <p className="line-clamp-2">{data.bio || "Tap a bubble to see where it goes."}</p>
                    )}
                  </div>
                  {current ? (
                    <a ref={openRef} href={current.url} key={current.id} {...linkTarget(mode, current.url)}
                      className="lm-pop lm-bb-pill pointer-events-auto mt-[10px] rounded-full bg-white px-6 py-2.5 text-[20px] font-semibold">Open link</a>
                  ) : (
                    <button type="button" onClick={next} className="lm-bb-pill pointer-events-auto mt-[10px] rounded-full bg-white px-6 py-2.5 text-[20px] font-semibold">
                      {n ? "Show me" : "No links yet"}
                    </button>
                  )}
                </div>
                {n === 0 ? <Empty className="absolute inset-x-0 bottom-8 text-[22px]" /> : null}
                <div aria-hidden className="lm-bb-light" />
              </div>
            </div>
          </div>
        ) : null}

        {/* down on the grass: a readable version of the pick, and the socials */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-4 pb-2">
          {current ? (
            <a key={current.id} href={current.url} {...linkTarget(mode, current.url)} tabIndex={-1} aria-hidden
              className="lm-pop flex max-w-full items-center gap-2 rounded-full bg-white/90 py-1.5 pl-4 pr-1.5 text-[14px] font-semibold text-[#121212] shadow-lg backdrop-blur">
              <span className="truncate">{current.title}</span>
              <span className="shrink-0 rounded-full bg-[#121212] px-3 py-1 text-[12px] text-white">Open ↗</span>
            </a>
          ) : null}
          {data.socials.length ? (
            <ul className="flex justify-center gap-1" aria-label="Social profiles">
              {data.socials.map((so, i) => (
                <li key={i}><a href={so.url} {...linkTarget(mode, so.url)} aria-label={platformLabel(so.platform)} className="grid size-9 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15"><SocialIcon platform={so.platform} size={18} /></a></li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </ThemeRoot>
  );
}
