"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

/**
 * A little 3D room, seen from above at an angle. Paintings on the walls are the links.
 * Floor coordinates: x runs along the back-right wall, y along the back-left wall, z is up.
 */
export default function Gallery({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const [spin, setSpin] = useState(0);
  const [drag, setDrag] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);

  const S = Math.max(160, Math.min(w * 0.64, h * 0.62, 540)); // floor size
  const H = S * 0.52; // wall height
  const rz = -40 + Math.max(-30, Math.min(30, spin + drag));

  const dragProps = useDragX((dx) => setDrag(dx / 6), (dx) => { setDrag(0); setSpin((s) => Math.max(-30, Math.min(30, s + dx / 6))); });

  // Paintings: most on the right wall, the rest on the left wall beside the window.
  const right = data.links.slice(0, Math.min(n, 7));
  const left = data.links.slice(right.length, right.length + 6);

  const pick = (l: ThemeLink) => {
    const i = data.links.indexOf(l);
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(900 + (i % 6) * 120, 0.02, 0.04);
    buzz(6);
  };
  const go = (d: number) => { if (n) { const i = sel === null ? 0 : (sel + d + n) % n; setSel(i); tick(900 + (i % 6) * 120, 0.02, 0.04); } };
  const current = sel !== null ? data.links[sel] : null;

  const painting = (l: ThemeLink, size: number, key: string) => {
    const i = data.links.indexOf(l);
    return (
      <button key={key} type="button" onClick={() => pick(l)} aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
        className={`lm-gr-art relative shrink-0 outline-none ${sel === i ? "is-on" : ""}`} style={{ width: size, height: size * (i % 3 === 1 ? 1.25 : 0.82) }}>
        <LinkArt link={l} className="lm-gr-canvas absolute inset-0" icon={Math.round(size * 0.22)} blur={0.4} />
      </button>
    );
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Gallery" className="lm-gr bg-[#e6e5e9] text-[#1d1a17]">
      <header className="relative z-20 shrink-0 px-5 pt-[clamp(12px,3cqh,28px)] text-center">
        <h1 className="font-display text-[clamp(20px,5.4cqw,30px)] font-semibold tracking-[-0.03em]">{data.displayName || `@${data.username}`}</h1>
        {data.bio ? <p className="mx-auto mt-0.5 line-clamp-1 max-w-[46ch] text-[12.5px] text-black/50">{data.bio}</p> : null}
      </header>

      <div ref={stage} {...dragProps} className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none active:cursor-grabbing"
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); }}>
        {w > 0 ? (
          <div className="lm-gr-scene absolute left-1/2 top-1/2" style={{ width: S, height: S, marginLeft: -S / 2, marginTop: -S * 0.22 }}>
            <div className={`lm-gr-room absolute inset-0 ${drag ? "" : "is-anim"}`} style={{ transform: `rotateX(58deg) rotateZ(${rz}deg)`, ["--rz" as string]: `${rz}deg` } as CSSProperties}>
              {/* floor and rug */}
              <div className="lm-gr-floor absolute inset-0" />
              <div className="lm-gr-rug absolute" style={{ left: S * 0.18, top: S * 0.34, width: S * 0.5, height: S * 0.42 }} />

              {/* back-left wall (along y = 0): windows and curtains */}
              <Wall className="lm-gr-wall-l" style={{ left: 0, top: 0, width: S, height: H, transformOrigin: "50% 0", transform: "rotateX(90deg)" }}>
                <div className="flex size-full items-center justify-start gap-[5%] px-[6%]" style={{ transform: "scaleY(-1)" }}>
                  <Window w={S * 0.24} h={H * 0.6} />
                  {left.length ? (
                    <div className="flex flex-1 flex-wrap content-center items-center justify-center gap-[6%]">{left.map((l) => painting(l, S * (left.length > 3 ? 0.1 : 0.14), `l${l.id}`))}</div>
                  ) : <Window w={S * 0.24} h={H * 0.6} />}
                </div>
              </Wall>

              {/* back-right wall (along x = S): the paintings */}
              <Wall className="lm-gr-wall-r" style={{ left: S, top: 0, width: H, height: S, transformOrigin: "0 50%", transform: "rotateY(-90deg)" }}>
                <div className="absolute left-1/2 top-1/2 flex flex-wrap content-center items-center justify-center gap-[4%]" style={{ width: S, height: H, marginLeft: -S / 2, marginTop: -H / 2, transform: "rotate(90deg) scaleX(-1)", padding: "6% 7%" }}>
                  {right.map((l, k) => painting(l, S * (right.length <= 1 ? 0.34 : right.length <= 3 ? 0.21 : right.length <= 5 ? 0.17 : 0.14) * (k === 0 && right.length > 1 ? 1.25 : 1), `r${l.id}`))}
                </div>
              </Wall>

              {/* furniture */}
              <Box x={S * 0.56} y={S * 0.3} w={S * 0.38} d={S * 0.4} h={S * 0.07} top="#6e5f62" side="#4c4246" />{/* bed base */}
              <Box x={S * 0.6} y={S * 0.32} w={S * 0.32} d={S * 0.36} h={S * 0.1} top="#f1efee" side="#cfcbca" />{/* mattress */}
              <Box x={S * 0.585} y={S * 0.46} w={S * 0.37} d={S * 0.28} h={S * 0.11} top="#7d6a67" side="#5a4b49" />{/* duvet */}
              <Box x={S * 0.62} y={S * 0.34} w={S * 0.12} d={S * 0.1} h={S * 0.13} top="#ffffff" side="#dcd9d6" />{/* pillow */}
              <Box x={S * 0.77} y={S * 0.34} w={S * 0.12} d={S * 0.1} h={S * 0.13} top="#ffffff" side="#dcd9d6" />
              <Box x={S * 0.94} y={S * 0.3} w={S * 0.03} d={S * 0.4} h={S * 0.17} top="#555064" side="#3e3a4a" />{/* headboard */}
              <Box x={S * 0.86} y={S * 0.14} w={S * 0.1} d={S * 0.1} h={S * 0.09} top="#3a3740" side="#2a2830" />{/* nightstands */}
              <Box x={S * 0.86} y={S * 0.76} w={S * 0.1} d={S * 0.1} h={S * 0.09} top="#3a3740" side="#2a2830" />
              <Lamp x={S * 0.91} y={S * 0.19} z={S * 0.09} s={S} />
              <Lamp x={S * 0.91} y={S * 0.81} z={S * 0.09} s={S} />
              <Box x={S * 0.04} y={S * 0.06} w={S * 0.13} d={S * 0.3} h={S * 0.12} top="#8a5a34" side="#6b4325" />{/* desk */}
              <Plant x={S * 0.74} y={S * 0.08} s={S} />
              <Plant x={S * 0.88} y={S * 0.92} s={S} />

              {/* trees peeking over the walls */}
              <Tree x={S * 0.22} y={-S * 0.06} s={S * 0.9} />
              <Tree x={S * 0.62} y={-S * 0.1} s={S * 1.15} />
              <Tree x={S * 1.06} y={S * 0.7} s={S * 0.9} />
            </div>
          </div>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 bottom-6" /> : null}
      </div>

      <div className="relative z-20 mx-auto w-full max-w-[460px] shrink-0 px-5 pb-1" aria-live="polite">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Previous painting" onClick={() => go(-1)} className="lm-gr-arrow">‹</button>
          {current ? (
            <a ref={openRef} href={current.url} key={current.id} {...linkTarget(mode, current.url)}
              className="lm-pop flex min-w-0 flex-1 flex-col items-center rounded-2xl bg-white px-4 py-2 text-center shadow-[0_6px_20px_-10px_rgba(0,0,0,.3)] transition-transform duration-150 active:scale-[.98]">
              <span className="max-w-full truncate text-[14px] font-semibold">{current.title} ↗</span>
              <span className="max-w-full truncate text-[11px] text-black/45">{hostOf(current.url)}</span>
            </a>
          ) : (
            <p className="flex-1 text-center text-[12.5px] text-black/50">{n ? "Tap a painting. Drag to turn the room." : ""}</p>
          )}
          <button type="button" aria-label="Next painting" onClick={() => go(1)} className="lm-gr-arrow">›</button>
        </div>
        <SocialRow socials={data.socials} mode={mode} className="mt-1" iconClass="size-9! text-black/60 hover:bg-black/5" size={18} />
      </div>
    </ThemeRoot>
  );
}

