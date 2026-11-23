"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useDragX, useSize } from "../motion";
import type { ThemeProps } from "../types";

// Frame finishes, picked per painting: [outer, inner lip]
const FRAMES: [string, string][] = [["#b8913f", "#e7cf8a"], ["#2a211b", "#5a4636"], ["#f1ede4", "#d8d1c2"], ["#7a4a26", "#b07a48"]];

/**
 * Standing in front of a gallery wall. One painting at a time fills the view, lit from above,
 * with its neighbors hanging to either side. Swipe or use the arrows to walk along the wall.
 */
export default function Gallery({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState(0);
  const [drag, setDrag] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  // the painting gets nearly all the room; the wall shows a sliver of the next ones
  const pw = Math.max(150, Math.min(w * 0.84, h * 0.66 * 1.25, 620));
  const ph = pw * 0.8;
  const step = pw + Math.max(28, w * 0.07);
  const go = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (next !== sel) { tick(880 + (next % 6) * 110, 0.02, 0.04); buzz(5); }
    setSel(next);
  };
  const dragProps = useDragX((dx) => setDrag(dx), (dx, vx) => { setDrag(0); if (Math.abs(dx) > 40 || Math.abs(vx) > 0.4) go(sel + (dx < 0 ? 1 : -1)); });
  const current = data.links[sel];

  return (
    <ThemeRoot data={data} mode={mode} label="Gallery" className="lm-gw text-[#1d1a17]">
      <header className="relative z-20 shrink-0 px-5 pt-[max(52px,4cqh)] text-center">
        <h1 className="font-serif text-[clamp(20px,5.6cqw,32px)] leading-tight tracking-[-0.01em]">{name}</h1>
        {data.bio ? <p className="mx-auto mt-0.5 line-clamp-1 max-w-[46ch] text-[12.5px] text-black/50">{data.bio}</p> : null}
      </header>

      <div ref={stage} {...dragProps} tabIndex={-1}
        onKeyDown={(e) => { if (e.key === "ArrowRight") go(sel + 1); if (e.key === "ArrowLeft") go(sel - 1); }}
        className="lm-gw-wall relative min-h-0 flex-1 cursor-grab touch-pan-y select-none overflow-hidden outline-none active:cursor-grabbing">
        {w > 0 ? (
          <ul className={`absolute left-0 top-0 h-full ${drag ? "" : "lm-gw-track"}`} style={{ transform: `translateX(${w / 2 - pw / 2 - sel * step + drag}px)` }} aria-label="Paintings">
            {data.links.map((l, i) => {
              const on = i === sel;
              const [outer, lip] = FRAMES[hash(l.id + l.title) % FRAMES.length];
              return (
                <li key={l.id} className="absolute" style={{ left: i * step, top: h * 0.46 - ph / 2, width: pw, height: ph }}>
                  <span aria-hidden className={`lm-gw-light ${on ? "is-on" : ""}`} />
                  <button type="button" onClick={() => (on ? openRef.current?.click() : go(i))}
                    aria-label={on ? `Open ${l.title}` : `Walk to ${l.title}`} tabIndex={on ? 0 : -1}
                    className={`lm-gw-frame absolute inset-0 outline-none ${on ? "is-on" : ""}`} style={{ ["--fo" as string]: outer, ["--fl" as string]: lip } as CSSProperties}>
                    <span className="lm-gw-mat absolute inset-[6%]">
                      <LinkArt link={l} className="absolute inset-[7%]" icon={Math.round(pw * 0.14)} blur={0} />
                    </span>
                  </button>
                  {/* the wall label, beside the painting like in a real gallery */}
                  <span className="lm-gw-plaque absolute left-1/2 top-[calc(100%+18px)] w-[min(100%,260px)] -translate-x-1/2 text-center">
                    <span className="block truncate font-serif text-[clamp(15px,4.4cqw,21px)] leading-tight">{l.title}</span>
                    <span className="mt-0.5 block truncate text-[11px] uppercase tracking-[0.12em] text-black/45">{hostOf(l.url)} · {String(i + 1).padStart(2, "0")}/{String(n).padStart(2, "0")}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
        <div aria-hidden className="lm-gw-floor absolute inset-x-0 bottom-0" />
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3" /> : null}
      </div>

      <div className="relative z-20 shrink-0 px-5 pb-1" aria-live="polite">
        {current ? (
          <div className="mx-auto flex max-w-[440px] items-center gap-2">
            <button type="button" aria-label="Previous painting" onClick={() => go(sel - 1)} disabled={sel <= 0} className="lm-gw-arrow">‹</button>
            <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)}
              className="lm-pop flex h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-[#1d1a17] px-4 text-[15px] font-semibold text-white transition-transform duration-150 active:scale-[.97]">
              <span className="truncate">Open {current.title}</span><span aria-hidden>↗</span>
            </a>
            <button type="button" aria-label="Next painting" onClick={() => go(sel + 1)} disabled={sel >= n - 1} className="lm-gw-arrow">›</button>
          </div>
        ) : null}
        <SocialRow socials={data.socials} mode={mode} className="mt-0.5" iconClass="size-9! text-black/60 hover:bg-black/5" size={18} />
      </div>
    </ThemeRoot>
  );
}
