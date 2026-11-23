"use client";

import { useRef, useState, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { Empty, ThemeRoot, hash, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, useParallax, useSize } from "../motion";
import type { ThemeProps } from "../types";

// The card is drawn at this size and scaled to fit, so every line stays where it belongs.
const CW = 735, CH = 523;
const ROWS: [string, string][] = [["階級", "GRADE"], ["軍籍號碼", "SERVICE NO"], ["年齡", "AGE"], ["服務單位", "SECTION"], ["有效日期", "DATE EXPIRED"]];
const PER = ROWS.length;

/** An old turquoise ID card. Your photo on the left, your links typed into its fields. */
export default function Id({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const pages = Math.max(1, Math.ceil(n / PER));
  const [page, setPage] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const { w, h } = useSize(stage);
  const name = (data.displayName || data.username).trim();
  const k = Math.min((w * 0.94) / CW, (h * 0.86) / CH, 1.5);

  // "Juno Park" reads as "PARK, JUNO" on the card.
  const parts = name.split(/\s+/);
  const formal = parts.length > 1 ? `${parts.slice(-1)[0]}, ${parts.slice(0, -1).join(" ")}` : name;
  const serial = String(hash(data.username) % 1000000).padStart(6, "0");
  const service = `LM${String(hash(`${data.username}s`) % 100000000).padStart(8, "0")}`;
  const rows = data.links.slice(page * PER, page * PER + PER);

  return (
    <ThemeRoot data={data} mode={mode} label="ID" className="lm-id bg-[#e9e6df] text-[#1f2a33]">
      <div ref={stage} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {w > 0 ? (
          <div className="lm-id-tilt" style={{ width: CW * k, height: CH * k }}>
            <article className="lm-id-card relative origin-top-left" style={{ width: CW, height: CH, transform: `scale(${k})` }} aria-label={`${name}'s card`}>
              <div aria-hidden className="lm-id-grain" />

              {/* upside-down label tape along the top */}
              <div aria-hidden className="absolute left-[48px] top-0 flex h-[26px] items-center">
                <span className="lm-id-tape flex h-full w-[214px] rotate-180 items-center justify-center text-[10px] tracking-[0.12em]">LINKMOGG · @{data.username.toUpperCase()}</span>
                <span className="lm-id-tape ml-[3px] flex h-full w-[34px] rotate-180 items-center justify-center text-[10px]">{new Date().getFullYear()}</span>
              </div>

              {/* photo against a height chart, with the name plate under it */}
              <div className="absolute left-[36px] top-[62px] h-[300px] w-[214px] overflow-hidden bg-[#ddd9cc]">
                <div aria-hidden className="lm-id-chart absolute inset-0">
                  {["6'", "5'9\"", "5'6\"", "5'3\""].map((t, i) => (
                    <span key={t} className="absolute left-[4px] text-[9px] text-black/55" style={{ top: 20 + i * 46 }}>{t}</span>
                  ))}
                </div>
                {data.avatarUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={data.avatarUrl} alt="" className="lm-id-photo absolute inset-x-[16px] bottom-[94px] top-[14px] h-[192px] w-[182px] object-cover" />
                  : <Silhouette />}
                <div className="absolute inset-x-0 bottom-0 flex h-[94px] flex-col items-center justify-center bg-[#151515] px-2 text-center font-serif text-[17px] uppercase leading-[1.15] text-white">
                  <span className="block max-w-full truncate">{formal.split(",")[0]},</span>
                  <span className="block max-w-full truncate">{formal.split(",").slice(1).join(",").trim() || data.username}</span>
                  <span className="mt-0.5 block text-[16px]">{service.slice(0, 2)} {service.slice(2)}</span>
                </div>
              </div>

              {/* serial number, stamped */}
              <p aria-hidden className="lm-id-serial absolute left-[34px] top-[392px] flex items-end gap-1 text-[52px] leading-none">{serial}<span className="mb-1 text-[26px]">號</span></p>
              <p className="absolute left-[36px] top-[474px] text-[19px] tracking-[0.04em] text-[#1d2b33]">CARD SERIAL NO.</p>

              <span aria-hidden className="absolute bottom-[14px] left-[270px] top-[10px] w-[2px] bg-[#2f4b47]/70" />

              {/* name block */}
              <div className="absolute left-[272px] right-[14px] top-[8px] h-[150px] border-b-2 border-[#2f4b47]/70">
                <span aria-hidden className="absolute left-[10px] top-[6px] text-[20px]">姓</span>
                <span aria-hidden className="absolute left-[10px] top-[118px] text-[20px]">名</span>
                <span aria-hidden className="absolute left-[38px] top-[48px] origin-center -rotate-90 text-[18px] tracking-[0.1em]">NAME</span>
                <span aria-hidden className="absolute bottom-[10px] left-[72px] top-[10px] w-[2px] bg-[#2f4b47]/60" />
                <h1 className="absolute left-[86px] right-[8px] top-[16px] flex items-baseline gap-3">
                  <span className="lm-id-type max-w-[260px] truncate text-[38px] leading-none">@{data.username}</span>
                  <span className="lm-id-type shrink-0 text-[18px]">(HANDLE)</span>
                </h1>
                <p className="absolute left-[86px] right-[8px] top-[84px] flex items-baseline gap-3">
                  <span className="lm-id-type max-w-[250px] truncate text-[27px] uppercase leading-none">{formal}</span>
                  <span className="lm-id-type shrink-0 text-[18px]">(IN ENGLISH)</span>
                </p>
              </div>

              {/* the fields: one typed link per line */}
              <ul className="absolute left-[272px] right-[14px] top-[160px]" aria-label="Links">
                {ROWS.map(([zh, en], i) => {
                  const l = rows[i];
                  return (
                    <li key={en} className="relative flex h-[70px] items-end border-b-2 border-[#2f4b47]/50 pb-[8px] last:border-b-0">
                      <span aria-hidden className="w-[142px] shrink-0 pl-[14px] leading-none">
                        <span className="block text-[17px] tracking-[0.3em]">{zh}</span>
                        <span className="mt-[4px] block text-[17px]">{en}</span>
                      </span>
                      {l ? (
                        <a key={l.id} href={l.url} {...linkTarget(mode, l.url)} onPointerDown={() => buzz(5)}
                          className="lm-id-type lm-id-link min-w-0 flex-1 truncate text-[26px] leading-none outline-none" style={{ animationDelay: `${120 + i * 90}ms` } as CSSProperties}>
                          {l.title}<span aria-hidden className="lm-id-arrow"> ↗</span>
                        </a>
                      ) : <span aria-hidden className="lm-id-type flex-1 text-[26px] leading-none opacity-30">—</span>}
                    </li>
                  );
                })}
              </ul>

              {/* the big purple stamp */}
              <p aria-hidden className="lm-id-stamp absolute left-[282px] top-[402px] max-w-[220px] truncate text-[40px] uppercase leading-none">{name.split(/\s+/)[0]}</p>

              {/* a little art from the first link, like a corner sticker */}
              {data.links[0] ? <LinkArt link={data.links[0]} className="lm-id-sticker absolute right-[18px] top-[20px] size-[40px] rounded-full" icon={0} mark={false} /> : null}
              {n === 0 ? <Empty className="absolute left-[300px] top-[260px]" /> : null}
            </article>
          </div>
        ) : null}
      </div>

      <div className="relative z-10 flex shrink-0 flex-col items-center gap-2 px-4 pb-1">
        {pages > 1 ? (
          <div className="flex items-center gap-3 font-mono text-[12px]">
            <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="lm-id-flip" aria-label="Previous card side">‹</button>
            <span aria-live="polite">Card {page + 1} of {pages}</span>
            <button type="button" onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} className="lm-id-flip" aria-label="Next card side">›</button>
          </div>
        ) : <p className="font-mono text-[11px] text-black/45">Tap a typed line to open it</p>}
        {data.socials.length ? (
          <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 font-mono text-[11px] uppercase" aria-label="Social profiles">
            {data.socials.map((s, i) => <li key={i}><a href={s.url} {...linkTarget(mode, s.url)} className="text-black/60 hover:text-black hover:underline">{platformLabel(s.platform)}</a></li>)}
          </ul>
        ) : null}
      </div>
    </ThemeRoot>
  );
}

/** A plain head-and-shoulders shape for people without a photo. */
function Silhouette() {
  return (
    <svg aria-hidden viewBox="0 0 182 192" className="lm-id-photo absolute left-[16px] top-[14px] h-[192px] w-[182px]">
      <ellipse cx="96" cy="74" rx="38" ry="46" fill="#4a4a48" />
      <path d="M20 192 C 26 136, 60 122, 96 122 C 132 122, 166 136, 172 192 Z" fill="#3a3a38" />
      <path d="M58 52 C 62 22, 128 18, 134 54 C 120 40, 76 40, 58 52 Z" fill="#2a2a28" />
    </svg>
  );
}