function Wall({ className, style, children }: { className: string; style: CSSProperties; children: ReactNode }) {
  return <div className={`lm-gr-wall absolute ${className}`} style={style}>{children}</div>;
}

function Window({ w, h }: { w: number; h: number }) {
  return (
    <div className="relative shrink-0" style={{ width: w * 1.35, height: h * 1.05 }}>
      <span className="lm-gr-curtain absolute left-0 top-0 h-full" style={{ width: w * 0.16 }} />
      <span className="lm-gr-window absolute top-[3%]" style={{ left: w * 0.17, width: w, height: h }} />
      <span className="lm-gr-curtain absolute right-0 top-0 h-full" style={{ width: w * 0.16 }} />
    </div>
  );
}

/** A box sitting on the floor: top face plus the two faces you can see. */
function Box({ x, y, w, d, h, top, side }: { x: number; y: number; w: number; d: number; h: number; top: string; side: string }) {
  return (
    <div className="lm-gr-box absolute" style={{ left: x, top: y, width: w, height: d }}>
      <span className="absolute inset-0" style={{ background: top, transform: `translateZ(${h}px)` }} />
      <span className="absolute left-0 top-full" style={{ width: w, height: h, background: side, transformOrigin: "0 0", transform: "rotateX(90deg)", filter: "brightness(.92)" }} />
      <span className="absolute left-0 top-0" style={{ width: h, height: d, background: side, transformOrigin: "0 0", transform: "rotateY(-90deg)", filter: "brightness(.8)" }} />
    </div>
  );
}

