"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

const MIN_ROW = 16; // short lists repeat so the row still runs off the page

/** A long row of CD cases seen from above. Pick one and it slides up out of the row. */
export default function Cases({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const [shift, setShift] = useState(0);
  const [drag, setDrag] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  const size = Math.max(130, Math.min(Math.min(w, h) * 0.42, 260));
  const gap = size * 0.2;
  const count = n ? Math.max(n, Math.ceil(MIN_ROW / n) * n) : 0;
  const current = sel !== null ? data.links[sel % n] : null;

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i); tick(1400 + (i % 6) * 90, 0.014, 0.035); buzz(5);
  };
  const dragProps = useDragX(
    (dx) => setDrag(dx),
    (dx) => { setDrag(0); setShift((s) => Math.max(-(count - 4) * gap, Math.min(0, s + dx * 0.8))); },
  );

  return (
    <ThemeRoot data={data} mode={mode} label="Cases" className="lm-cs bg-[#d6d6d6] text-[#151515]">
      <div ref={stage} {...dragProps}
        onWheel={(e) => setShift((s) => Math.max(-(count - 4) * gap, Math.min(0, s - (e.deltaY + e.deltaX) * 0.5)))}
        className="relative min-h-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing" style={{ perspective: 2400 }}>
        {w > 0 && n ? (
          <div className="lm-cs-row absolute" style={{ left: w * 0.5 - size * 0.9, top: h * 0.42 - size * 0.2, ["--s" as string]: `${size}px` } as CSSProperties}>
            <div className="lm-cs-slide" style={{ transform: `translateX(${(shift + drag * 0.8) * 1.3}px) translateZ(${(shift + drag * 0.8) * -0.5}px)`, transition: drag ? "none" : undefined }}>
              {Array.from({ length: count }, (_, i) => {
                const l = data.links[i % n];
                const first = i < n;
                const on = sel === i;
                return (
                  <button key={i} type="button" tabIndex={first ? 0 : -1} aria-hidden={!first || undefined}
                    aria-label={first ? `${l.title}${on ? ", pulled out. Press again to open" : ""}` : undefined}
                    onClick={() => pick(i)}
                    className={`lm-cs-case absolute outline-none ${on ? "is-on" : ""}`}
                    style={{ width: size, height: size, transform: `translateZ(${-i * gap}px)${on ? ` translateY(${-size * 0.42}px)` : ""}` }}>
                    <span className="lm-cs-front absolute inset-0">
                      <LinkArt link={l} className="absolute inset-[4%_4%_4%_9%]" icon={Math.round(size * 0.2)} blur={0.4} />
                      <span aria-hidden className="lm-cs-hinge" />
                      <span aria-hidden className="lm-cs-gloss" />
                    </span>
                    <span aria-hidden className="lm-cs-spine absolute" style={{ width: gap * 0.55 }}>
                      <span className="truncate">{l.title}</span>
                    </span>
                    <span aria-hidden className="lm-cs-top absolute" style={{ height: gap * 0.55 }} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/2" /> : null}
      </div>

      <div className="relative z-10 flex shrink-0 flex-col items-center gap-1 px-5 pb-1 text-center" aria-live="polite">
        {current ? (
          <div key={sel} className="lm-pop flex max-w-full flex-col items-center">
            <p className="max-w-full truncate text-[clamp(18px,5cqw,26px)] font-semibold tracking-[-0.03em]">{current.title}</p>
            <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)} className="mt-1 rounded-full bg-[#151515] px-4 py-1.5 text-[12px] font-semibold text-white">Open {hostOf(current.url)} ↗</a>
          </div>
        ) : (
          <div className="lm-pop">
            <h1 className="text-[clamp(18px,5cqw,26px)] font-semibold tracking-[-0.03em]">{name}</h1>
            <p className="text-[12px] text-black/50">{n ? "Drag along the row. Tap a case to pull it out." : ""}</p>
          </div>
        )}
        <SocialRow socials={data.socials} mode={mode} iconClass="size-9! text-[#151515]/70 hover:bg-black/5" size={18} />
      </div>
    </ThemeRoot>
  );
}
