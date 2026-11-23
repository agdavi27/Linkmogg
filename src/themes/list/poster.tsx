"use client";

import { useRef, type CSSProperties } from "react";
import { Empty, ThemeRoot, hostOf, linkTarget } from "../shared";
import { buzz, useParallax, useSize } from "../motion";
import type { ThemeProps } from "../types";
import { platformLabel } from "@/lib/socials/platforms";

const COLS = 6;

/** A backlit grid poster. Your name and every link are set in big stacked type, one per row. */
export default function Poster({ data, mode }: ThemeProps) {
  const stage = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const { w, h } = useSize(sheet);
  const n = data.links.length;
  const name = data.displayName || data.username;
  const rows = n + 2; // name, links, footer
  const rowH = h > 0 ? (h * 0.86) / rows : 0;
  const longest = Math.max(name.length, ...data.links.map((l) => Math.min(l.title.length, 22)));
  const fs = Math.max(14, Math.min(rowH * 0.78, (w * 0.84) / (longest * 0.53), 92));

  return (
    <ThemeRoot data={data} mode={mode} label="Poster" className="lm-po bg-[#ece8df] text-[#141414]">
      <div ref={stage} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-[clamp(12px,5cqw,48px)] py-[clamp(12px,3cqh,32px)]">
        <div aria-hidden className="lm-po-window" />
        <div aria-hidden className="lm-po-figure" />
        <div ref={sheet} className="lm-po-sheet relative flex h-full w-full max-w-[620px] flex-col" style={{ maxHeight: "min(100%, 900px)" }}>
          <div aria-hidden className="lm-po-grid" style={{ ["--rows" as string]: rows, ["--cols" as string]: COLS } as CSSProperties} />
          <div className="relative flex min-h-0 flex-1 flex-col px-[10%] pt-[6%]" style={{ ["--fs" as string]: `${fs}px`, ["--rh" as string]: `${rowH}px` } as CSSProperties}>
            <h1 className="lm-po-line lm-po-in truncate" style={{ animationDelay: "120ms" }}>{name}</h1>
            <ul aria-label="Links" className="min-h-0">
              {data.links.map((l, i) => (
                <li key={l.id} className="lm-po-in" style={{ animationDelay: `${220 + i * 90}ms` }}>
                  <a href={l.url} {...linkTarget(mode, l.url)} onPointerDown={() => buzz(5)} className="lm-po-line lm-po-link group block truncate outline-none">
                    {l.title}<span aria-hidden className="lm-po-arrow">↗</span>
                  </a>
                </li>
              ))}
            </ul>
            {n === 0 ? <Empty className="mt-4 text-left" /> : null}
            <div className="mt-auto grid shrink-0 grid-cols-3 gap-3 pb-[6%] pt-2 text-[clamp(7.5px,1.9cqmin,10px)] leading-[1.35] text-[#141414]/75">
              <p className="line-clamp-4">{data.bio || name}</p>
              <ul aria-label="Social profiles">
                {data.socials.slice(0, 4).map((s, i) => (
                  <li key={i}><a href={s.url} {...linkTarget(mode, s.url)} className="hover:underline">{platformLabel(s.platform)}</a></li>
                ))}
              </ul>
              <p>@{data.username}<br />{n} link{n === 1 ? "" : "s"}<br />{data.links[0] ? hostOf(data.links[0].url) : ""}</p>
            </div>
          </div>
        </div>
      </div>
    </ThemeRoot>
  );
}
