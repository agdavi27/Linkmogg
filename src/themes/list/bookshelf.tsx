"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import { Particles, buzz, tick } from "../motion";
import type { ThemeProps, ThemeLink } from "../types";

const SPINES = [
  ["#7a2e2a", "#f1d9a7"], ["#1f4d45", "#e9dcb8"], ["#2b3a67", "#eadfc4"], ["#a3672b", "#2a1a0c"],
  ["#4b2f4f", "#efd9b4"], ["#c8b48a", "#3b2a14"], ["#33402a", "#e5d3a2"], ["#8c4a2f", "#f3e2bd"], ["#16324f", "#e7c977"],
];
const spineOf = (l: ThemeLink) => SPINES[hash(l.id + l.title) % SPINES.length];

function Book({ link, out, idx, perShelf, onPick }: { link: ThemeLink; out: boolean; idx: number; perShelf: number; onPick: (el: HTMLElement) => void }) {
  const h = hash(link.id + link.title);
  const [bg, fg] = spineOf(link);
  const height = 78 + (h % 20); // % of the shelf
  const width = (100 - perShelf * 2) / perShelf - 3 + ((h >> 5) % 5); // % of the shelf
  const style = (h >> 9) % 3;
  return (
    <button type="button" onClick={(e) => onPick(e.currentTarget)} aria-label={`${link.title}. Open the book`}
      className={`lm-book group relative flex items-center justify-center overflow-hidden px-1 outline-none ${out ? "lm-book-out" : ""}`}
      style={{ ["--spine" as string]: bg, color: fg, height: `${height}%`, width: `${width}%`, animationDelay: `${idx * 60}ms` } as CSSProperties}>
      <span aria-hidden className="lm-book-leather absolute inset-0" />
      {style !== 2 ? <><span aria-hidden className="lm-book-band absolute inset-x-0 top-[7%]" /><span aria-hidden className="lm-book-band absolute inset-x-0 bottom-[7%]" /></> : <span aria-hidden className="lm-book-label absolute inset-x-[14%] top-[9%] h-[14%]" />}
      <span className="lm-spine-text relative max-h-[74%] truncate font-serif text-[clamp(13px,4cqw,18px)] font-semibold tracking-wide">{link.title}</span>
    </button>
  );
}

