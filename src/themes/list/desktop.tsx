"use client";

import { useEffect, useState } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

function Win({ title, onClose, children, className = "" }: { title: string; onClose?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <section className={`lm-win ${className}`} aria-label={title}>
      <header className="lm-win-bar flex items-center gap-2 px-1.5 py-1">
        <span aria-hidden className="lm-win-stripes h-3 flex-1" />
        <h2 className="px-1 font-pixel text-lg leading-none">{title}</h2>
        <span aria-hidden className="lm-win-stripes h-3 flex-1" />
        {onClose ? (
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}
            className="lm-win-btn grid size-5 place-items-center font-pixel text-base leading-none">×</button>
        ) : null}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}

function DocGlyph() {
  return (
    <svg aria-hidden width="40" height="44" viewBox="0 0 20 22" shapeRendering="crispEdges">
      <path d="M2 1h11l5 5v15H2z" fill="#fffdf4" stroke="#1d1d1b" strokeWidth="1.2" />
      <path d="M13 1v5h5" fill="#e6dcc0" stroke="#1d1d1b" strokeWidth="1.2" />
      <path d="M5 10h10M5 13h10M5 16h7" stroke="#1d1d1b" strokeWidth="1.2" />
    </svg>
  );
}

export default function Desktop({ data, mode }: ThemeProps) {
  const [open, setOpen] = useState<number | null>(null);
  const [start, setStart] = useState(false);
  const [time, setTime] = useState("");
  useEffect(() => {
    const f = () => setTime(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    f();
    const id = setInterval(f, 30_000);
    return () => clearInterval(id);
  }, []);
  const current = open !== null ? data.links[open] : null;

  return (
    <ThemeRoot data={data} mode={mode} label="Mogg OS desktop" className="lm-desk text-[#1d1d1b]">
      <div className="relative mx-auto flex w-full max-w-[520px] flex-1 flex-col px-3 pb-14 pt-4">
        <Win title="profile.txt">
          <div className="flex items-center gap-3">
            <Avatar data={data} size={56} className="rounded-none! border-2 border-[#1d1d1b]" />
            <div className="min-w-0">
              <h1 className="truncate font-pixel text-2xl leading-none">{data.displayName || `@${data.username}`}</h1>
              {data.bio ? <p className="mt-1 line-clamp-3 text-sm leading-snug">{data.bio}</p> : null}
            </div>
          </div>
        </Win>

        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Files. Each opens a link window.">
          {data.links.map((l, i) => (
            <li key={l.id}>
              <button type="button" onClick={() => setOpen(i)}
                className={`group flex w-full flex-col items-center gap-1 p-1.5 outline-none ${open === i ? "lm-icon-sel" : ""} focus-visible:outline-2 focus-visible:outline-dashed focus-visible:outline-[#1d1d1b]`}>
                <DocGlyph />
                <span className="lm-icon-label line-clamp-2 px-1 text-center font-pixel text-base leading-[1]">{l.title}</span>
              </button>
            </li>
          ))}
        </ul>
        {data.links.length === 0 ? <p className="mt-6 text-center font-pixel text-xl">This disk is empty.</p> : null}

        {current ? (
          <div className="lm-pop fixed inset-x-3 bottom-16 z-20 mx-auto max-w-[420px] sm:absolute sm:inset-x-6 sm:bottom-auto sm:top-28">
            <Win title={`${current.title.slice(0, 18)}.lnk`} onClose={() => setOpen(null)} className="shadow-[6px_6px_0_rgba(0,0,0,.35)]">
              <p className="font-pixel text-2xl leading-none">{current.title}</p>
              <p className="mt-1 truncate text-sm text-[#4b4a44]">{hostOf(current.url)}</p>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(null)} className="lm-win-btn px-3 py-1 font-pixel text-lg">Cancel</button>
                <a href={current.url} {...linkTarget(mode, current.url)} autoFocus className="lm-win-btn lm-win-primary px-4 py-1 font-pixel text-lg">Open</a>
              </div>
            </Win>
          </div>
        ) : null}
      </div>

      <div className="lm-taskbar absolute inset-x-0 bottom-0 z-30 flex items-center gap-2 px-2 py-1.5" style={{ bottom: data.showBadge ? 52 : 0 }}>
        <button type="button" onClick={() => setStart((s) => !s)} aria-expanded={start}
          className="lm-win-btn flex items-center gap-1 px-2 py-0.5 font-pixel text-lg">✦ Start</button>
        <span className="flex-1" />
        <span className="lm-win-inset px-2 py-0.5 font-pixel text-lg" suppressHydrationWarning>{time}</span>
        {start ? (
          <div className="lm-win lm-pop absolute bottom-full left-2 mb-1 w-56">
            <p className="lm-win-bar px-2 py-1 font-pixel text-lg">Find me on</p>
            <ul className="p-1">
              {data.socials.map((s, i) => (
                <li key={i}>
                  <a href={s.url} {...linkTarget(mode, s.url)} className="flex items-center gap-2 px-2 py-1.5 font-pixel text-lg hover:bg-[#1d1d1b] hover:text-[#fffdf4]">
                    <SocialIcon platform={s.platform} size={16} /> {platformLabel(s.platform)}
                  </a>
                </li>
              ))}
              {data.socials.length === 0 ? <li className="px-2 py-1.5 font-pixel text-lg opacity-60">Nothing here</li> : null}
            </ul>
          </div>
        ) : null}
      </div>
    </ThemeRoot>
  );
}
