"use client";

import { useRef, useState } from "react";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import type { ThemeProps, ThemeLink } from "../types";

const SPINES = [
  ["#7a2e2a", "#f1d9a7"], ["#1f4d45", "#e9dcb8"], ["#2b3a67", "#eadfc4"], ["#a3672b", "#2a1a0c"],
  ["#4b2f4f", "#efd9b4"], ["#c8b48a", "#3b2a14"], ["#33402a", "#e5d3a2"], ["#8c4a2f", "#f3e2bd"],
];
const PER_SHELF = 6;

function Book({ link, on, onPick }: { link: ThemeLink; on: boolean; onPick: () => void }) {
  const h = hash(link.id + link.title);
  const [bg, fg] = SPINES[h % SPINES.length];
  const height = 78 + (h % 22); // %
  const width = 13 + ((h >> 5) % 5); // %
  return (
    <button type="button" onClick={onPick} aria-pressed={on}
      aria-label={`${link.title}${on ? ", pulled out. Press again to open" : ""}`}
      className={`lm-book relative flex items-center justify-center overflow-hidden rounded-[3px_3px_2px_2px] px-1 transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5d27a] ${on ? "-translate-y-[22%]" : "hover:-translate-y-[6%]"}`}
      style={{ background: bg, color: fg, height: `${height}%`, width: `${width}%` }}>
      <span aria-hidden className="absolute inset-x-0 top-[8%] h-[3px] bg-current opacity-50" />
      <span aria-hidden className="absolute inset-x-0 bottom-[8%] h-[3px] bg-current opacity-50" />
      <span className="lm-spine-text max-h-[80%] truncate font-serif text-[13px] font-semibold tracking-wide">{link.title}</span>
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

  return (
    <ThemeRoot data={data} mode={mode} label="Bookshelf" badgeTone="light"
      className="bg-[#2a1d14] bg-[radial-gradient(90%_60%_at_50%_0%,#5a3d27_0%,#2a1d14_70%)] text-[#f3e6cc]">
      <div className="mx-auto flex w-full max-w-[460px] flex-1 flex-col px-4 pt-10">
        <div className="flex items-center gap-3">
          <Avatar data={data} size={60} className="border-2 border-[#d9b97a]/60" />
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl font-semibold">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="line-clamp-2 text-sm text-[#d8c7a6]">{data.bio}</p> : null}
          </div>
        </div>

        <div className="lm-case mt-6 rounded-md p-3 pb-1">
          {shelves.map((row, r) => (
            <div key={r} className="mb-2">
              <div className="flex h-36 items-end gap-[2%] px-2" role="group" aria-label={`Shelf ${r + 1}`}>
                {row.map((l, i) => {
                  const idx = r * PER_SHELF + i;
                  return <Book key={l.id} link={l} on={active === idx}
                    onPick={() => (active === idx ? openRef.current?.click() : setActive(idx))} />;
                })}
                {row.length === 0 ? <p className="w-full pb-6 text-center text-sm text-[#c7b28a]">No books yet.</p> : null}
                {row.length > 0 && row.length < PER_SHELF ? <span aria-hidden className="lm-bookend ml-1 h-[45%] w-[7%]" /> : null}
              </div>
              <div aria-hidden className="lm-shelf h-3 rounded-sm" />
            </div>
          ))}
        </div>

        <div className="min-h-[110px] py-4" aria-live="polite">
          {current ? (
            <div key={current.id} className="lm-pop flex items-center gap-3 rounded-lg border border-[#d9b97a]/30 bg-[#f4e9d2] p-4 text-[#2a1d14] shadow-[0_18px_40px_-20px_rgba(0,0,0,.8)]">
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-lg font-semibold">{current.title}</p>
                <p className="truncate text-xs text-[#7a6440]">{hostOf(current.url)}</p>
              </div>
              <a ref={openRef} href={current.url} {...linkTarget(mode, current.url)}
                className="shrink-0 rounded-md bg-[#2a1d14] px-4 py-2 text-sm font-semibold text-[#f4e9d2] transition-transform duration-150 ease-out active:scale-95">
                Read
              </a>
            </div>
          ) : (
            <p className="pt-3 text-center text-sm text-[#c7b28a]">{data.links.length ? "Pull a book off the shelf" : ""}</p>
          )}
        </div>
        <SocialRow socials={data.socials} mode={mode} className="mb-4" iconClass="text-[#efdcb5] hover:bg-white/10" />
      </div>
    </ThemeRoot>
  );
}