export default function Bookshelf({ data, mode }: ThemeProps) {
  const [open, setOpen] = useState<{ i: number; vars: CSSProperties } | null>(null);
  const [closing, setClosing] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const readRef = useRef<HTMLAnchorElement>(null);
  const n = data.links.length;
  const perShelf = n <= 8 ? 4 : 5;
  const shelves: ThemeLink[][] = [];
  data.links.forEach((l, i) => {
    if (i % perShelf === 0) shelves.push([]);
    shelves[shelves.length - 1].push(l);
  });
  if (!shelves.length) shelves.push([]);
  const current = open ? data.links[open.i] : null;

  const pick = (i: number, el: HTMLElement) => {
    const s = stage.current!.getBoundingClientRect();
    const b = el.getBoundingClientRect();
    // Where the book sits on the shelf, relative to the middle of the stage: the flight starts there.
    const bookH = Math.min(s.width * 0.44, 230, s.height * 0.52) * 1.42;
    setClosing(false);
    setOpen({ i, vars: {
      ["--fx" as string]: `${b.left + b.width / 2 - (s.left + s.width / 2)}px`,
      ["--fy" as string]: `${b.top + b.height / 2 - (s.top + s.height / 2)}px`,
      ["--fs" as string]: (b.height / bookH).toFixed(3),
      ["--spine" as string]: spineOf(data.links[i])[0],
      ["--ink" as string]: spineOf(data.links[i])[1],
    } as CSSProperties });
    tick(300, 0.06, 0.05);
    buzz(10);
  };
  const close = () => {
    setClosing(true);
    setTimeout(() => { setOpen(null); setClosing(false); }, 260);
  };

  useEffect(() => {
    if (!open || closing) return;
    const t = setTimeout(() => readRef.current?.focus({ preventScroll: true }), 900);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [open, closing]);

  return (
    <ThemeRoot data={data} mode={mode} label="Bookshelf" badgeTone="light" className="lm-bs-room relative overflow-hidden text-[#f3e6cc]">
      <div aria-hidden className="lm-bs-lamp"><span className="lm-bs-cord" /><span className="lm-bs-shade" /><span className="lm-bs-bulb" /></div>
      <div aria-hidden className="lm-bs-beam" />
      <Particles count={40} color={["#ffe9b8", "#fff6df"]} size={[0.6, 1.6]} speed={[3, 9]} angle={Math.PI / 2} spread={3} wobble={1.4} twinkle className="lm-bs-dust" />

      <div ref={stage} className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex min-h-0 w-full max-w-[560px] flex-1 flex-col px-4 pt-[clamp(60px,11cqh,96px)]">
          <div className="lm-pop flex shrink-0 items-center gap-3.5">
            <Avatar data={data} size={64} className="border-2 border-[#d9b97a]/70 bg-[#3a2718]! text-[#f3e6cc] shadow-[0_4px_12px_rgba(0,0,0,.5)]" />
            <div className="min-w-0">
              <h1 className="truncate font-serif text-[clamp(26px,8cqw,36px)] font-semibold leading-tight [text-shadow:0_2px_6px_rgba(0,0,0,.6)]">{data.displayName || `@${data.username}`}</h1>
              {data.bio ? <p className="line-clamp-2 text-[15px] leading-snug text-[#e2cfa8]">{data.bio}</p> : null}
            </div>
          </div>

          <div className="lm-case mt-[clamp(12px,3cqh,28px)] flex min-h-0 flex-1 flex-col rounded-[6px] p-3 pb-1">
            {shelves.map((row, r) => (
              <div key={r} className="relative mb-2 flex min-h-0 flex-1 flex-col" style={{ maxHeight: 230 }}>
                <div className="lm-bs-back flex min-h-0 flex-1 items-end gap-[2%] px-2" role="group" aria-label={`Shelf ${r + 1}`}>
                  {row.map((l, i) => {
                    const idx = r * perShelf + i;
                    return <Book key={l.id} link={l} idx={idx} perShelf={perShelf} out={open?.i === idx && !closing} onPick={(el) => pick(idx, el)} />;
                  })}
                  {row.length === 0 ? <p className="w-full pb-6 text-center text-sm text-[#c7b28a]">No books yet.</p> : null}
                  {row.length > 0 && row.length < perShelf ? <span aria-hidden className="lm-bookend ml-1 h-[45%] w-[7%]" /> : null}
                  {r === shelves.length - 1 && row.length < perShelf - 1 ? <span aria-hidden className="lm-bs-plant ml-auto"><i /><i /><i /></span> : null}
                </div>
                <div aria-hidden className="lm-shelf h-3.5 shrink-0 rounded-[2px]" />
              </div>
            ))}
          </div>

          <p className="shrink-0 pt-3 text-center font-serif text-[15px] italic text-[#d8c39a]">{n ? "Pull a book off the shelf" : ""}</p>
          <SocialRow socials={data.socials} mode={mode} className="shrink-0 pb-1" iconClass="text-[#efdcb5] hover:bg-white/10" />
        </div>

        {open && current ? (
          <div className={`lm-bk-overlay absolute inset-0 z-30 ${closing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-label={current.title}>
            <button type="button" aria-label="Put the book back" onClick={close} className="absolute inset-0 cursor-default bg-transparent outline-none" />
            <div className="lm-bk-stage pointer-events-none absolute inset-0 grid place-items-center">
              <div key={open.i} className="lm-bk-fly pointer-events-auto relative" style={open.vars}>
                <div className="lm-bk-page lm-bk-right absolute inset-0 flex flex-col justify-between p-[9%] text-[#2a1d14]">
                  <p className="truncate font-serif text-[clamp(12px,3.4cqw,15px)] italic text-[#7a6440]">{hostOf(current.url)}</p>
                  <div className="flex flex-col items-start gap-3">
                    <a ref={readRef} href={current.url} {...linkTarget(mode, current.url)}
                      className="rounded-[5px] bg-[#2a1d14] px-5 py-2.5 font-serif text-[16px] font-semibold text-[#f4e9d2] shadow-[0_3px_0_rgba(0,0,0,.35)] outline-none transition-transform duration-150 ease-out focus-visible:ring-2 focus-visible:ring-[#b8913f] active:scale-95">
                      Read →
                    </a>
                    <button type="button" onClick={close} className="font-serif text-[13px] italic text-[#7a6440] underline-offset-2 hover:underline">Back to the shelf</button>
                  </div>
                </div>
                <div className="lm-bk-cover absolute inset-0">
                  <div className="lm-bk-front absolute inset-0 grid place-items-center p-[12%] text-center">
                    <span aria-hidden className="lm-book-leather absolute inset-0 rounded-[inherit]" />
                    <span aria-hidden className="lm-bk-frame absolute inset-[7%]" />
                    <span className="relative line-clamp-4 font-serif text-[clamp(16px,5cqw,24px)] font-semibold leading-snug" style={{ color: "var(--ink)" }}>{current.title}</span>
                  </div>
                  <div className="lm-bk-page lm-bk-left absolute inset-0 flex flex-col justify-center gap-3 p-[10%] text-[#2a1d14]">
                    <p className="font-serif text-[12px] italic text-[#8a6f45]">Book {open.i + 1} of {n}</p>
                    <p className="line-clamp-5 font-serif text-[clamp(18px,5.4cqw,26px)] font-semibold leading-tight">{current.title}</p>
                    <span aria-hidden className="h-px w-1/3 bg-[#2a1d14]/30" />
                  </div>
                </div>
                <div aria-hidden className="lm-bk-spine absolute top-0 flex h-full items-center justify-center">
                  <span className="lm-spine-text max-h-[80%] truncate font-serif text-[13px] font-semibold" style={{ color: "var(--ink)" }}>{current.title}</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ThemeRoot>
  );
}
