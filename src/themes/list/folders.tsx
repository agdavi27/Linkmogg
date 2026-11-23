"use client";

import { useEffect, useRef, useState } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import { buzz, tick } from "../motion";
import type { ThemeProps } from "../types";

/**
 * A grey late-90s desktop: one window in the middle of a teal screen, your links as folders inside it.
 * Click a folder to select it, click again (or press Enter) to open it.
 */
export default function Folders({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const [sel, setSel] = useState<number | null>(null);
  const [time, setTime] = useState("");
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const name = data.displayName || data.username;
  const current = sel !== null ? data.links[sel] : null;

  // the taskbar clock, filled in after mount so server and client markup match
  useEffect(() => {
    const set = () => setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    set();
    const t = setInterval(set, 30_000);
    return () => clearInterval(t);
  }, []);

  const pick = (i: number) => {
    if (sel === i) { refs.current[i]?.click(); return; }
    setSel(i); tick(1500, 0.01, 0.025); buzz(4);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Folders" badgeTone="light" className="lm-w9 bg-[#008080] text-black">
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-[4%] pb-3 pt-[56px]">
        <section className="lm-w9-win lm-w9-in flex max-h-full w-full max-w-[640px] flex-col" aria-label={`${name}'s links`}>
          <header className="lm-w9-title flex h-[22px] shrink-0 items-center gap-1.5 pl-1.5 pr-[3px]">
            <FolderGlyph size={14} />
            <h1 className="min-w-0 flex-1 truncate text-[12px] font-bold text-white">{name}</h1>
            <span aria-hidden className="lm-w9-btn">_</span>
            <span aria-hidden className="lm-w9-btn">□</span>
            <button type="button" onClick={() => setSel(null)} aria-label="Clear selection" className="lm-w9-btn ml-0.5">×</button>
          </header>
          <div aria-hidden className="flex shrink-0 gap-3 px-2 py-[3px] text-[12px]"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>H</u>elp</span></div>
          <div className="mx-1 flex shrink-0 items-center gap-1.5 px-1.5 py-[2px] text-[12px]">
            <span className="text-black/60">Address</span>
            <span className="lm-w9-sunk min-w-0 flex-1 truncate bg-white px-1">C:\Links\{data.username}</span>
          </div>

          {/* about: the window's info panel */}
          <div className="mx-1 mt-1 flex shrink-0 items-center gap-3 bg-white px-3 py-2.5 lm-w9-sunk">
            <Avatar data={data} size={44} className="shrink-0 rounded-none! ring-1 ring-black/20" />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold leading-tight">{name}</p>
              {data.bio ? <p className="line-clamp-2 text-[12px] leading-snug text-black/70">{data.bio}</p> : null}
            </div>
          </div>

          <ul className="lm-w9-sunk mx-1 mt-1 grid min-h-0 flex-1 content-center justify-items-center gap-x-2 gap-y-3 overflow-y-auto bg-white px-2 py-4"
            style={{ gridTemplateColumns: `repeat(${n <= 4 ? Math.max(n, 1) : 3}, minmax(0, 1fr))` }} aria-label="Links">
            {data.links.map((l, i) => (
              <li key={l.id} className="flex w-full max-w-[120px] flex-col items-center">
                <button type="button" onClick={() => pick(i)} onDoubleClick={() => refs.current[i]?.click()}
                  aria-label={`${l.title}${sel === i ? ", selected. Press again to open" : ""}`}
                  className={`lm-w9-icon flex w-full flex-col items-center gap-1 px-1 py-1 outline-none ${sel === i ? "is-on" : ""}`}>
                  <FolderGlyph size={44} open={sel === i} />
                  <span className="lm-w9-label line-clamp-2 max-w-full px-0.5 text-center text-[12px] leading-tight">{l.title}</span>
                </button>
                <a ref={(el) => { refs.current[i] = el; }} href={l.url} {...linkTarget(mode, l.url)} tabIndex={-1} aria-hidden className="hidden">{l.title}</a>
              </li>
            ))}
            {n === 0 ? <li className="col-span-full"><Empty /></li> : null}
          </ul>

          {/* status bar: what's selected, and a real button to open it */}
          <footer className="flex shrink-0 items-center gap-1 p-1 text-[12px]" aria-live="polite">
            <span className="lm-w9-sunk min-w-0 flex-1 truncate px-1.5 py-[2px]">{current ? hostOf(current.url) : `${n} object${n === 1 ? "" : "s"}`}</span>
            {current ? (
              <a href={current.url} {...linkTarget(mode, current.url)} className="lm-w9-raised shrink-0 px-3 py-[3px] font-bold outline-none focus-visible:outline-1 focus-visible:outline-dotted focus-visible:-outline-offset-4">Open</a>
            ) : null}
          </footer>
        </section>
      </div>

      {/* taskbar */}
      <div className="lm-w9-bar relative z-10 flex h-[40px] shrink-0 items-center gap-2 px-1">
        <span className="lm-w9-raised flex h-[30px] shrink-0 items-center gap-1.5 px-2 text-[13px] font-bold"><FolderGlyph size={16} />Links</span>
        <span className="lm-w9-sunk hidden h-[30px] min-w-0 max-w-[180px] flex-1 items-center truncate px-2 text-[12px] @min-[420px]:flex">{name}</span>
        <div className="ml-auto flex items-center">
          <SocialRow socials={data.socials} mode={mode} iconClass="size-8! text-black/80 hover:bg-black/10 rounded-none!" size={15} />
        </div>
        <span className="lm-w9-sunk flex h-[30px] shrink-0 items-center px-2 text-[12px] tabular-nums">{time}</span>
      </div>
    </ThemeRoot>
  );
}

/** A plain manila folder, drawn in a few flat blocks. */
function FolderGlyph({ size, open = false }: { size: number; open?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 32 26" width={size} height={size * 26 / 32} shapeRendering="crispEdges" className="shrink-0">
      <path d="M1 3h11l2 3h17v19H1z" fill="#b8961e" />
      <path d="M1 3h11l2 3h17v1H1z" fill="#ffe680" />
      {open
        ? <path d="M5 11h26l-4 14H1z" fill="#ffd84a" stroke="#806400" strokeWidth="1" />
        : <path d="M1 9h30v16H1z" fill="#ffd84a" stroke="#806400" strokeWidth="1" />}
      <path d="M2 10h28v1H2z" fill="#fff3b0" opacity={open ? 0 : 1} />
    </svg>
  );
}
