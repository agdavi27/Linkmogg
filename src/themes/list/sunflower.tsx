"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Avatar, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { Particles, buzz, tick } from "../motion";
import type { ThemeProps } from "../types";

// Fibonacci seed spiral for the flower head.
const SEEDS = Array.from({ length: 150 }, (_, i) => {
  const a = i * 137.508 * (Math.PI / 180);
  const r = 47 * Math.sqrt(i / 150);
  return { x: +(50 + r * Math.cos(a)).toFixed(2), y: +(50 + r * Math.sin(a)).toFixed(2), s: +(0.9 + (i / 150) * 1.6).toFixed(2) };
});
const BLADES = Array.from({ length: 34 }, (_, i) => ({ x: (i / 33) * 100, h: 38 + ((i * 37) % 40), d: (i * 0.37) % 3, tilt: ((i * 53) % 18) - 9 }));

export default function Sunflower({ data, mode }: ThemeProps) {
  const [active, setActive] = useState<number | null>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const n = data.links.length;
  const total = Math.max(n, 5); // one petal per link, topped up so tiny pages still look like a flower
  const backTotal = Math.max(total, 12);
  const petalLen = n > 14 ? 35 : 38; // % of flower size
  const petalW = Math.min(21, 190 / total); // fewer links, wider petals
  const backW = Math.min(16, 170 / backTotal);
  const current = active !== null ? data.links[active] : null;

  const pick = (i: number) => {
    if (active === i) { openRef.current?.click(); return; }
    setActive(i);
    tick(1200 + (i % 6) * 180, 0.03, 0.03);
    buzz(6);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Sunflower" className="lm-sf-sky relative overflow-hidden text-[#2f2a12]">
      <div aria-hidden className="lm-sf-sun" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <span className="lm-sf-cloud" style={{ top: "9%", animationDuration: "70s", animationDelay: "-20s" }} />
        <span className="lm-sf-cloud lm-sf-cloud-sm" style={{ top: "22%", animationDuration: "95s", animationDelay: "-60s" }} />
        <span className="lm-sf-cloud" style={{ top: "38%", animationDuration: "120s", animationDelay: "-5s", opacity: 0.6 }} />
      </div>
      <Particles count={26} color={["#fff3b0", "#ffd75e", "#ffffff"]} size={[0.8, 2.2]} speed={[6, 18]} angle={-Math.PI / 2.4} wobble={1.2} twinkle glow />

      <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[520px] flex-1 flex-col items-center px-4 pt-[clamp(10px,3cqh,32px)]">
        <h1 className="lm-sf-in text-center font-display text-[26px] font-semibold tracking-[-0.02em]">{data.displayName || `@${data.username}`}</h1>
        {data.bio ? <p className="lm-sf-in mt-1 max-w-[34ch] text-center text-sm text-[#4f4a26] text-pretty" style={{ animationDelay: "80ms" }}>{data.bio}</p> : null}

        <div className="lm-sf-sway relative mt-[clamp(4px,2cqh,20px)]" style={{ width: "min(440px, 100%, calc(100cqh - 290px))" }}>
          <div className="relative aspect-square w-full" onMouseLeave={() => setActive(null)}>
            {/* back ring: decorative */}
            {Array.from({ length: backTotal }).map((_, i) => (
              <span key={`b${i}`} aria-hidden className="absolute left-1/2 top-1/2 origin-bottom"
                style={{ transform: `rotate(${(360 / backTotal) * (i + 0.5)}deg) translateY(-24%)`, height: `${petalLen * 0.9}%`, width: `${backW}%`, marginLeft: `-${backW / 2}%`, marginTop: `-${petalLen * 0.9}%` }}>
                <span className="lm-petal lm-petal-back lm-sf-unfurl block h-full w-full" style={{ animationDelay: `${120 + i * 25}ms` }} />
              </span>
            ))}
            {/* front ring: one petal per link */}
            {Array.from({ length: total }).map((_, i) => {
              const angle = (360 / total) * i;
              const link = i < n ? data.links[i] : null;
              const on = active === i;
              const wrap: CSSProperties = {
                transform: `rotate(${angle}deg) translateY(-26%) scale(${on ? 1.2 : active !== null ? 0.94 : 1})`,
                height: `${petalLen}%`, width: `${petalW}%`, marginLeft: `-${petalW / 2}%`, marginTop: `-${petalLen}%`,
              };
              // Names read outward from the middle; on the left half they're flipped so nothing is upside down.
              const flip = angle > 180;
              const inner = (
                <span className={`lm-petal lm-sf-unfurl relative block h-full w-full ${on ? "lm-petal-on" : ""}`} style={{ animationDelay: `${300 + i * 45}ms` }}>
                  <span className="lm-petal-flutter absolute inset-0" style={{ animationDelay: `${-i * 0.43}s` }} />
                  {link ? (
                    <span aria-hidden className={`lm-petal-label ${flip ? "is-flip" : ""}`}>
                      <span className="truncate">{link.title}</span>
                    </span>
                  ) : null}
                </span>
              );
              const cls = "lm-petal-slot absolute left-1/2 top-1/2 origin-bottom";
              if (!link) return <span key={`deco${i}`} aria-hidden className={`${cls} opacity-90`} style={wrap}>{inner}</span>;
              return (
                <button key={link.id} type="button" className={`${cls} rounded-[50%_50%_45%_45%/70%_70%_30%_30%] outline-none`}
                  style={{ ...wrap, zIndex: on ? 3 : 1 }}
                  aria-label={`${link.title}${on ? ", press again to open" : ""}`} aria-pressed={on}
                  onPointerEnter={(e) => { if (e.pointerType === "mouse") setActive(i); }} onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setActive(i); }} onClick={() => pick(i)}
                  onKeyDown={(e) => { if (e.key === "Escape") setActive(null); }}>
                  {inner}
                </button>
              );
            })}
            <div aria-hidden className="lm-seedhead absolute left-1/2 top-1/2 size-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full">
              <svg viewBox="0 0 100 100" className="lm-sf-seeds absolute inset-0 size-full">
                {SEEDS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} fill={i % 3 ? "#3f240a" : "#6b4313"} />)}
              </svg>
              <div className="absolute inset-[24%] grid place-items-center">
                <Avatar data={data} size={80} className="size-full! border-[3px] border-[#f6c544] bg-[#5a3510]! text-[#fde68a] shadow-[0_2px_8px_rgba(0,0,0,.45)]" />
              </div>
            </div>
          </div>
          <div aria-hidden className="relative mx-auto -mt-[6%] h-[clamp(24px,7cqh,80px)] w-3">
            <span className="lm-stem absolute inset-0 rounded-full" />
            <span className="lm-sf-leaf absolute left-full top-[38%]" />
            <span className="lm-sf-leaf lm-sf-leaf-l absolute right-full top-[58%]" />
          </div>
          <svg aria-hidden className="lm-sf-bee absolute left-0 top-0" width="30" height="24" viewBox="0 0 30 24">
            <ellipse className="lm-sf-wing" cx="13" cy="6" rx="6" ry="5" fill="rgba(255,255,255,.85)" stroke="rgba(60,60,60,.3)" />
            <ellipse cx="15" cy="14" rx="10" ry="7" fill="#f6c21c" />
            <path d="M12 7.5v13M17 7.5v13" stroke="#2a1d07" strokeWidth="2.6" />
            <circle cx="24" cy="13" r="3.4" fill="#2a1d07" />
          </svg>
        </div>

        <div className="relative z-10 mt-1 h-[74px] w-full max-w-[360px] shrink-0" aria-live="polite">
          {current ? (
            <div key={current.id} className="lm-pop flex items-center gap-3 rounded-2xl bg-white/85 p-3 shadow-[0_14px_30px_-18px_rgba(60,50,0,.7)] backdrop-blur">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{current.title}</p>
                <p className="truncate text-xs text-[#7a7140]">{hostOf(current.url)}</p>
              </div>
              <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
                className="shrink-0 rounded-full bg-[#2f2a12] px-4 py-2 text-sm font-semibold text-[#fde58a] transition-transform duration-150 ease-out active:scale-95">
                Open
              </a>
            </div>
          ) : (
            <p className="pt-4 text-center text-sm font-medium text-[#4f4a26]">{n ? "Tap a petal to open it" : "No links yet."}</p>
          )}
        </div>
        <SocialRow socials={data.socials} mode={mode} className="relative z-10 mt-auto shrink-0 pb-1" iconClass="text-[#2f2a12] hover:bg-white/50" />
      </div>

      <div aria-hidden className="lm-sf-meadow pointer-events-none absolute inset-x-0 bottom-0 h-28">
        {BLADES.map((b, i) => (
          <span key={i} className="lm-sf-blade absolute bottom-0" style={{ left: `${b.x}%`, height: b.h, animationDelay: `${-b.d}s`, ["--tilt" as string]: `${b.tilt}deg` } as CSSProperties} />
        ))}
      </div>
    </ThemeRoot>
  );
}
