"use client";

import { useEffect, useRef, type RefObject } from "react";

/** Strong ease-out used across every theme (Emil Kowalski's UI curve). */
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Pointer + device-tilt parallax. Writes --px / --py (each -1..1, smoothed) onto the element,
 * so CSS can move layers by different amounts. No-op under reduced motion.
 */
export function useParallax(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0, running = false;
    const loop = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty("--px", x.toFixed(4));
      el.style.setProperty("--py", y.toFixed(4));
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(loop);
      else running = false;
    };
    const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = el.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      kick();
    };
    const onLeave = () => { tx = 0; ty = 0; kick(); };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = Math.max(-1, Math.min(1, e.gamma / 25));
      ty = Math.max(-1, Math.min(1, (e.beta - 40) / 25));
      kick();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [ref]);
}

let ctx: AudioContext | null = null;
let soundOn = true;
export function setThemeSound(on: boolean) { soundOn = on; }

/** A tiny synthesized click. Only plays after the visitor has interacted (browsers require it). */
export function tick(freq = 1800, dur = 0.012, gain = 0.06) {
  if (!soundOn || typeof window === "undefined" || reduced()) return;
  try {
    ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.01);
  } catch { /* audio unavailable */ }
}

/** Short haptic tap on phones that support it. */
export function buzz(ms: number | number[] = 8) {
  try { navigator.vibrate?.(ms); } catch { /* unsupported */ }
}

type ParticleOpts = {
  count: number;
  color: string | string[];
  size: [number, number];
  /** px per second */
  speed: [number, number];
  /** direction in radians (0 = right, PI/2 = down) */
  angle: number;
  spread?: number;
  wobble?: number;
  twinkle?: boolean;
  glow?: boolean;
};

/** Lightweight canvas particles (pollen, dust, sparks). Pauses offscreen; absent under reduced motion. */
export function Particles({ className = "", ...o }: ParticleOpts & { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const opts = useRef(o);
  useEffect(() => {
    const c = ref.current;
    if (!c || reduced()) return;
    const g = c.getContext("2d");
    if (!g) return;
    const { count, color, size, speed, angle, spread = 0.6, wobble = 0.6, twinkle, glow } = opts.current;
    const colors = Array.isArray(color) ? color : [color];
    let w = 0, h = 0, raf = 0, last = performance.now(), visible = true;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: rnd(size[0], size[1]),
      v: rnd(speed[0], speed[1]), a: angle + rnd(-spread, spread), ph: Math.random() * 6.28,
      c: colors[Math.floor(Math.random() * colors.length)],
    }));
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      g.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.ph += dt * 1.6;
        p.x += (Math.cos(p.a) * p.v + Math.sin(p.ph) * wobble * 8) * dt;
        p.y += (Math.sin(p.a) * p.v + Math.cos(p.ph * 0.7) * wobble * 6) * dt;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        g.globalAlpha = twinkle ? 0.35 + 0.65 * Math.abs(Math.sin(p.ph)) : 0.8;
        g.fillStyle = p.c;
        if (glow) { g.shadowColor = p.c; g.shadowBlur = p.r * 4; }
        g.beginPath();
        g.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        g.fill();
      }
      if (visible) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(([e]) => {
      const v = e.isIntersecting && !document.hidden;
      if (v && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      visible = v;
    });
    io.observe(c);
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}

export type DrawFn = (g: CanvasRenderingContext2D, w: number, h: number, t: number, dt: number) => void;

/**
 * A full-size canvas that calls draw() every frame while it's on screen. Under reduced motion it
 * draws one still frame (and redraws on resize) instead of animating.
 */
export function LiveCanvas({ draw, className = "" }: { draw: RefObject<DrawFn>; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const g = c?.getContext("2d");
    if (!c || !g) return;
    const still = reduced();
    let w = 0, h = 0, raf = 0, visible = true;
    const start = performance.now();
    let last = start;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const paint = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      g.clearRect(0, 0, w, h);
      draw.current(g, w, h, (now - start) / 1000, dt);
    };
    const frame = (now: number) => { paint(now); if (visible) raf = requestAnimationFrame(frame); };
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (still) paint(performance.now());
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(c);
    if (still) return () => ro.disconnect();
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(([e]) => {
      const v = e.isIntersecting && !document.hidden;
      if (v && !visible) { visible = true; last = performance.now(); raf = requestAnimationFrame(frame); }
      visible = v;
    });
    io.observe(c);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, [draw]);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
