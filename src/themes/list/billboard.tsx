"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Empty, ThemeRoot, hostOf, linkTarget, usePrefersReducedMotion } from "../shared";
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

// The board's top edge leans down to the right in the photo; the name above it leans with it.
const TOP_TILT = Math.atan2(QUAD[1][1] - QUAD[0][1], QUAD[1][0] - QUAD[0][0]) * (180 / Math.PI);
const CARD_W = 270, CARD_GAP = 34;

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
  const oy = IH * s < h ? h - IH * s : Math.min(0, Math.max(h - IH * s, h * (w > h ? 0.5 : 0.4) - BOARD.cy * s));

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(1500 + (i % 6) * 110, 0.015, 0.04);
    buzz(5);
  };
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
              {/* your name, painted on the sky just above the board, following its top edge */}
              <h1 className="lm-bb-name absolute font-display font-bold leading-none tracking-[-0.05em] text-white"
                style={{ left: QUAD[0][0] + 4, top: QUAD[0][1], fontSize: Math.min(96, 1300 / Math.max(6, name.length)), transform: `rotate(${TOP_TILT}deg) translateY(-100%)` }}>
                <span className="block max-w-[700px] truncate pb-[0.18em]">{name}</span>
              </h1>

              {/* the board face, warped onto the photo: a glass rail of your links that drifts and scrolls */}
              <div className="lm-bb-face" style={{ width: FW, height: FH, transform: WARP }}>
                {data.bio ? <p className="absolute left-[34px] right-[34px] top-[22px] z-10 truncate text-[22px] text-[#6d6d74]">{data.bio}</p> : null}
                <Rail data={data} sel={sel} onPick={pick} onHover={setSel} />
                <p aria-hidden className="absolute bottom-[18px] right-[34px] z-10 text-[18px] font-medium text-[#8a8a90]">{n ? `${n} link${n === 1 ? "" : "s"} · swipe →` : ""}</p>
                {n === 0 ? <Empty className="absolute inset-x-0 top-1/2 text-[22px]" /> : null}
                <div aria-hidden className="lm-bb-light" />
              </div>
            </div>
          </div>
        ) : null}

        {/* down on the grass: a readable version of the pick, and the socials */}
        <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 px-4 pb-2">
          {current ? (
            <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)}
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

/** A glass rail of big bubbles. It drifts on its own, and you can swipe or scroll it any time. */
function Rail({ data, sel, onPick, onHover }: { data: ThemeProps["data"]; sel: number | null; onPick: (i: number) => void; onHover: (i: number) => void }) {
  const rail = useRef<HTMLDivElement>(null);
  const hold = useRef(0); // drift waits until this time after someone touches the rail
  const reduced = usePrefersReducedMotion();
  const n = data.links.length;

  useEffect(() => {
    const el = rail.current;
    if (!el || reduced || n < 2) return;
    let raf = 0, last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(64, t - last); last = t;
      if (t > hold.current) {
        el.scrollLeft += dt * 0.035;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half; // the second copy takes over seamlessly
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, n]);

  const touch = () => { hold.current = performance.now() + 4000; };
  const copies = n > 1 && !reduced ? [0, 1] : [0];

  return (
    <div ref={rail} className="lm-bb-rail absolute inset-x-0 top-[70px] bottom-[52px] flex items-center overflow-x-auto"
      onPointerDown={touch} onWheel={touch} onTouchStart={touch} onFocusCapture={touch}>
      {copies.map((copy) => (
        <ul key={copy} className="flex shrink-0 items-center" style={{ gap: CARD_GAP, paddingLeft: CARD_GAP }} aria-hidden={copy === 1 || undefined} aria-label={copy === 0 ? "Links" : undefined}>
          {data.links.map((l, i) => (
            <li key={l.id} className="shrink-0">
              <button type="button" tabIndex={copy === 1 ? -1 : 0} onClick={() => onPick(i)}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") onHover(i); }}
                aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
                className={`lm-bb-glass flex flex-col items-center rounded-[44px] px-[22px] pb-[22px] pt-[26px] outline-none ${sel === i ? "is-on" : ""}`}
                style={{ width: CARD_W }}>
                <span className="lm-bb-bubble relative block size-[190px] rounded-full">
                  <LinkArt link={l} className="size-full rounded-full" icon={58} blur={0.6} mark />
                  <span aria-hidden className="lm-bb-gloss" />
                </span>
                <span className="mt-[18px] block w-full truncate text-center text-[30px] font-semibold leading-tight tracking-[-0.03em] text-[#1d1d22]">{l.title}</span>
                <span className="mt-[4px] block w-full truncate text-center text-[19px] text-[#7a7a80]">{hostOf(l.url)}</span>
              </button>
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}
