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

  const S = Math.max(170, Math.min(w * (w < 600 ? 0.74 : 0.8), h * 0.64, 640)); // floor size
  const H = S * 0.9; // wall height: tall, so the paintings can be big
  const rz = -45 + Math.max(-28, Math.min(28, spin + drag));
  const dragProps = useDragX((dx) => setDrag(dx / 6), (dx) => { setDrag(0); setSpin((s) => Math.max(-28, Math.min(28, s + dx / 6))); });

  // Split the links between the two walls, and size paintings so they stay big.
  const leftLinks = data.links.slice(0, Math.ceil(n / 2));
  const rightLinks = data.links.slice(Math.ceil(n / 2));
  const sizeFor = (c: number) => {
    const rows = c > 2 ? 2 : 1;
    const cols = Math.ceil(c / rows);
    return Math.min((S * 0.97) / cols - S * 0.022, (H * 0.88) / rows - H * 0.075);
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
      <div className="flex size-full flex-wrap content-center items-center justify-center gap-x-[2.2%] gap-y-[7.5%] px-[1.5%] pb-[6%] pt-[5%]">
        {links.map((l) => {
          const i = data.links.indexOf(l);
          return (
            <button key={l.id} type="button" onClick={() => pick(i)} aria-label={`View ${l.title}`}
              className={`lm-gm-art relative shrink-0 outline-none ${sel === i ? "is-on" : ""}`} style={{ width: size, height: size * 0.82 }}>
              <span aria-hidden className="lm-gm-spot" />
              <LinkArt link={l} className="absolute inset-[5%]" icon={Math.round(size * 0.18)} blur={0} mark={size > 46} />
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

              {/* benches either side */}
              <Box x={S * 0.2} y={S * 0.68} w={S * 0.2} d={S * 0.07} h={S * 0.04} top="#3b3633" side="#28231f" />
              <Box x={S * 0.68} y={S * 0.24} w={S * 0.07} d={S * 0.2} h={S * 0.04} top="#3b3633" side="#28231f" />
              <Sprite x={S * 0.9} y={S * 0.9} w={S * 0.1} h={S * 0.18}><Fern /></Sprite>

              {/* visitors */}
              <Visitors s={S} rz={rz} />
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

const PEOPLE = [
  { shirt: "#d9553b", pants: "#2b2f3a", hair: "#2a1d16", skin: "#e2b293" },
  { shirt: "#3d6fd6", pants: "#3a3530", hair: "#c9a36b", skin: "#c98f6b" },
];

/**
 * Visitors wander from painting to painting: they pick a spot in front of a wall, walk there at
 * an easy pace, face the way they're going, and stand looking for a few seconds.
 */
function Visitors({ s, rz }: { s: number; rz: number }) {
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const rzRef = useRef(rz);
  useEffect(() => { rzRef.current = rz; }, [rz]);

  useEffect(() => {
    const spot = (k: number) => {
      const r = Math.random();
      // in front of the left wall (y small) or the right wall (x large), clear of the statue
      return k % 2 === 0
        ? { x: s * (0.12 + r * 0.7), y: s * (0.13 + Math.random() * 0.06) }
        : { x: s * (0.81 + Math.random() * 0.06), y: s * (0.14 + r * 0.7) };
    };
    const people = PEOPLE.map((_, k) => ({ ...spot(k), t: spot(k + (k % 2 ? 0 : 1)), wait: 1 + k * 1.5, v: 0, flip: false, side: k }));
    const place = () => people.forEach((p, k) => {
      const el = els.current[k];
      if (!el) return;
      el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      el.dataset.walk = p.v > 0.02 * s ? "1" : "0";
      el.dataset.flip = p.flip ? "1" : "0";
    });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { place(); return; }
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      for (const p of people) {
        if (p.wait > 0) { p.wait -= dt; p.v = 0; continue; }
        const dx = p.t.x - p.x, dy = p.t.y - p.y, d = Math.hypot(dx, dy);
        if (d < 2) {
          p.wait = 2.5 + Math.random() * 4;
          p.side = Math.random() < 0.7 ? p.side : p.side + 1; // mostly stay on the same wall
          p.t = spot(p.side);
          continue;
        }
        const top = s * 0.09; // walking speed per second
        p.v = Math.min(top, p.v + top * dt * 2, d * 1.5); // ease in and slow down on arrival
        p.x += (dx / d) * p.v * dt;
        p.y += (dy / d) * p.v * dt;
        const a = (rzRef.current * Math.PI) / 180;
        const screenX = Math.cos(a) * dx - Math.sin(a) * dy;
        if (Math.abs(screenX) > 1) p.flip = screenX < 0;
      }
      place();
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [s]);

  return (
    <>
      {PEOPLE.map((c, k) => (
        <div key={k} ref={(el) => { els.current[k] = el; }} className="lm-gm-walk absolute left-0 top-0" data-walk="0">
          <div className="lm-gm-face absolute" style={{ width: s * 0.065, height: s * 0.21, left: -s * 0.0325, top: -s * 0.21 }}>
            <span className="lm-gm-person absolute inset-0">
              <span className="lm-gm-arm absolute left-[-6%] top-[20%] h-[34%] w-[22%] rounded-full" style={{ background: c.shirt, filter: "brightness(.85)" }} />
              <span className="lm-gm-arm is-b absolute right-[-6%] top-[20%] h-[34%] w-[22%] rounded-full" style={{ background: c.shirt, filter: "brightness(.85)" }} />
              <span className="lm-gm-leg absolute top-[55%] h-[45%] w-[36%] rounded-b-[3px]" style={{ left: "12%", background: c.pants }} />
              <span className="lm-gm-leg is-b absolute top-[55%] h-[45%] w-[36%] rounded-b-[3px]" style={{ right: "12%", background: c.pants }} />
              <span className="absolute left-1/2 top-[17%] h-[41%] w-[92%] -translate-x-1/2 rounded-[42%_42%_12%_12%]" style={{ background: c.shirt }} />
              <span className="lm-gm-head absolute left-1/2 top-0 h-[17%] w-[60%] -translate-x-1/2 rounded-full" style={{ background: c.skin }}>
                <span className="absolute inset-x-[-4%] top-[-8%] h-[52%] rounded-t-full" style={{ background: c.hair }} />
              </span>
            </span>
          </div>
        </div>
      ))}
    </>
  );
}