/** Flat sprites (lamps, plants, trees) stand up and turn to face the viewer. */
function Sprite({ x, y, z = 0, w, h, children, className = "" }: { x: number; y: number; z?: number; w: number; h: number; children?: ReactNode; className?: string }) {
  return (
    <div className="lm-gr-sprite absolute" style={{ left: x, top: y, width: 0, height: 0, transform: `translateZ(${z}px)` }}>
      <div className={`lm-gr-face absolute ${className}`} style={{ width: w, height: h, left: -w / 2, top: -h }}>{children}</div>
    </div>
  );
}

function Lamp({ x, y, z, s }: { x: number; y: number; z: number; s: number }) {
  return (
    <Sprite x={x} y={y} z={z} w={s * 0.06} h={s * 0.13}>
      <span className="lm-gr-glow absolute left-1/2 top-[10%] size-[300%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <span className="absolute inset-x-[8%] top-0 h-[38%] rounded-[3px] bg-[#3b2230]" style={{ boxShadow: "inset 0 -4px 6px rgba(255,220,180,.35)" }} />
      <span className="absolute bottom-0 left-1/2 h-[62%] w-[34%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_40%_30%,#4a2c3a,#24141c)]" />
    </Sprite>
  );
}

function Plant({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <Sprite x={x} y={y} w={s * 0.14} h={s * 0.22} className="lm-gr-plant">
      {[-38, -16, 6, 26, 44, -60, 64].map((r, i) => (
        <span key={i} className="absolute bottom-[26%] left-1/2 origin-bottom rounded-[50%_50%_50%_50%/80%_80%_20%_20%]"
          style={{ width: "34%", height: `${62 - Math.abs(r) / 3}%`, marginLeft: "-17%", rotate: `${r}deg`, background: i % 2 ? "#1f8a3c" : "#2fa64c" }} />
      ))}
      <span className="absolute bottom-0 left-1/2 h-[28%] w-[46%] -translate-x-1/2 rounded-b-[30%] bg-[linear-gradient(90deg,#4b4448,#6a6266,#3d373a)]" />
    </Sprite>
  );
}

// Low-poly leaves: a cloud of small triangles in autumn oranges.
const SHARDS = Array.from({ length: 46 }, (_, i) => {
  const k = hash(`leaf${i}`);
  const a = ((k % 360) * Math.PI) / 180, r = ((k >>> 9) % 100) / 100;
  return { x: 50 + Math.cos(a) * r * 40 - 8, y: 48 + Math.sin(a) * r * 40 - 8, s: 10 + ((k >>> 4) % 12), r: (k >>> 3) % 360, c: ["#c9431f", "#e2582a", "#a9341a", "#f07a3c", "#d14b22"][(k >>> 6) % 5] };
});

function Tree({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <Sprite x={x} y={y} w={s * 0.34} h={s * 0.74} className="lm-gr-tree">
      <span className="absolute bottom-0 left-1/2 h-[55%] w-[3%] -translate-x-1/2 bg-[#cfc7bf]" />
      <span className="lm-gr-leaves absolute inset-x-0 top-0 h-[62%]">
        {SHARDS.map((d, i) => (
          <i key={i} className="absolute" style={{ left: `${d.x}%`, top: `${d.y}%`, width: `${d.s}%`, height: `${d.s * 0.9}%`, background: d.c, rotate: `${d.r}deg` }} />
        ))}
      </span>
    </Sprite>
  );
}
