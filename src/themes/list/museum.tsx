"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

/**
 * A small art museum seen from above at an angle. The paintings on the walls are the links,
 * and a couple of visitors wander around looking at them.
 * Floor coordinates: x runs along the back-left wall, y along the back-right wall, z is up.
 */
export default function Gallery({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const [spin, setSpin] = useState(0);
  const [drag, setDrag] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { w, h } = useSize(stage);

  const S = Math.max(170, Math.min(w * 0.68, h * 0.66, 600)); // floor size
  const H = S * 0.5; // wall height
  const rz = -45 + Math.max(-28, Math.min(28, spin + drag));
  const dragProps = useDragX((dx) => setDrag(dx / 6), (dx) => { setDrag(0); setSpin((s) => Math.max(-28, Math.min(28, s + dx / 6))); });

  // Split the links between the two walls, and size paintings so they stay big.
  const leftLinks = data.links.slice(0, Math.ceil(n / 2));
  const rightLinks = data.links.slice(Math.ceil(n / 2));
  const sizeFor = (c: number) => {
    const rows = c > 4 ? 2 : 1;
    const cols = Math.ceil(c / rows);
    return Math.min((S * 0.84) / cols - S * 0.04, (H * 0.68) / rows - H * 0.06);
  };

  const pick = (i: number) => {
    setSel(i);
    tick(900 + (i % 6) * 120, 0.02, 0.04);
    buzz(6);
  };
  const go = (d: number) => { if (n) pick(sel === null ? 0 : (sel + d + n) % n); };
  const current = sel !== null ? data.links[sel] : null;
  useEffect(() => { if (sel !== null) closeRef.current?.focus({ preventScroll: true }); }, [sel]);

  const wall = (links: ThemeLink[]) => {
    const size = sizeFor(links.length);
    return (
      <div className="flex size-full flex-wrap content-center items-center justify-center gap-x-[6%] gap-y-[8%] px-[6%] pb-[4%] pt-[12%]">
        {links.map((l) => {
          const i = data.links.indexOf(l);
          return (
            <button key={l.id} type="button" onClick={() => pick(i)} aria-label={`View ${l.title}`}
              className={`lm-gm-art relative shrink-0 outline-none ${sel === i ? "is-on" : ""}`} style={{ width: size, height: size * 0.8 }}>
              <span aria-hidden className="lm-gm-spot" />
              <LinkArt link={l} className="absolute inset-[7%]" icon={Math.round(size * 0.18)} blur={0} mark={size > 46} />
              <span className="lm-gm-plaque absolute left-1/2 top-[104%] max-w-full -translate-x-1/2 truncate" style={{ fontSize: Math.max(5, size * 0.075) }}>{l.title}</span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Gallery" className="lm-gm bg-[#e9e7e3] text-[#1d1a17]">
      <header className="relative z-20 shrink-0 px-5 pt-[clamp(12px,3cqh,28px)] text-center">
        <h1 className="font-serif text-[clamp(20px,5.6cqw,32px)] tracking-[-0.01em]">{data.displayName || `@${data.username}`}</h1>
        {data.bio ? <p className="mx-auto mt-0.5 line-clamp-1 max-w-[46ch] text-[12.5px] text-black/50">{data.bio}</p> : null}
      </header>

      <div ref={stage} {...dragProps} className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none active:cursor-grabbing"
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); if (e.key === "Escape") setSel(null); }}>
        {w > 0 ? (
          <div className="lm-gm-scene absolute left-1/2 top-1/2" style={{ width: S, height: S, marginLeft: -S / 2, marginTop: -S * 0.25 }}>
            <div className={`lm-gm-room absolute inset-0 ${drag ? "" : "is-anim"}`} style={{ transform: `rotateX(58deg) rotateZ(${rz}deg)`, ["--rz" as string]: `${rz}deg` } as CSSProperties}>
              <div className="lm-gm-floor absolute inset-0" />
              <div className="lm-gm-floor-edge absolute inset-x-0 top-full" style={{ height: S * 0.03 }} />
              <div className="lm-gm-floor-edge is-side absolute left-0 top-0" style={{ width: S * 0.03, height: S }} />

              {/* back-left wall, along y = 0 */}
              <div className="lm-gm-wall absolute" style={{ left: 0, top: 0, width: S, height: H, transformOrigin: "50% 0", transform: "rotateX(90deg)" }}>
                <div className="size-full" style={{ transform: "scaleY(-1)" }}>{wall(leftLinks)}</div>
              </div>
              {/* back-right wall, along x = S */}
              <div className="lm-gm-wall is-right absolute" style={{ left: S, top: 0, width: H, height: S, transformOrigin: "0 50%", transform: "rotateY(-90deg)" }}>
                <div className="absolute left-1/2 top-1/2" style={{ width: S, height: H, marginLeft: -S / 2, marginTop: -H / 2, transform: "rotate(90deg) scaleX(-1)" }}>
                  {rightLinks.length ? wall(rightLinks) : <div className="grid size-full place-items-center pt-[10%]"><span className="lm-gm-sign" style={{ fontSize: S * 0.04 }}>{data.displayName || data.username}</span></div>}
                </div>
              </div>

              {/* benches and a sculpture on a plinth */}
              <Box x={S * 0.34} y={S * 0.5} w={S * 0.3} d={S * 0.08} h={S * 0.045} top="#3b3633" side="#28231f" />
              <Box x={S * 0.38} y={S * 0.51} w={S * 0.02} d={S * 0.06} h={S * 0.025} top="#8c8a86" side="#6a6864" />
              <Box x={S * 0.6} y={S * 0.51} w={S * 0.02} d={S * 0.06} h={S * 0.025} top="#8c8a86" side="#6a6864" />
              <Box x={S * 0.14} y={S * 0.74} w={S * 0.1} d={S * 0.1} h={S * 0.12} top="#fbfaf8" side="#dedbd6" />
              <Sprite x={S * 0.19} y={S * 0.79} z={S * 0.12} w={S * 0.09} h={S * 0.12}><span className="lm-gm-sculpture absolute inset-0" /></Sprite>
              <Sprite x={S * 0.86} y={S * 0.88} w={S * 0.1} h={S * 0.18}><Fern /></Sprite>

              {/* visitors */}
              <Walker path="a" s={S} shirt="#d9553b" pants="#2b2f3a" hair="#2a1d16" />
              <Walker path="b" s={S} shirt="#3d6fd6" pants="#3a3530" hair="#c9a36b" />
            </div>
          </div>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 bottom-6" /> : null}

        {/* the painting, up close */}
        {current ? (
          <div className="lm-gm-modal absolute inset-0 z-30 grid place-items-center p-[4%]" role="dialog" aria-modal="true" aria-label={current.title}
            onPointerDown={(e) => { if (e.target === e.currentTarget) setSel(null); }}>
            <div key={current.id} className="lm-gm-card relative flex w-full max-w-[min(520px,80cqh)] flex-col items-center gap-3 rounded-[22px] bg-[#fbfaf8] p-[clamp(14px,4cqmin,24px)]">
              <button ref={closeRef} type="button" aria-label="Close" onClick={() => setSel(null)} className="absolute -right-2 -top-2 z-10 grid size-10 place-items-center rounded-full bg-white text-xl shadow-[0_4px_12px_-4px_rgba(0,0,0,.35)] transition-transform active:scale-90">×</button>
              <div className="lm-gm-frame relative w-full" style={{ aspectRatio: "1.25", maxHeight: "52cqh" }}>
                <LinkArt link={current} className="absolute inset-[5%]" icon={56} blur={0} />
              </div>
              <div className="w-full min-w-0 text-center">
                <p className="truncate font-serif text-[clamp(20px,5.6cqw,28px)] leading-tight">{current.title}</p>
                <p className="truncate text-[12.5px] text-black/45">{hostOf(current.url)} · {String((sel ?? 0) + 1).padStart(2, "0")} of {String(n).padStart(2, "0")}</p>
              </div>
              <div className="flex w-full items-center gap-2">
                <button type="button" aria-label="Previous painting" onClick={() => go(-1)} className="lm-gm-arrow">‹</button>
                <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
                  className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#1d1a17] text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[.97]">
                  Open link ↗
                </a>
                <button type="button" aria-label="Next painting" onClick={() => go(1)} className="lm-gm-arrow">›</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative z-20 shrink-0 px-5 pb-1">
        <p className="text-center text-[12px] text-black/45">{n ? "Tap a painting to look closer. Drag to turn the room." : ""}</p>
        <SocialRow socials={data.socials} mode={mode} className="mt-0.5" iconClass="size-9! text-black/60 hover:bg-black/5" size={18} />
      </div>
    </ThemeRoot>
  );
}

/** A box sitting on the floor: top face plus the two faces you can see. */
function Box({ x, y, w, d, h, top, side }: { x: number; y: number; w: number; d: number; h: number; top: string; side: string }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: w, height: d }}>
      <span className="absolute inset-0" style={{ background: top, transform: `translateZ(${h}px)` }} />
      <span className="absolute left-0 top-full" style={{ width: w, height: h, background: side, transformOrigin: "0 0", transform: "rotateX(90deg)" }} />
      <span className="absolute left-0 top-0" style={{ width: h, height: d, background: side, transformOrigin: "0 0", transform: "rotateY(-90deg)", filter: "brightness(.85)" }} />
    </div>
  );
}

/** Flat things (people, plants) stand up and turn to face the viewer. */
function Sprite({ x, y, z = 0, w, h, children }: { x: number; y: number; z?: number; w: number; h: number; children?: ReactNode }) {
  return (
    <div className="absolute" style={{ left: x, top: y, width: 0, height: 0, transform: `translateZ(${z}px)` }}>
      <div className="lm-gm-face absolute" style={{ width: w, height: h, left: -w / 2, top: -h }}>{children}</div>
    </div>
  );
}

function Fern() {
  return (
    <>
      {[-40, -18, 4, 24, 46].map((r, i) => (
        <span key={i} className="lm-gm-leaf absolute bottom-[28%] left-1/2 origin-bottom rounded-[50%_50%_50%_50%/80%_80%_20%_20%]"
          style={{ width: "32%", height: `${66 - Math.abs(r) / 3}%`, marginLeft: "-16%", rotate: `${r}deg`, background: i % 2 ? "#1f8a3c" : "#2fa64c", animationDelay: `${-i * 0.6}s` }} />
      ))}
      <span className="absolute bottom-0 left-1/2 h-[30%] w-[50%] -translate-x-1/2 rounded-b-[30%] bg-[linear-gradient(90deg,#e9e6e1,#ffffff,#d5d1cb)]" />
    </>
  );
}

/** A visitor strolling a loop along the walls, stopping now and then to look. */
function Walker({ path, s, shirt, pants, hair }: { path: "a" | "b"; s: number; shirt: string; pants: string; hair: string }) {
  return (
    <div className={`lm-gm-walk is-${path} absolute left-0 top-0`} style={{ ["--s" as string]: `${s}px` } as CSSProperties}>
      <div className="lm-gm-face absolute" style={{ width: s * 0.06, height: s * 0.2, left: -s * 0.03, top: -s * 0.2 }}>
        <span className="lm-gm-person absolute inset-0">
          <span className="absolute left-1/2 top-0 h-[17%] w-[62%] -translate-x-1/2 rounded-full bg-[#e2b293]" />
          <span className="absolute left-1/2 top-[-2%] h-[9%] w-[66%] -translate-x-1/2 rounded-t-full" style={{ background: hair }} />
          <span className="absolute left-1/2 top-[18%] h-[40%] w-[100%] -translate-x-1/2 rounded-[40%_40%_10%_10%]" style={{ background: shirt }} />
          <span className="lm-gm-leg absolute top-[56%] h-[44%] w-[38%] rounded-b-[3px]" style={{ left: "10%", background: pants }} />
          <span className="lm-gm-leg is-b absolute top-[56%] h-[44%] w-[38%] rounded-b-[3px]" style={{ right: "10%", background: pants }} />
        </span>
      </div>
    </div>
  );
}
