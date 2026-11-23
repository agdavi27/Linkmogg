"use client";

import { useRef, useState } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

function Reel({ spinning }: { spinning: boolean }) {
  return (
    <span aria-hidden className={`lm-reel relative grid size-[54px] place-items-center rounded-full ${spinning ? "lm-spin" : ""}`}>
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <span key={a} className="absolute h-[10px] w-[4px] rounded-sm bg-[#f5efe3]" style={{ transform: `rotate(${a}deg) translateY(-15px)` }} />
      ))}
    </span>
  );
}

export default function Mixtape({ data, mode }: ThemeProps) {
  const [track, setTrack] = useState<number | null>(null);
  const playRef = useRef<HTMLAnchorElement>(null);
  const current = track !== null ? data.links[track] : null;

  return (
    <ThemeRoot data={data} mode={mode} label="Mixtape" badgeTone="light"
      className="bg-[#1d2b2a] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.025)_0_2px,transparent_2px_9px)] text-[#f5efe3]">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pt-8">
        {/* Cassette */}
        <div className="lm-cassette relative mx-auto w-full max-w-[360px] rounded-[14px] p-3">
          <div className="rounded-md bg-[#f5efe3] px-3 pb-3 pt-2 text-[#2a2420]">
            <div className="flex items-baseline justify-between border-b-2 border-[#e2573b] pb-1">
              <span className="font-hand min-w-0 truncate text-2xl leading-none">{data.displayName || `@${data.username}`}</span>
              <span className="pl-2 text-[10px] font-bold tracking-[.2em] text-[#e2573b]">A</span>
            </div>
            <div className="mt-2 flex items-center justify-between rounded-full bg-[#2a2420] px-3 py-1.5">
              <Reel spinning={current !== null} />
              <div aria-hidden className="lm-tape-window mx-2 h-8 flex-1 rounded-sm" />
              <Reel spinning={current !== null} />
            </div>
            <p className="mt-2 truncate text-center text-[11px] text-[#6b5e52]" aria-live="polite">
              {current ? `Now playing: ${current.title}` : data.bio || "Pick a track"}
            </p>
          </div>
          <div aria-hidden className="mx-auto mt-2 h-4 w-3/5 rounded-b-lg bg-black/25" />
        </div>

        <div className="mt-4 flex justify-center">
          {current ? (
            <a ref={playRef} href={current.url} {...linkTarget(mode, current.url)}
              className="inline-flex items-center gap-2 rounded-full bg-[#e2573b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_6px_0_#8f2f1d] transition-[transform,box-shadow] duration-100 active:translate-y-1 active:shadow-[0_2px_0_#8f2f1d]">
              <span aria-hidden>▶</span> Play {current.title}
            </a>
          ) : <span className="h-[46px]" />}
        </div>

        {/* J-card */}
        <section className="lm-jcard mt-5 rounded-md p-4 text-[#2a2420]" aria-label="Track list">
          <h2 className="text-[10px] font-bold tracking-[.25em] text-[#e2573b]">SIDE A</h2>
          <ol className="mt-2 divide-y divide-dashed divide-[#2a2420]/20">
            {data.links.map((l, i) => (
              <li key={l.id}>
                <button type="button" onClick={() => (track === i ? playRef.current?.click() : setTrack(i))}
                  aria-pressed={track === i}
                  className={`flex w-full items-center gap-3 py-2 text-left outline-none focus-visible:bg-[#e2573b]/10 ${track === i ? "text-[#e2573b]" : ""}`}>
                  <span className="w-6 shrink-0 font-mono text-xs opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-hand min-w-0 flex-1 truncate text-xl leading-tight">{l.title}</span>
                  <span className="max-w-[38%] shrink-0 truncate text-[10px] opacity-50">{hostOf(l.url)}</span>
                </button>
              </li>
            ))}
            {data.links.length === 0 ? <li className="font-hand py-2 text-xl opacity-50">Blank tape</li> : null}
          </ol>
          {data.socials.length ? (
            <>
              <h2 className="mt-4 text-[10px] font-bold tracking-[.25em] text-[#e2573b]">SIDE B</h2>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {data.socials.map((s, i) => (
                  <li key={i}>
                    <a href={s.url} {...linkTarget(mode, s.url)}
                      className="flex items-center gap-1.5 rounded-full border border-[#2a2420]/20 px-2.5 py-1 text-xs transition-colors hover:bg-[#2a2420]/5">
                      <SocialIcon platform={s.platform} size={14} /> {platformLabel(s.platform)}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </section>
        <div className="h-6" />
      </div>
    </ThemeRoot>
  );
}
