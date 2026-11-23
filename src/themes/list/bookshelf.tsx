"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { LinkArt, paletteOf } from "../art";
import { buzz, tick, useSize } from "../motion";
import type { ThemeLink, ThemeProps } from "../types";

/** Wooden shelves, every link standing cover-out. Tap a book to pull it forward, tap again to open it. */
export default function Bookshelf({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const { w } = useSize(box);
  const name = data.displayName || data.username;

  const cols = w > 760 ? 4 : 3;
  const bookW = Math.max(86, Math.min(176, (w * 0.92) / cols - 12));
  const bookH = Math.round(bookW * 1.46);
  const rows: ThemeLink[][] = [];
  for (let i = 0; i < Math.max(n, 1); i += cols) rows.push(data.links.slice(i, i + cols));
  const current = sel !== null ? data.links[sel] : null;

  const pick = (i: number) => {
    if (sel === i) { openRef.current?.click(); return; }
    setSel(i); tick(520, 0.03, 0.05); buzz(6);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Bookshelf" badgeTone="light" className="lm-bs text-[#3b2612]">
      {/* the shelf's name plate */}
      <header className="lm-bs-bar relative z-10 flex shrink-0 items-center gap-3 px-[5%] pb-3 pt-[max(54px,5cqh)]">
        <Avatar data={data} size={40} className="shrink-0 ring-2 ring-[#fff8e6]" />
        <div className="min-w-0">
          <h1 className="truncate text-[clamp(19px,5.4cqw,28px)] font-semibold leading-tight tracking-[-0.02em]">{name}</h1>
          {data.bio ? <p className="truncate text-[12.5px] text-[#3b2612]/65">{data.bio}</p> : null}
        </div>
      </header>

      <div ref={box} className="lm-bs-wood relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {w > 0 ? (
          <div className="flex flex-col pt-6" style={{ ["--bw" as string]: `${bookW}px` } as CSSProperties}>
            {rows.map((row, r) => (
              <div key={r} className="relative">
                <ul className="relative z-10 mx-auto flex items-end justify-around px-[7%]" style={{ height: bookH + 26 }}>
                  {row.map((l, k) => {
                    const i = r * cols + k;
                    return (
                      <li key={l.id} style={{ width: bookW }}>
                        <button type="button" onClick={() => pick(i)} aria-label={`${l.title}${sel === i ? ", pulled out. Press again to open" : ""}`}
                          className={`lm-bs-book relative block w-full outline-none ${sel === i ? "is-on" : ""}`} style={{ height: bookH, ["--d" as string]: `${i * 70}ms` } as CSSProperties}>
                          <Cover link={l} w={bookW} />
                        </button>
                      </li>
                    );
                  })}
                  {Array.from({ length: cols - row.length }, (_, k) => <li key={`e${k}`} aria-hidden style={{ width: bookW }} />)}
                </ul>
                <div aria-hidden className="lm-bs-plank relative mx-[3%]" />
              </div>
            ))}
            <div className="h-24 shrink-0" />
          </div>
        ) : null}
        {n === 0 ? <Empty className="absolute inset-x-0 top-1/3 text-[#fff8e6]" /> : null}
      </div>

      {/* what's in your hand */}
      <div className="lm-bs-foot relative z-10 shrink-0 px-5 pb-1 pt-2" aria-live="polite">
        {current ? (
          <a ref={openRef} key={current.id} href={current.url} {...linkTarget(mode, current.url)}
            className="lm-pop mx-auto flex max-w-[420px] items-center justify-between gap-3 rounded-full bg-[#fff8e6] px-4 py-2.5 text-[#3b2612] shadow-[0_6px_18px_rgba(40,20,0,.3)] transition-transform active:scale-[.98]">
            <span className="min-w-0 truncate text-[15px] font-semibold">{current.title}</span>
            <span className="shrink-0 text-[12px] text-[#3b2612]/65">{hostOf(current.url)} ↗</span>
          </a>
        ) : <p className="text-center text-[12px] text-[#fff8e6]/80">{n ? "Tap a book to pull it out. Tap again to open." : ""}</p>}
        <SocialRow socials={data.socials} mode={mode} className="mt-0.5" iconClass="size-9! text-[#fff8e6] hover:bg-white/10" size={18} />
      </div>
    </ThemeRoot>
  );
}

/** A front cover, in one of a few printed styles picked from the link itself. */
function Cover({ link, w }: { link: ThemeLink; w: number }) {
  const k = hash(link.id + link.title);
  const [bg, mid, acc] = paletteOf(link);
  const style = k % 3;
  const title = <span className="line-clamp-3 font-display font-bold uppercase leading-[0.95] tracking-[-0.02em]" style={{ fontSize: Math.max(11, Math.min(w * 0.13, 22)) }}>{link.title}</span>;
  const by = <span className="block truncate text-[max(7px,calc(var(--bw)*0.06))] font-semibold uppercase tracking-[0.14em] opacity-80">{hostOf(link.url)}</span>;
  return (
    <span className="lm-bs-cover absolute inset-0 flex flex-col overflow-hidden text-left">
      {style === 0 ? (
        // full art, title printed over the bottom
        <>
          <LinkArt link={link} className="absolute inset-0" icon={Math.round(w * 0.24)} blur={0.4} />
          <span className="relative mt-auto bg-gradient-to-t from-black/70 to-transparent p-[9%] pt-[30%] text-white">{title}<span className="mt-1 block">{by}</span></span>
        </>
      ) : style === 1 ? (
        // a solid cloth color with a picture plate in the middle
        <span className="flex size-full flex-col p-[10%]" style={{ background: bg, color: acc }}>
          {by}
          <LinkArt link={link} className="my-[10%] aspect-square w-full rounded-[2px]" icon={Math.round(w * 0.2)} blur={0.4} />
          <span className="mt-auto">{title}</span>
        </span>
      ) : (
        // a pale paperback: big type up top, art underneath
        <span className="flex size-full flex-col p-[10%]" style={{ background: "#f4efe4", color: "#1d1712" }}>
          <span>{title}</span>
          <span className="mt-1.5 block h-[3px] w-1/3" style={{ background: mid }} />
          <LinkArt link={link} className="mt-auto aspect-[4/3] w-full rounded-[2px]" icon={Math.round(w * 0.18)} blur={0.4} />
          <span className="mt-1.5" style={{ color: "#1d1712" }}>{by}</span>
        </span>
      )}
      <span aria-hidden className="lm-bs-hinge absolute inset-y-0 left-0 w-[7%]" />
    </span>
  );
}
