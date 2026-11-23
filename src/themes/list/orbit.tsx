"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LiveCanvas, buzz, tick, type DrawFn } from "../motion";
import type { ThemeProps } from "../types";

const HUES = ["124,247,255", "176,140,255", "255,196,120", "140,255,190", "255,140,190"];

/** Split n links over 1-3 rings, inner rings holding fewer. */
function ringsFor(n: number) {
  const count = n <= 4 ? 1 : n <= 10 ? 2 : 3;
  const weights = [[1], [2, 3], [2, 3, 4]][count - 1];
  const total = weights.reduce((a, b) => a + b, 0);
  const sizes = weights.map((w) => Math.floor((n * w) / total));
  for (let i = sizes.length - 1; sizes.reduce((a, b) => a + b, 0) < n; i = (i - 1 + sizes.length) % sizes.length) sizes[i]++;
  const radii = [[0.9], [0.62, 1], [0.5, 0.76, 1]][count - 1];
  const out: { ring: number; slot: number; of: number; r: number }[] = [];
  sizes.forEach((s, ring) => { for (let slot = 0; slot < s; slot++) out.push({ ring, slot, of: s, r: radii[ring] }); });
  return out;
}

export default function Orbit({ data, mode }: ThemeProps) {
  const [sel, setSel] = useState<number | null>(null);
  const sats = useRef<(HTMLButtonElement | null)[]>([]);
  const openRef = useRef<HTMLAnchorElement>(null);
  const sim = useRef({ speed: 1, target: 1, angle: [0, 0, 0], sel: null as number | null, stars: [] as { x: number; y: number; r: number; p: number }[], sw: 0, sh: 0 });
  const n = data.links.length;
  const layout = ringsFor(n);
  const layoutRef = useRef(layout);
  useEffect(() => { layoutRef.current = layout; });
  useEffect(() => { sim.current.sel = sel; sim.current.target = sel !== null ? 0 : 1; }, [sel]);

  const draw = useRef<DrawFn>((g, w, h, t, dt) => {
    const s = sim.current;
    const L = layoutRef.current;
    if (s.sw !== w || s.sh !== h) {
      s.sw = w; s.sh = h;
      s.stars = Array.from({ length: Math.round((w * h) / 2600) }, (_, i) => {
        const k = hash(`st${i}`);
        return { x: (k % 1000) / 1000 * w, y: ((k >> 10) % 1000) / 1000 * h, r: 0.3 + ((k >> 20) % 10) / 10, p: (k % 628) / 100 };
      });
    }
    s.speed += (s.target - s.speed) * Math.min(1, dt * 3);
    for (let k = 0; k < 3; k++) s.angle[k] += dt * s.speed * (k % 2 ? -1 : 1) * (0.16 - k * 0.03);

    for (const st of s.stars) {
      g.fillStyle = `rgba(220,240,255,${0.25 + 0.55 * Math.abs(Math.sin(t * 0.8 + st.p))})`;
      g.fillRect(st.x, st.y, st.r, st.r);
    }

    const cx = w / 2, cy = h / 2;
    // Wide screens get a flat, tilted orbit; tall phones stretch it upward so it fills the screen.
    const RX = Math.max(60, Math.min(w / 2 - 52, 340));
    const RY = Math.max(40, Math.min(w > h ? RX * 0.62 : RX * 1.45, h / 2 - 30));
    const rings = new Set(L.map((p) => p.r));
    rings.forEach((r) => {
      g.strokeStyle = "rgba(124,247,255,.14)";
      g.lineWidth = 1;
      g.setLineDash([2, 5]);
      g.beginPath();
      g.ellipse(cx, cy, RX * r, RY * r, 0, 0, Math.PI * 2);
      g.stroke();
      g.setLineDash([]);
    });

    L.forEach((p, i) => {
      const dir = p.ring % 2 ? -1 : 1;
      const a = s.angle[p.ring] + (p.slot / p.of) * Math.PI * 2 + p.ring * 0.6;
      const x = cx + Math.cos(a) * RX * p.r;
      const y = cy + Math.sin(a) * RY * p.r;
      const depth = (Math.sin(a) + 1) / 2; // 0 back, 1 front
      const hue = HUES[i % HUES.length];
      // comet trail
      for (let j = 1; j <= 14; j++) {
        const b = a - dir * j * 0.045;
        g.fillStyle = `rgba(${hue},${(0.5 - j * 0.033) * (0.4 + depth * 0.6)})`;
        g.beginPath();
        g.arc(cx + Math.cos(b) * RX * p.r, cy + Math.sin(b) * RY * p.r, Math.max(0.4, 2.2 - j * 0.13), 0, 6.283);
        g.fill();
      }
      if (s.sel === i) {
        const grad = g.createLinearGradient(cx, cy, x, y);
        grad.addColorStop(0, `rgba(${hue},0)`);
        grad.addColorStop(1, `rgba(${hue},.9)`);
        g.strokeStyle = grad;
        g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke();
        g.strokeStyle = `rgba(${hue},${0.5 + 0.5 * Math.sin(t * 6)})`;
        g.beginPath(); g.arc(x, y, 13 + Math.sin(t * 4) * 2, 0, 6.283); g.stroke();
      }
      const el = sats.current[i];
      if (el) {
        const front = depth > 0.5;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -6px) scale(${(0.78 + depth * 0.3).toFixed(3)})`;
        el.style.zIndex = String(front ? 20 + Math.round(depth * 10) : 5 + Math.round(depth * 10));
        el.style.opacity = s.sel === null || s.sel === i ? (0.5 + depth * 0.5).toFixed(2) : "0.35";
      }
    });
  });

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(1600 + (i % 6) * 120, 0.02, 0.03);
    buzz(8);
  };
  const current = sel !== null ? data.links[sel] : null;

  return (
    <ThemeRoot data={data} mode={mode} label="Orbit" badgeTone="light" className="lm-ob bg-[#04050a] text-[#e6f6ff]">
      <div aria-hidden className="lm-ob-nebula" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <header className="lm-ob-in shrink-0 px-5 pt-[clamp(14px,4cqh,40px)] text-center">
          <h1 className="text-[clamp(20px,6cqw,30px)] font-semibold tracking-[-0.02em]">{data.displayName || `@${data.username}`}</h1>
          {data.bio ? <p className="mx-auto mt-1 line-clamp-2 max-w-[40ch] text-[12.5px] leading-snug text-[#e6f6ff]/55">{data.bio}</p> : null}
        </header>

        <div className="relative min-h-0 flex-1" onKeyDown={(e) => { if (e.key === "Escape") setSel(null); }}
          onPointerEnter={(e) => { if (e.pointerType === "mouse" && sel === null) sim.current.target = 0.25; }}
          onPointerLeave={() => { if (sel === null) sim.current.target = 1; }}>
          <LiveCanvas draw={draw} />
          <div aria-hidden className="lm-ob-core absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="lm-ob-pulse" /><span className="lm-ob-pulse" style={{ animationDelay: "-1.6s" }} />
            <span className="lm-ob-ring" />
            <Avatar data={data} size={72} className="relative border border-[#7cf7ff]/40 bg-[#0b1626]! text-[#7cf7ff] shadow-[0_0_40px_rgba(124,247,255,.35)]" />
          </div>
          <ul aria-label="Links">
            {data.links.map((l, i) => (
              <li key={l.id}>
                <button ref={(el) => { sats.current[i] = el; }} type="button" onClick={() => pick(i)} aria-pressed={sel === i}
                  aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
                  onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setSel(i); }}
                  className={`lm-ob-sat absolute left-0 top-0 flex flex-col items-center outline-none ${sel === i ? "is-on" : ""}`}
                  style={{ ["--c" as string]: HUES[i % HUES.length] }}>
                  <span aria-hidden className="lm-ob-dot" />
                  <span className="lm-ob-label mt-1.5 max-w-[min(150px,31cqw)] truncate rounded-full px-2 py-[3px] font-mono text-[clamp(10px,calc(6px+0.6cqw),12.5px)] leading-none">{l.title}</span>
                </button>
              </li>
            ))}
          </ul>
          {n === 0 ? <Empty className="absolute inset-x-0 bottom-6" /> : null}
        </div>

        <div className="shrink-0 px-4 pb-1" aria-live="polite">
          <div className="mx-auto h-[68px] w-full max-w-[380px]">
            {current ? (
              <div key={current.id} className="lm-pop lm-ob-hud flex h-full items-center gap-3 rounded-2xl px-4">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-[#7cf7ff]/70">Locked · {String(sel! + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}</p>
                  <p className="truncate text-[15px] font-semibold">{current.title}</p>
                  <p className="truncate font-mono text-[10.5px] text-[#e6f6ff]/45">{hostOf(current.url)}</p>
                </div>
                <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
                  className="shrink-0 rounded-full bg-[#7cf7ff] px-4 py-2 text-sm font-semibold text-[#04050a] shadow-[0_0_24px_rgba(124,247,255,.45)] transition-transform duration-150 ease-out active:scale-95">
                  Open
                </a>
              </div>
            ) : (
              <p className="pt-5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-[#e6f6ff]/45">{n ? "Tap a satellite" : ""}</p>
            )}
          </div>
          <SocialRow socials={data.socials} mode={mode} className="mt-1" iconClass="size-9! text-[#e6f6ff]/75 hover:bg-white/10" size={18} />
        </div>
      </div>
    </ThemeRoot>
  );
}
