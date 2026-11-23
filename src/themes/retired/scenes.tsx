"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "../shared";

/**
 * Painted, moving backdrops. Everything here is drawn in code, so there are no
 * photos or videos to load: wind through a grass field, a mountain dusk, and open sea.
 */
export type SceneId = "field" | "peaks" | "sea";

export function Scene({ id, className = "" }: { id: SceneId; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0, alive = true, visible = true, W = 0, H = 0;
    let painter: Painter | null = null;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);

    const size = () => {
      const r = cv.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      painter = PAINTERS[id](W, H);
      painter(ctx, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(cv);

    const start = performance.now();
    const loop = (t: number) => {
      if (!alive) return;
      if (visible && !document.hidden && painter) painter(ctx, (t - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    if (!reduced && id !== "peaks") raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, [id, reduced]);

  return <canvas ref={ref} aria-hidden className={`block size-full ${className}`} />;
}

type Painter = (ctx: CanvasRenderingContext2D, t: number) => void;

/** A tiny seeded random, so every visit paints the same scene. */
function rng(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

/** Billowing cumulus, painted once into its own canvas: many soft puffs, lit from above. */
function clouds(W: number, H: number, horizon: number, seed: number, height: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(W); c.height = Math.round(H);
  const x = c.getContext("2d")!;
  const r = rng(seed);
  const banks = Math.max(2, Math.round(W / 260));
  for (let b = 0; b < banks; b++) {
    const cx = (b + 0.2 + r() * 0.6) * (W / banks);
    const tall = height * (0.6 + r() * 0.6);
    const wide = (W / banks) * (0.5 + r() * 0.4);
    for (let i = 0; i < 70; i++) {
      const u = r() * 2 - 1;
      const px = cx + u * wide * 0.5;
      const top = horizon - tall * (1 - u * u) * (0.55 + r() * 0.45);
      const py = top + r() * (horizon - top);
      const rad = (8 + r() * 26) * (W / 400) * (1 - Math.abs(u) * 0.4);
      const g = x.createRadialGradient(px - rad * 0.3, py - rad * 0.4, rad * 0.1, px, py, rad);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.6, "rgba(246,248,251,.95)");
      g.addColorStop(1, "rgba(196,208,222,0)");
      x.fillStyle = g;
      x.beginPath(); x.arc(px, py, rad, 0, Math.PI * 2); x.fill();
    }
  }
  return c;
}

const PAINTERS: Record<SceneId, (W: number, H: number) => Painter> = {
  // Tall grass leaning in the wind, gusts rolling through it, clouds on the horizon.
  field(W, H) {
    const hz = H * 0.4;
    const sky = document.createElement("canvas");
    sky.width = Math.round(W); sky.height = Math.round(hz + 2);
    const s = sky.getContext("2d")!;
    const g = s.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, "#1f78bd"); g.addColorStop(1, "#5aa3d8");
    s.fillStyle = g; s.fillRect(0, 0, W, hz + 2);
    s.drawImage(clouds(W, hz + 2, hz + 2, 11, hz * 0.55), 0, 0);

    const r = rng(5);
    const n = Math.round(Math.min(2200, W * H / 160));
    const blades = Array.from({ length: n }, () => {
      const d = r() ** 1.6; // 0 far, 1 near
      return {
        x: r() * (W + 80) - 40, y: hz + d * (H - hz) + 30 * d, d,
        len: 10 + d * H * 0.34 * (0.6 + r() * 0.6), w: 0.6 + d * 4.2,
        hue: 84 + r() * 26, l: 34 + r() * 22 + (1 - d) * 8, ph: r() * Math.PI * 2,
      };
    }).sort((a, b) => a.y - b.y);

    return (ctx, t) => {
      ctx.drawImage(sky, 0, 0);
      const field = ctx.createLinearGradient(0, hz, 0, H);
      field.addColorStop(0, "#6f9a3e"); field.addColorStop(1, "#2f5a1c");
      ctx.fillStyle = field; ctx.fillRect(0, hz, W, H - hz);
      ctx.lineCap = "round";
      for (const b of blades) {
        // a gust is a wave moving left to right; it bends blades harder and lights them up
        const gust = 0.5 + 0.5 * Math.sin(b.x * 0.006 - t * 1.4 + b.d * 2);
        const sway = Math.sin(t * 2.2 + b.ph) * 0.08 + gust * 0.55 + 0.25;
        const tipX = b.x + b.len * sway * 1.1, tipY = b.y - b.len * (1 - sway * 0.45);
        ctx.strokeStyle = `hsl(${b.hue} 52% ${b.l + gust * 12}%)`;
        ctx.lineWidth = b.w;
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        ctx.quadraticCurveTo(b.x + b.len * sway * 0.2, b.y - b.len * 0.6, tipX, tipY);
        ctx.stroke();
      }
    };
  },

  // A tall peak at dusk, ranges behind it, a thin moon, and a dark meadow in front.
  peaks(W, H) {
    return (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      g.addColorStop(0, "#6f7fa6"); g.addColorStop(0.55, "#c79aa6"); g.addColorStop(1, "#f7b57d");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,240,.95)";
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.17, 3.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#7b8bb0"; ctx.beginPath(); ctx.arc(W * 0.5 + 1.6, H * 0.17 - 0.6, 3, 0, Math.PI * 2); ctx.fill();
      const range = (base: number, peaks: [number, number][], fill: string, snow?: string) => {
        ctx.beginPath(); ctx.moveTo(0, H);
        ctx.lineTo(0, base);
        for (const [px, py] of peaks) ctx.lineTo(px * W, py * H);
        ctx.lineTo(W, base); ctx.lineTo(W, H); ctx.closePath();
        ctx.fillStyle = fill; ctx.fill();
        if (snow) {
          ctx.save(); ctx.clip();
          const sg = ctx.createLinearGradient(0, 0, 0, H * 0.5);
          sg.addColorStop(0, snow); sg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H * 0.5);
          ctx.restore();
        }
      };
      range(H * 0.48, [[0.2, 0.46], [0.42, 0.44], [0.55, 0.47], [0.7, 0.41], [0.86, 0.45]], "#7184ad", "rgba(240,244,255,.55)");
      range(H * 0.5, [[0.05, 0.44], [0.12, 0.4], [0.2, 0.39], [0.27, 0.45], [0.36, 0.52]], "#6b6f86", "rgba(250,240,235,.6)");
      range(H * 0.6, [[0.3, 0.6], [0.55, 0.55], [0.75, 0.5], [1, 0.47]], "#2c4a34");
      // a fringe of conifers along the ridge
      const r = rng(9);
      ctx.fillStyle = "#18301f";
      for (let i = 0; i < 90; i++) {
        const x = r() * W, y = H * (0.56 + r() * 0.08), h = 6 + r() * 16;
        ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - h * 0.22, y); ctx.lineTo(x + h * 0.22, y); ctx.fill();
      }
      const m = ctx.createLinearGradient(0, H * 0.64, 0, H);
      m.addColorStop(0, "#2d4127"); m.addColorStop(1, "#141f12");
      ctx.fillStyle = m; ctx.fillRect(0, H * 0.64, W, H * 0.36);
      for (let i = 0; i < 260; i++) {
        const x = r() * W, y = H * (0.64 + r() * 0.36), s = 2 + r() * 7 * ((y / H - 0.6) * 3);
        ctx.fillStyle = `rgba(${40 + r() * 30},${70 + r() * 30},${36 + r() * 20},.6)`;
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
      }
    };
  },

  // Open water glittering under the sun, waves rolling in, big clouds overhead.
  sea(W, H) {
    const hz = H * 0.43;
    const sky = document.createElement("canvas");
    sky.width = Math.round(W); sky.height = Math.round(hz + 1);
    const s = sky.getContext("2d")!;
    const g = s.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, "#1c58b5"); g.addColorStop(1, "#8fb6e2");
    s.fillStyle = g; s.fillRect(0, 0, W, hz + 1);
    s.drawImage(clouds(W, hz + 1, hz * 0.62, 21, hz * 0.45), 0, 0);
    s.drawImage(clouds(W, hz + 1, hz + 1, 4, hz * 0.12), 0, 0);

    const r = rng(3);
    const glints = Array.from({ length: Math.round(W * 1.2) }, () => {
      const d = r() ** 1.4;
      const spread = 0.12 + d * 0.45;
      return { x: W / 2 + (r() * 2 - 1) * W * spread, d, ph: r() * 6.28, sp: 1.5 + r() * 4, sz: 0.6 + d * 2.6 };
    });
    const swells = Array.from({ length: 70 }, () => ({ d: r(), x: r() * W, len: 20 + r() * 90, ph: r() * 6.28 }));

    return (ctx, t) => {
      ctx.drawImage(sky, 0, 0);
      const w = ctx.createLinearGradient(0, hz, 0, H);
      w.addColorStop(0, "#2f5f9c"); w.addColorStop(0.3, "#163e78"); w.addColorStop(1, "#0b2556");
      ctx.fillStyle = w; ctx.fillRect(0, hz, W, H - hz);
      // the bright path under the sun
      const glow = ctx.createRadialGradient(W / 2, hz, 0, W / 2, hz, H * 0.6);
      glow.addColorStop(0, "rgba(255,255,255,.55)"); glow.addColorStop(0.25, "rgba(200,220,255,.18)"); glow.addColorStop(1, "rgba(200,220,255,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, hz, W, H - hz);
      // swells: dark troughs and pale crests, sliding toward you
      for (const s of swells) {
        const d = (s.d + t * 0.03) % 1;
        const y = hz + d * d * (H - hz);
        const k = 0.3 + d * 1.6;
        ctx.strokeStyle = `rgba(4,20,50,${0.25 + d * 0.3})`;
        ctx.lineWidth = 1 + d * 5;
        ctx.beginPath(); ctx.moveTo(s.x - s.len * k, y); ctx.quadraticCurveTo(s.x, y - 3 * k + Math.sin(t + s.ph) * 2, s.x + s.len * k, y); ctx.stroke();
        ctx.strokeStyle = `rgba(190,215,255,${0.12 + d * 0.2})`;
        ctx.lineWidth = 0.6 + d * 1.5;
        ctx.beginPath(); ctx.moveTo(s.x - s.len * k * 0.6, y - 2 - d * 3); ctx.lineTo(s.x + s.len * k * 0.4, y - 2 - d * 3); ctx.stroke();
      }
      // glitter: each point flashes on its own beat
      ctx.fillStyle = "#fff";
      for (const p of glints) {
        const a = Math.sin(t * p.sp + p.ph);
        if (a < 0.6) continue;
        const y = hz + p.d * p.d * (H - hz) + 2;
        ctx.globalAlpha = (a - 0.6) * 2.5;
        ctx.fillRect(p.x - p.sz, y - p.sz * 0.35, p.sz * 2, p.sz * 0.7);
      }
      ctx.globalAlpha = 1;
    };
  },
};
