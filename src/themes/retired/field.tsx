"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LiveCanvas, type DrawFn } from "../motion";
import type { ThemeProps } from "../types";

const INK = "20,20,20";
const HOT = "255,77,31";

type Ripple = { x: number; y: number; t: number };

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const f = () => setNow(new Date());
    f();
    const id = setInterval(f, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export default function Field({ data, mode }: ThemeProps) {
  const stage = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: -999, y: -999, on: 0 });
  const ripples = useRef<Ripple[]>([]);
  const lastT = useRef(0);
  const now = useClock();
  const n = data.links.length;
  const cols = n > 14 ? 2 : 1;
  const rows = Math.max(1, Math.ceil(n / cols));
  // Type size follows the space: fewer links, bigger words. Always fits the screen.
  const fontSize = `clamp(15px, min(${cols === 1 ? 7 : 3.6}cqw, calc((54cqh - ${rows * 14}px) / ${rows * 1.1})), 54px)`;

  const draw = useRef<DrawFn>((g, w, h, t) => {
    const gap = w < 520 ? 17 : 21;
    const p = pointer.current;
    p.on += ((p.x > -999 ? 1 : 0) - p.on) * 0.08;
    const clock = t;
    lastT.current = t;
    ripples.current = ripples.current.filter((r) => clock - r.t < 1.8);
    const rs = ripples.current;
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const wave = Math.sin(x * 0.017 + t * 0.55) + Math.sin(y * 0.021 - t * 0.42) + Math.sin((x + y) * 0.009 + t * 0.27);
        let r = 0.55 + ((wave + 3) / 6) * 1.25;
        let heat = 0;
        if (p.on > 0.01) {
          const d = Math.hypot(x - p.x, y - p.y);
          if (d < 110) { const k = (1 - d / 110) * p.on; r += k * 2.6; heat = Math.max(heat, k); }
        }
        for (const rp of rs) {
          const age = clock - rp.t;
          const d = Math.hypot(x - rp.x, y - rp.y);
          const k = Math.exp(-((d - age * 320) ** 2) / 900) * (1 - age / 1.8);
          if (k > 0.02) { r += k * 3.2; heat = Math.max(heat, k); }
        }
        g.fillStyle = heat > 0.25 ? `rgba(${HOT},${0.55 + heat * 0.45})` : `rgba(${INK},${0.16 + (r / 4) * 0.3})`;
        g.beginPath();
        g.arc(x, y, Math.min(r, 4.6), 0, 6.283);
        g.fill();
      }
    }
  });

  const local = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const ripple = (x: number, y: number) => {
    ripples.current.push({ x, y, t: lastT.current });
    if (ripples.current.length > 6) ripples.current.shift();
  };

  const clock = now ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--";

  return (
    <ThemeRoot data={data} mode={mode} label="Field" className="lm-fd bg-[#ece9e2] text-[#141414]">
      <div ref={stage} className="relative flex min-h-0 flex-1 flex-col"
        onPointerMove={(e) => { if (e.pointerType === "mouse") Object.assign(pointer.current, local(e)); }}
        onPointerLeave={() => { pointer.current.x = -999; pointer.current.y = -999; }}
        onPointerDown={(e) => { const p = local(e); ripple(p.x, p.y); }}>
        <LiveCanvas draw={draw} />
        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col px-5 pb-3 pt-4 @min-[640px]:px-10 @min-[640px]:pt-8">
          <div className="lm-fd-in flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#141414]/60">
            <span className="flex items-center gap-1.5"><i aria-hidden className="lm-fd-live" />{String(n).padStart(2, "0")} links</span>
            <span className="tabular" suppressHydrationWarning>{clock}</span>
          </div>

          <header className="mt-[clamp(12px,4cqh,48px)] flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="lm-fd-name font-display font-bold leading-[0.86] tracking-[-0.045em] text-balance" style={{ fontSize: "clamp(38px, min(13cqw, 11cqh), 112px)" }}>
                <span className="lm-fd-mask"><span>{data.displayName || `@${data.username}`}</span></span>
              </h1>
              {data.bio ? <p className="lm-fd-in mt-3 line-clamp-2 max-w-[42ch] text-[13px] leading-snug text-[#141414]/70 text-pretty" style={{ animationDelay: "200ms" }}>{data.bio}</p> : null}
            </div>
            <Avatar data={data} size={52} className="lm-fd-in mb-1 grayscale bg-[#141414]! text-[#ece9e2]" />
          </header>

          <nav aria-label="Links" className="mt-[clamp(10px,3.5cqh,40px)] flex min-h-0 flex-1 flex-col justify-end">
            <ul className="grid min-h-0 border-b border-[#141414]/80" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, columnGap: 20 }}>
              {data.links.map((l, i) => (
                <li key={l.id} className="min-w-0 border-t border-[#141414]/80">
                  <a href={l.url} {...linkTarget(mode, l.url)}
                    onPointerEnter={(e) => { if (e.pointerType === "mouse") { const p = local(e); ripple(p.x, p.y); } }}
                    className="lm-fd-row group relative flex items-baseline gap-3 py-[clamp(3px,0.9cqh,10px)] outline-none">
                    <span aria-hidden className="lm-fd-fill" />
                    <span className="relative w-6 shrink-0 font-mono text-[10px] text-[#141414]/55 group-hover:text-[#ece9e2]/70 group-focus-visible:text-[#ece9e2]/70">{String(i + 1).padStart(2, "0")}</span>
                    <span className="lm-fd-mask relative min-w-0 flex-1">
                      <span className="block truncate font-display font-semibold leading-[1.15] tracking-[-0.03em]" style={{ fontSize, animationDelay: `${260 + i * 50}ms` }}>{l.title}</span>
                    </span>
                    {cols === 1 ? <span className="relative hidden shrink-0 font-mono text-[10.5px] text-[#141414]/55 @min-[460px]:block group-hover:text-[#ece9e2]/70">{hostOf(l.url)}</span> : null}
                    <span aria-hidden className="lm-fd-arrow relative shrink-0 text-[#ff4d1f]">↗</span>
                  </a>
                </li>
              ))}
            </ul>
            {n === 0 ? <Empty className="mt-6" /> : null}
          </nav>
          <SocialRow socials={data.socials} mode={mode} className="mt-2 justify-start! -ml-2.5" iconClass="text-[#141414] hover:bg-[#141414]/8" size={20} />
        </div>
      </div>
    </ThemeRoot>
  );
}
