"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useSize } from "../motion";
import type { ThemeProps } from "../types";

// Rings of cards: [radius as a share of the stage, how many cards, seconds per turn, direction].
const RINGS: [number, number, number, 1 | -1][] = [[0.27, 4, 90, 1], [0.44, 8, 140, -1], [0.62, 12, 200, 1]];

/** Your links as cards slowly circling your name. Tap one and its title takes the middle. */
export default function World({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;
  const m = Math.min(w, h * 1.1);
  const card = Math.max(52, Math.min(m * 0.17, 120));
  const current = sel !== null ? data.links[sel] : null;

  const pick = (i: number) => { setSel(i); tick(1200 + (i % 5) * 140, 0.015, 0.04); buzz(5); };
  let slot = 0; // which link each card shows, dealt round the rings in order

  return (
    <ThemeRoot data={data} mode={mode} label="World" className="lm-wo bg-[#f6f3ec] text-[#141414]">
      <div ref={stage} className="lm-wo-stage relative min-h-0 flex-1 overflow-hidden">
        {w > 0 && n > 0 ? RINGS.map(([r, count, secs, dir], ri) => (
          <div key={ri} className="lm-wo-ring absolute left-1/2 top-1/2" style={{ animationDuration: `${secs}s`, animationDirection: dir === 1 ? "normal" : "reverse" }}>
            {Array.from({ length: count }, (_, c) => {
              const i = slot++ % n;
              const first = slot <= n; // one focusable card per link
              const a = (c / count) * 360 + ri * 17;
              const l = data.links[i];
              return (
                <div key={c} className="absolute left-0 top-0" style={{ transform: `rotate(${a}deg) translateY(${-r * m * 1.25}px)` }}>
                  <button type="button" tabIndex={first ? 0 : -1} aria-hidden={!first || undefined}
                    aria-label={first ? `${l.title}${sel === i ? ", selected" : ""}` : undefined} onClick={() => pick(i)}
                    className={`lm-wo-card absolute block overflow-hidden rounded-[9%] outline-none ${sel === i ? "is-on" : ""}`}
                    style={{ width: card, height: card * (c % 3 === 1 ? 1.22 : 0.86), left: -card / 2, top: -card / 2, ["--i" as string]: ri * 4 + c } as CSSProperties}>
                    <LinkArt link={l} className="absolute inset-0" icon={Math.round(card * 0.26)} blur={0.3} mark={card > 64} />
                  </button>
                </div>
              );
            })}
          </div>
        )) : null}

        {/* the words in the middle */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="lm-wo-center pointer-events-auto max-w-[min(78%,440px)] rounded-[28px] px-5 py-3 text-center" aria-live="polite">
            {current ? (
              <div key={current.id} className="lm-pop">
                <p className="text-[clamp(13px,3.6cqw,22px)] tracking-[-0.02em]">{hostOf(current.url)}</p>
                <p className="line-clamp-2 font-serif text-[clamp(30px,9cqw,60px)] italic leading-[0.95] tracking-[-0.03em]">{current.title}</p>
                <a href={current.url} {...linkTarget(mode, current.url)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#141414] px-4 py-2 text-[13px] font-semibold text-white transition-transform active:scale-95">Open ↗</a>
              </div>
            ) : (
              <div className="lm-pop">
                <p className="text-[clamp(14px,4cqw,26px)] tracking-[-0.02em]">{data.bio ? data.bio.split(/[.!?]/)[0] : "Step into the world of"}</p>
                <h1 className="font-serif text-[clamp(36px,11cqw,76px)] italic leading-[0.92] tracking-[-0.035em]">{name}</h1>
                {n ? <p className="mt-2 text-[12px] text-black/45">Tap any card</p> : null}
              </div>
            )}
          </div>
        </div>
        {n === 0 ? <Empty className="absolute inset-x-0 bottom-8" /> : null}
      </div>
      <SocialRow socials={data.socials} mode={mode} className="relative z-10 shrink-0 pb-1" iconClass="size-9! text-[#141414]/70 hover:bg-black/5" size={18} />
    </ThemeRoot>
  );
}
