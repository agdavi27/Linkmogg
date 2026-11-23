"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { Particles, buzz, tick } from "../motion";
import type { ThemeProps, ThemeLink } from "../types";

const SPINES = [
  ["#7a2e2a", "#f1d9a7"], ["#1f4d45", "#e9dcb8"], ["#2b3a67", "#eadfc4"], ["#a3672b", "#2a1a0c"],
  ["#4b2f4f", "#efd9b4"], ["#c8b48a", "#3b2a14"], ["#33402a", "#e5d3a2"], ["#8c4a2f", "#f3e2bd"], ["#16324f", "#e7c977"],
];
const PER_SHELF = 6;

function Book({ link, on, idx, onPick }: { link: ThemeLink; on: boolean; idx: number; onPick: () => void }) {
  const h = hash(link.id + link.title);
  const [bg, fg] = SPINES[h % SPINES.length];
  const height = 76 + (h % 22); // %
  const width = 13 + ((h >> 5) % 5); // %
  const style = (h >> 9) % 3; // band style
  return (
    <button type="button" onClick={onPick} aria-pressed={on}
      aria-label={`${link.title}${on ? ", pulled out. Press again to open" : ""}`}
      className={`lm-book group relative flex items-center justify-center overflow-hidden px-1 outline-none ${on ? "lm-book-on" : ""}`}
      style={{ ["--spine" as string]: bg, color: fg, height: `${height}%`, width: `${width}%`, animationDelay: `${idx * 60}ms` } as CSSProperties}>
      <span aria-hidden className="lm-book-leather absolute inset-0" />
      {style !== 2 ? <><span aria-hidden className="lm-book-band absolute inset-x-0 top-[7%]" /><span aria-hidden className="lm-book-band absolute inset-x-0 bottom-[7%]" /></> : <span aria-hidden className="lm-book-label absolute inset-x-[14%] top-[10%] h-[18%]" />}
      <span className="lm-spine-text relative max-h-[72%] truncate font-serif text-[13px] font-semibold tracking-wide">{link.title}</span>
    </button>
  );
}

export default function Bookshelf({ data, mode }: ThemeProps) {
  const [active, setActive] = useState<number | null>(null);
  const openRef = useRef<HTMLAnchorElement>(null);
  const shelves: ThemeLink[][] = [];
  data.links.forEach((l, i) => {
    if (i % PER_SHELF === 0) shelves.push([]);
    shelves[shelves.length - 1].push(l);
  });
  if (!shelves.length) shelves.push([]);
  const current = active !== null ? data.links[active] : null;

  const pick = (idx: number) => {
    if (active === idx) { openRef.current?.click(); return; }
    setActive(idx);
    tick(300, 0.06, 0.05);
    buzz(8);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Bookshelf" badgeTone="light" className="lm-bs-room relative overflow-hidden text-[#f3e6cc]">
      <div aria-hidden className="lm-bs-lamp"><span className="lm-bs-cord" /><span className="lm-bs-shade" /><span className="lm-bs-bulb" /></div>
      <div aria-hidden className="lm-bs-beam" />
      <Particles count={40} color={["#ffe9b8", "#fff6df"]} size={[0.6, 1.6]} speed={[3, 9]} angle={Math.PI / 2} spread={3} wobble={1.4} twinkle className="lm-bs-dust" />

      <div className="relative z-10 mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 pt-24">
        <div className="lm-pop flex items-center gap-3">
          <Avatar data={data} size={60} className="border-2 border-[#d9b97a]/70 bg-[#3a2718]! text-[#f3e6cc] shadow-[0_4px_12px_rgba(0,0,0,.5)]" />
          <div className="min-w-0">
            <h1 className="truncate font-serif text-[26px] font-semibold leading-tight [text-shadow:0_2px_6px_rgba(0,0,0,.6)]">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="line-clamp-2 text-sm text-[#e2cfa8]">{data.bio}</p> : null}
          </div>
        </div>

        <div className="lm-case mt-6 rounded-[6px] p-3 pb-1">
          {shelves.map((row, r) => (
            <div key={r} className="relative mb-2">
              <div className="lm-bs-back flex h-40 items-end gap-[2%] px-2" role="group" aria-label={`Shelf ${r + 1}`}>
                {row.map((l, i) => {
                  const idx = r * PER_SHELF + i;
                  return <Book key={l.id} link={l} idx={idx} on={active === idx} onPick={() => pick(idx)} />;
                })}
                {row.length === 0 ? <p className="w-full pb-6 text-center text-sm text-[#c7b28a]">No books yet.</p> : null}
                {row.length > 0 && row.length < PER_SHELF ? <span aria-hidden className="lm-bookend ml-1 h-[45%] w-[7%]" /> : null}
                {r === 0 && row.length < PER_SHELF - 1 ? <span aria-hidden className="lm-bs-plant ml-auto"><i /><i /><i /></span> : null}
              </div>
              <div aria-hidden className="lm-shelf h-3.5 rounded-[2px]" />
            </div>
          ))}
        </div>

        <div className="min-h-[150px] py-5" aria-live="polite">
          {current ? (
            <div key={current.id} className="lm-bs-open mx-auto flex w-full max-w-[380px]" style={{ ["--spine" as string]: SPINES[hash(current.id + current.title) % SPINES.length][0] } as CSSProperties}>
              <div className="lm-bs-page lm-bs-left flex min-w-0 flex-1 flex-col justify-center p-4 text-[#2a1d14]">
                <p className="line-clamp-3 font-serif text-lg font-semibold leading-snug">{current.title}</p>
                <p className="mt-2 font-serif text-xs italic text-[#8a6f45]">Book {active! + 1} of {data.links.length}</p>
              </div>
              <div className="lm-bs-page lm-bs-right flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 text-[#2a1d14]">
                <p className="truncate font-serif text-sm italic text-[#7a6440]">{hostOf(current.url)}</p>
                <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
                  className="self-start rounded-[4px] bg-[#2a1d14] px-4 py-2 text-sm font-semibold text-[#f4e9d2] transition-transform duration-150 ease-out active:scale-95">
                  Read
                </a>
              </div>
            </div>
          ) : (
            <p className="pt-4 text-center font-serif text-sm italic text-[#d8c39a]">{data.links.length ? "Pull a book off the shelf" : ""}</p>
          )}
        </div>
        <SocialRow socials={data.socials} mode={mode} className="mb-6" iconClass="text-[#efdcb5] hover:bg-white/10" />
      </div>
    </ThemeRoot>
  );
}
