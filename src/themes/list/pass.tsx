"use client";

import { useRef, type CSSProperties } from "react";
import { Empty, SocialRow, ThemeRoot, hash, initials, linkTarget, hostOf } from "../shared";
import { buzz, tick, useParallax, useSize } from "../motion";
import type { ThemeProps } from "../types";

/** A worn, teal member card: your photo on a height chart, your links typed into the fields. */
export default function Pass({ data, mode }: ThemeProps) {
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const { w, h } = useSize(stage);
  const n = data.links.length;
  const name = data.displayName || data.username;
  const serial = String(hash(data.username) % 900000 + 100000);
  const wide = w > h * 1.05; // landscape card on wide screens, portrait card on phones
  const cols = wide ? (n > 6 ? 2 : 1) : n > 8 ? 2 : 1;

  const photo = (
    <div className="lm-ps-photo relative shrink-0 overflow-hidden" style={wide ? { width: "30%" } : { width: "40%" }}>
      <div aria-hidden className="lm-ps-chart absolute inset-0" />
      {data.avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={data.avatarUrl} alt="" className="lm-ps-face absolute inset-x-0 bottom-[22%] mx-auto h-[70%] w-[78%] object-cover object-top" />
        : <span aria-hidden className="lm-ps-face absolute inset-x-0 bottom-[22%] mx-auto grid h-[70%] w-[78%] place-items-center bg-[#3a3a36] font-display text-[clamp(28px,9cqmin,64px)] font-bold text-white/80">{initials(name)}</span>}
      <div className="absolute inset-x-[6%] bottom-[5%] bg-[#141412] px-2 py-1.5 text-center font-mono text-[clamp(8px,2.2cqmin,12px)] uppercase leading-tight text-white/90">
        <span className="block truncate">{name}</span>
        <span className="block opacity-70">LM {serial}</span>
      </div>
    </div>
  );

  return (
    <ThemeRoot data={data} mode={mode} label="Pass" badgeTone="light" className="lm-ps bg-[#1b1f1e] text-[#14302e]">
      <div ref={stage} className="relative flex min-h-0 flex-1 items-center justify-center p-[clamp(12px,4cqmin,40px)]">
        <div className="lm-ps-card relative flex min-h-0 w-full flex-col overflow-hidden"
          style={wide ? { maxWidth: 860, aspectRatio: "1.5", maxHeight: "100%" } : { maxWidth: 460, height: "100%", maxHeight: 760 }}>
          <div aria-hidden className="lm-ps-wear" />
          {/* top strip */}
          <div className="relative flex shrink-0 items-center justify-between gap-3 px-[4%] pt-[3%]">
            <span className="lm-ps-tab truncate font-mono text-[clamp(8px,2cqmin,11px)] uppercase tracking-[0.2em]">Member card · Linkmogg</span>
            <span aria-hidden className="size-[clamp(14px,3cqmin,22px)] shrink-0 rounded-full border-[3px] border-[#6a3fd1]/80 border-r-transparent" />
          </div>

          <div className={`relative flex min-h-0 flex-1 gap-[4%] p-[4%] ${wide ? "flex-row" : "flex-col"}`}>
            {wide ? photo : (
              <div className="flex shrink-0 gap-[4%]" style={{ height: "34%" }}>
                {photo}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                  <Field label="Name"><h1 className="truncate">{name}</h1></Field>
                  <Field label="Handle"><span className="truncate">@{data.username}</span></Field>
                </div>
              </div>
            )}

            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {wide ? (
                <div className="grid shrink-0 grid-cols-2 gap-x-4">
                  <Field label="Name"><h1 className="truncate">{name}</h1></Field>
                  <Field label="Handle"><span className="truncate">@{data.username}</span></Field>
                </div>
              ) : null}
              {data.bio ? <Field label="Note" className="mt-2 shrink-0"><p className="line-clamp-2 text-[0.8em] leading-snug">{data.bio}</p></Field> : null}

              <p className="lm-ps-label mt-[clamp(6px,2cqmin,14px)] shrink-0">Links</p>
              <ul className="grid min-h-0 flex-1 gap-x-4" aria-label="Links" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))`, gridAutoRows: "minmax(0, 46px)", alignContent: "start" }}>
                {data.links.map((l, i) => (
                  <li key={l.id} className="lm-ps-row min-h-0" style={{ animationDelay: `${450 + i * 70}ms` }}>
                    <a href={l.url} {...linkTarget(mode, l.url)} onPointerDown={() => { tick(300, 0.04, 0.03); buzz(6); }}
                      className="group flex h-full items-center gap-2 border-b border-dashed border-[#14302e]/30 outline-none focus-visible:bg-white/30">
                      <span className="shrink-0 font-mono text-[0.7em] text-[#14302e]/55">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1 truncate font-mono text-[clamp(12px,3.4cqmin,18px)] tracking-[-0.02em] transition-colors group-hover:text-[#6a3fd1]">{l.title}</span>
                      {cols === 1 ? <span className="hidden shrink-0 truncate text-[10px] text-[#14302e]/50 min-[420px]:block">{hostOf(l.url)}</span> : null}
                      <span aria-hidden className="shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                    </a>
                  </li>
                ))}
              </ul>
              {n === 0 ? <Empty /> : null}
            </div>
          </div>

          {/* bottom: serial number and stamp */}
          <div className="relative flex shrink-0 items-end justify-between gap-3 px-[4%] pb-[3%]">
            <div>
              <span className="lm-ps-serial block font-mono text-[clamp(22px,7cqmin,46px)] font-bold leading-none tracking-[-0.04em]">{serial.slice(0, 3)}<span className="opacity-70">·</span>{serial.slice(3)}</span>
              <span className="lm-ps-label">Card no.</span>
            </div>
            <SocialRow socials={data.socials} mode={mode} className="flex-nowrap!" iconClass="size-8! text-[#14302e] hover:bg-black/10" size={16} />
          </div>
          <span aria-hidden className="lm-ps-stamp" style={{ ["--r" as string]: `${(hash(name) % 10) - 14}deg` } as CSSProperties}>
            {data.username.length > 12 ? "Verified" : `@${data.username}`}
          </span>
        </div>
      </div>
    </ThemeRoot>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <span className="lm-ps-label">{label}</span>
      <div className="truncate font-mono text-[clamp(14px,4.2cqmin,24px)] font-semibold uppercase leading-tight tracking-[-0.02em]">{children}</div>
    </div>
  );
}
