"use client";

import { useRef, type CSSProperties } from "react";
import { Empty, ThemeRoot, hostOf, linkTarget } from "../shared";
import { buzz, useSize } from "../motion";
import type { ThemeProps } from "../types";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";

const COLS = 6;

/** Someone holds a thin grid poster up to the window. Your name and links are the type on it. */
export default function Poster({ data, mode }: ThemeProps) {
  const stage = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(stage);
  const n = data.links.length;
  const name = data.displayName || data.username;

  // The poster keeps a paper shape and fills most of the screen.
  const PH = Math.min(h * 0.8, (w * 0.9) / 0.7);
  const PW = Math.min(w * 0.9, PH * 0.7);
  const top = h * 0.1;
  const left = (w - PW) / 2;
  const rows = Math.max(9, n + 3); // name, links, footer, and some breathing room
  const gridH = PH * 0.84;
  const rowH = gridH / rows;
  const longest = Math.max(name.length, ...data.links.map((l) => Math.min(l.title.length, 20)));
  const fs = Math.max(13, Math.min(rowH * 0.82, (PW * 0.8) / (longest * 0.52)));

  return (
    <ThemeRoot data={data} mode={mode} label="Poster" className="lm-po text-[#151515]">
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        <div aria-hidden className="lm-po-light" />
        {w > 0 ? (
          <div className="lm-po-holder absolute inset-0">
            {/* the person behind the poster */}
            <div aria-hidden className="lm-po-scarf" style={{ left: left + PW * 0.3, width: PW * 0.4, top: top - PH * 0.09, height: PH * 0.13 }} />
            <div aria-hidden className="lm-po-arm" style={{ left: left - PW * 0.06, top: top + PH * 0.02, width: PW * 0.16, height: PH * 0.55, rotate: "6deg" }} />
            <div aria-hidden className="lm-po-arm" style={{ left: left + PW * 0.9, top: top + PH * 0.02, width: PW * 0.16, height: PH * 0.55, rotate: "-6deg" }} />
            <div aria-hidden className="lm-po-legs" style={{ left: left + PW * 0.22, width: PW * 0.56, top: top + PH * 0.9, height: h }} />

            {/* the poster */}
            <div className="lm-po-sheet absolute flex flex-col" style={{ left, top, width: PW, height: PH }}>
              <div aria-hidden className="lm-po-shadow" />
              <div aria-hidden className="lm-po-grid" style={{ top: PH * 0.06, height: gridH, ["--rows" as string]: rows, ["--cols" as string]: COLS } as CSSProperties} />
              <div className="relative flex min-h-0 flex-1 flex-col" style={{ paddingLeft: PW * 0.15, paddingRight: PW * 0.08, paddingTop: PH * 0.06, ["--fs" as string]: `${fs}px`, ["--rh" as string]: `${rowH}px` } as CSSProperties}>
                <h1 className="lm-po-line lm-po-in truncate" style={{ animationDelay: "150ms" }}>{name}</h1>
                <ul aria-label="Links" className="min-h-0">
                  {data.links.map((l, i) => (
                    <li key={l.id} className="lm-po-in" style={{ animationDelay: `${260 + i * 90}ms` }}>
                      <a href={l.url} {...linkTarget(mode, l.url)} onPointerDown={() => buzz(5)} className="lm-po-line lm-po-link group block truncate outline-none">
                        {l.title}<span aria-hidden className="lm-po-arrow">↗</span>
                      </a>
                    </li>
                  ))}
                </ul>
                {n === 0 ? <Empty className="mt-4 text-left" /> : null}
              </div>
              <div className="relative grid shrink-0 grid-cols-3 gap-2 leading-[1.3] text-[#151515]/80" style={{ padding: `0 ${PW * 0.08}px ${PH * 0.045}px ${PW * 0.15}px`, fontSize: Math.max(6.5, Math.min(PW * 0.016, 10)) }}>
                <p className="line-clamp-3">{data.bio || name}</p>
                <ul aria-label="Social profiles">
                  {data.socials.slice(0, 3).map((s, i) => (
                    <li key={i}><a href={s.url} {...linkTarget(mode, s.url)} className="hover:underline">{platformLabel(s.platform)}</a></li>
                  ))}
                </ul>
                <p>@{data.username}<br />{n} link{n === 1 ? "" : "s"}<br />{data.links[0] ? hostOf(data.links[0].url) : ""}</p>
              </div>
            </div>

            {/* hands over the top corners */}
            <Hand style={{ left: left - PW * 0.035, top: top - PW * 0.05, width: PW * 0.15 }} />
            <Hand flip style={{ left: left + PW * 0.885, top: top - PW * 0.05, width: PW * 0.15 }} />
          </div>
        ) : null}

        {/* the same footer as the Billboard: a quiet row of social icons */}
        {data.socials.length ? (
          <ul className="absolute inset-x-0 bottom-0 z-20 flex justify-center gap-1 pb-1" aria-label="Social profiles">
            {data.socials.map((s, i) => (
              <li key={i}><a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)} className="grid size-9 place-items-center rounded-full bg-white/70 text-[#151515] backdrop-blur transition-colors hover:bg-white"><SocialIcon platform={s.platform} size={18} /></a></li>
            ))}
          </ul>
        ) : null}
      </div>
    </ThemeRoot>
  );
}

function Hand({ style, flip }: { style: CSSProperties; flip?: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 60 70" className="lm-po-hand pointer-events-none absolute" style={{ ...style, transform: flip ? "scaleX(-1)" : undefined }}>
      <defs>
        <linearGradient id="lm-po-skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2c7ad" /><stop offset=".6" stopColor="#d99c7f" /><stop offset="1" stopColor="#b8775c" />
        </linearGradient>
      </defs>
      {/* back of the hand, then four fingers curling over the front of the paper */}
      <path d="M8 4 C 22 -2, 40 2, 44 14 L 46 30 C 40 34, 20 34, 12 28 Z" fill="url(#lm-po-skin)" />
      <rect x="13" y="20" width="9" height="30" rx="4.5" fill="url(#lm-po-skin)" />
      <rect x="22" y="22" width="9" height="34" rx="4.5" fill="url(#lm-po-skin)" />
      <rect x="31" y="22" width="9" height="32" rx="4.5" fill="url(#lm-po-skin)" />
      <rect x="40" y="20" width="8" height="26" rx="4" fill="url(#lm-po-skin)" />
      <path d="M22 26 v24 M31 27 v26 M40 26 v22" stroke="#a7654b" strokeOpacity=".35" strokeWidth=".8" fill="none" />
    </svg>
  );
}
