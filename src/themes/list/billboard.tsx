"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, tick, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

/** One row of bubbles. Links repeat until the row is wide enough to loop without a gap. */
function rowOf(links: ThemeLink[], offset: number, min: number) {
  if (!links.length) return [];
  const out: { l: ThemeLink; i: number }[] = [];
  for (let k = 0; out.length < Math.max(min, links.length); k++) {
    const i = (k + offset) % links.length;
    out.push({ l: links[i], i });
  }
  return out;
}

export default function Billboard({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const board = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w: bw, h: bh } = useSize(board);
  const name = data.displayName || data.username;

  // Bubble size follows the board, so a phone and a desktop both show a full row.
  const bub = Math.max(36, Math.min(bh * 0.19, bw * 0.22, 110));
  const perRow = Math.ceil(bw / (bub * 0.95)) + 2;
  const top = rowOf(data.links, 0, perRow);
  const bottom = rowOf(data.links, Math.ceil(n / 2), perRow);

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i);
    tick(1500 + (i % 6) * 110, 0.015, 0.04);
    buzz(5);
  };
  const current = sel !== null ? data.links[sel] : null;

  return (
    <ThemeRoot data={data} mode={mode} label="Billboard" badgeTone="light" className="lm-bb bg-[#0a4f28] text-[#121212]">
      <div aria-hidden className="lm-bb-sky">
        <span className="lm-bb-clouds lm-bb-c1" />
        <span className="lm-bb-clouds lm-bb-c2" />
      </div>
      <div aria-hidden className="lm-bb-hills" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[4%] pb-[22cqh] pt-[clamp(14px,5cqh,48px)]">
        <div className="lm-bb-sign relative flex w-full max-w-[760px] flex-col" style={{ height: "min(100%, max(340px, 62cqw, 54cqh))" }}>
          <div ref={board} className="lm-bb-board relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {bw > 0 ? <BubbleRow items={top} dir={1} rowKey="t" bub={bub} n={n} sel={sel} onPick={pick} onHover={setSel} /> : null}
            <div className="relative z-10 flex shrink-0 flex-col items-center px-4 py-[clamp(6px,2cqh,16px)] text-center" aria-live="polite">
              <h1 className="lm-bb-name max-w-full truncate font-display text-[clamp(34px,11cqw,84px)] font-bold lowercase leading-[0.9] tracking-[-0.055em]">{name}</h1>
              <div className="mt-1.5 h-[2.6em] max-w-[40ch] text-[clamp(11px,2.8cqw,14px)] leading-snug text-black/55">
                {current ? (
                  <p key={current.id} className="lm-pop truncate"><span className="font-semibold text-black/80">{current.title}</span> · {hostOf(current.url)}</p>
                ) : (
                  <p className="line-clamp-2">{data.bio || "Tap a bubble to see where it goes."}</p>
                )}
              </div>
              {current ? (
                <a ref={openRef} href={current.url} key={current.id} {...linkTarget(mode, current.url)}
                  className="lm-pop mt-1 rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold shadow-[0_2px_10px_rgba(0,0,0,.12),0_0_0_1px_rgba(0,0,0,.05)] transition-transform duration-150 ease-out active:scale-95">
                  Open {current.title.length > 20 ? "link" : current.title} ↗
                </a>
              ) : (
                <button type="button" onClick={() => n && pick(0)} className="mt-1 rounded-full bg-white px-4 py-1.5 text-[12px] font-semibold shadow-[0_2px_10px_rgba(0,0,0,.12),0_0_0_1px_rgba(0,0,0,.05)] transition-transform duration-150 ease-out active:scale-95">
                  {n ? "Show me" : "No links yet"}
                </button>
              )}
            </div>
            {bw > 0 && n > 1 ? <BubbleRow items={bottom} dir={-1} rowKey="b" bub={bub} n={n} sel={sel} onPick={pick} onHover={setSel} /> : <div className="flex-1" />}
            {n === 0 ? <Empty className="absolute inset-x-0 bottom-6" /> : null}
          </div>
          <div aria-hidden className="lm-bb-catwalk" />
          <div aria-hidden className="lm-bb-pole" />
        </div>
      </div>

      <div aria-hidden className="lm-bb-grass" />
      <SocialRow socials={data.socials} mode={mode} className="relative z-20 shrink-0 pb-1" iconClass="size-9! text-white/90 hover:bg-white/15" size={18} />
    </ThemeRoot>
  );
}

function BubbleRow({ items, dir, rowKey: key, bub, n, sel, onPick: pick, onHover: setSel }: {
  items: { l: ThemeLink; i: number }[]; dir: 1 | -1; rowKey: string; bub: number; n: number; sel: number | null;
  onPick: (i: number) => void; onHover: (i: number) => void;
}) {
  return (
    <div className="lm-bb-row relative min-h-0 flex-1 overflow-hidden" aria-hidden={key === "b" || undefined}>
      <ul className="lm-bb-track absolute left-0 top-0 flex h-full items-center" style={{ ["--dur" as string]: `${Math.max(18, items.length * 3.2)}s`, animationDirection: dir === 1 ? "normal" : "reverse" } as CSSProperties}>
        {[0, 1].map((copy) => items.map(({ l, i }, k) => {
          const hv = hash(`${l.id}${key}${k}`);
          const s = bub * (0.72 + (hv % 30) / 100);
          const y = (k % 2 ? 1 : -1) * (6 + ((hv >> 5) % 14));
          const first = key === "t" && copy === 0 && k < n;
          return (
            <li key={`${key}${copy}-${k}`} className="shrink-0" style={{ marginInline: bub * 0.08, translate: `0 ${y * bub / 100}px` }} aria-hidden={!first || undefined}>
              <button type="button" tabIndex={first ? 0 : -1} onClick={() => pick(i)}
                onPointerEnter={(e) => { if (e.pointerType === "mouse") setSel(i); }}
                aria-label={first ? `${l.title}${sel === i ? ", selected. Press again to open" : ""}` : undefined}
                className={`lm-bb-bubble relative block rounded-full outline-none ${sel === i ? "is-on" : ""}`}
                style={{ width: s, height: s, animationDelay: `${-(hv % 50) / 10}s` }}>
                <LinkArt link={l} className="size-full rounded-full" icon={Math.round(s * 0.3)} blur={1.2} />
                <span aria-hidden className="lm-bb-gloss" />
              </button>
            </li>
          );
        }))}
      </ul>
    </div>
  );
}
