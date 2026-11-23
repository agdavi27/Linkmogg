"use client";

import { useRef, useState, type CSSProperties } from "react";
import { Avatar, Empty, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { buzz, tick } from "../motion";
import type { ThemeProps } from "../types";

// Each folder gets a material. Faces only on the felt ones.
const MATERIALS = ["felt-blue", "leather", "marble", "canvas", "plastic", "wood", "felt-grey", "molded", "puffer"] as const;
type Material = (typeof MATERIALS)[number];

function Face({ mood }: { mood: "happy" | "meh" }) {
  return (
    <svg aria-hidden viewBox="0 0 60 30" className="lm-fo-face">
      {mood === "happy" ? (
        <>
          <ellipse cx="22" cy="10" rx="5" ry="7" fill="#fff" stroke="#111" strokeWidth="1.5" /><circle cx="23" cy="11" r="3" fill="#111" />
          <ellipse cx="38" cy="10" rx="5" ry="7" fill="#fff" stroke="#111" strokeWidth="1.5" /><circle cx="39" cy="11" r="3" fill="#111" />
          <path d="M24 22 q6 6 12 0" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M14 10 q6 5 12 0 z" fill="#fff" stroke="#111" strokeWidth="1.3" /><path d="M14 10 h12" stroke="#111" strokeWidth="1.8" /><circle cx="20" cy="11.4" r="1.8" fill="#111" />
          <path d="M34 10 q6 5 12 0 z" fill="#fff" stroke="#111" strokeWidth="1.3" /><path d="M34 10 h12" stroke="#111" strokeWidth="1.8" /><circle cx="40" cy="11.4" r="1.8" fill="#111" />
          <path d="M20 23 h20" stroke="#111" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

function Extras({ m }: { m: Material }) {
  if (m === "felt-blue") return <Face mood="happy" />;
  if (m === "felt-grey") return <Face mood="meh" />;
  if (m === "marble") return (
    <svg aria-hidden viewBox="0 0 100 70" preserveAspectRatio="none" className="absolute inset-0 size-full">
      <path d="M58 0 L52 14 L60 24 L48 40 L55 52 L50 70 M52 14 L30 22 L18 18 M60 24 L80 30 L92 26 M48 40 L30 48 M55 52 L72 60" fill="none" stroke="url(#lmgold)" strokeWidth="1.6" strokeLinejoin="round" />
      <defs><linearGradient id="lmgold" x1="0" x2="1"><stop offset="0" stopColor="#8a6a1c" /><stop offset=".5" stopColor="#f6d77a" /><stop offset="1" stopColor="#a07c22" /></linearGradient></defs>
    </svg>
  );
  if (m === "canvas") return <><span aria-hidden className="lm-fo-tag">Sturdy<i /></span><span aria-hidden className="lm-fo-care" /></>;
  if (m === "plastic") return <span aria-hidden className="lm-fo-board" />;
  return null;
}

export default function Folders({ data, mode }: ThemeProps) {
  const [open, setOpen] = useState<number | null>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const n = data.links.length;
  const cols = n <= 4 ? 2 : n <= 9 ? 3 : 4;

  const pick = (i: number) => {
    if (open === i) { refs.current[i]?.click(); return; }
    setOpen(i);
    tick(900, 0.025, 0.04);
    buzz(6);
  };

  return (
    <ThemeRoot data={data} mode={mode} label="Folders" className="lm-fo-bg bg-[#e4e4e2] text-[#1a1a1a]">
      <div className="relative mx-auto flex min-h-0 w-full max-w-[760px] flex-1 flex-col px-5 pt-[clamp(14px,4cqh,40px)]">
        <header className="lm-fo-in flex shrink-0 items-center gap-3">
          <Avatar data={data} size={48} className="bg-white! text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,.12)]" />
          <div className="min-w-0">
            <h1 className="truncate text-[clamp(20px,5.6cqw,28px)] font-semibold tracking-[-0.02em]">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="line-clamp-2 text-[12.5px] leading-snug text-[#1a1a1a]/55">{data.bio}</p> : null}
          </div>
        </header>

        <ul className="mt-[clamp(12px,3.5cqh,36px)] grid min-h-0 flex-1 content-center gap-x-[clamp(10px,4cqw,40px)] gap-y-[clamp(6px,2cqh,24px)]" aria-label="Links"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridAutoRows: `minmax(0, ${Math.round(100 / Math.ceil(Math.max(1, n) / cols))}%)` }}
          onPointerLeave={(e) => { if (e.pointerType === "mouse") setOpen(null); }}>
          {data.links.map((l, i) => {
            const m = MATERIALS[(i + hash(data.username)) % MATERIALS.length];
            const on = open === i;
            return (
              <li key={l.id} className="lm-fo-cell flex min-h-0 flex-col items-center justify-center" style={{ animationDelay: `${i * 50}ms` }}>
                <button type="button" onClick={() => pick(i)} onPointerEnter={(e) => { if (e.pointerType === "mouse") setOpen(i); }}
                  aria-label={`${l.title}${on ? ", open. Press again to visit" : ""}`} aria-expanded={on}
                  className={`lm-fo group relative aspect-[1.3] max-h-full w-full max-w-[220px] min-h-0 shrink outline-none ${on ? "is-open" : ""}`}
                  style={{ ["--tilt" as string]: `${((hash(l.id) % 5) - 2) * 0.6}deg` } as CSSProperties}>
                  <span aria-hidden className={`lm-fo-back mat-${m}`} />
                  <span className="lm-fo-paper">
                    <span className="block truncate text-[clamp(8px,2.2cqw,11px)] font-semibold text-[#1a1a1a]/70">{hostOf(l.url)}</span>
                    <span className="mt-0.5 block text-[clamp(8px,2.2cqw,11px)] font-bold text-[#2f6fd6]">Open ↗</span>
                  </span>
                  <span aria-hidden className="lm-fo-paper lm-fo-paper-2" />
                  <span aria-hidden className={`lm-fo-front mat-${m}`}><Extras m={m} /></span>
                </button>
                <span className="mt-1.5 w-full truncate text-center text-[clamp(11px,3.2cqw,14px)] font-medium">{l.title}</span>
                <a ref={(el) => { refs.current[i] = el; }} href={l.url} {...linkTarget(mode, l.url)} tabIndex={-1} aria-hidden className="hidden">{l.title}</a>
              </li>
            );
          })}
        </ul>
        {n === 0 ? <Empty className="mt-6" /> : null}
        <SocialRow socials={data.socials} mode={mode} className="shrink-0 py-1" iconClass="size-9! text-[#1a1a1a]/70 hover:bg-black/5" size={18} />
      </div>
    </ThemeRoot>
  );
}
