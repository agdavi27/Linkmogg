"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { ThemeRoot, hostOf, linkTarget } from "../shared";
import { buzz, tick, useParallax } from "../motion";
import type { ThemeProps } from "../types";

function Reel({ spinning, tape }: { spinning: boolean; tape: number }) {
  // tape: 0..1, how much tape is wound on this reel
  return (
    <span aria-hidden className="relative grid size-[64px] place-items-center">
      <span className="lm-mx-tape absolute rounded-full transition-[width,height] duration-[1200ms] ease-in-out" style={{ width: `${44 + tape * 56}%`, height: `${44 + tape * 56}%` }} />
      <span className={`lm-reel relative grid size-[44%] place-items-center rounded-full ${spinning ? "lm-spin" : ""}`}>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <span key={a} className="absolute h-[5px] w-[3px] rounded-[1px] bg-[#2a2420]" style={{ transform: `rotate(${a}deg) translateY(-9px)` }} />
        ))}
      </span>
    </span>
  );
}

export default function Mixtape({ data, mode }: ThemeProps) {
  const [track, setTrack] = useState<number | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const playRef = useRef<HTMLAnchorElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const current = track !== null ? data.links[track] : null;
  const n = Math.max(1, data.links.length);
  const progress = track === null ? 0 : (track + 1) / n;
  const playing = track !== null;

  useEffect(() => {
    if (!key) return;
    const t = setTimeout(() => setKey(null), 180);
    return () => clearTimeout(t);
  }, [key]);

  const choose = (i: number) => {
    if (track === i) { playRef.current?.click(); return; }
    setTrack(i);
    setKey("play");
    tick(240, 0.07, 0.07);
    buzz(14);
  };
  const stop = () => { setTrack(null); setKey("stop"); tick(200, 0.05, 0.06); };
  const deck = (k: string) => {
    if (k === "rew") skip(-1);
    else if (k === "ff") skip(1);
    else if (k === "stop") stop();
    else if (current) playRef.current?.click();
    else choose(0);
  };
  const skip = (d: number) => { if (!data.links.length) return; setKey(d > 0 ? "ff" : "rew"); choose(((track ?? -1) + d + data.links.length) % data.links.length); };

  return (
    <ThemeRoot data={data} mode={mode} label="Mixtape" badgeTone="light" className="lm-mx-bg relative overflow-hidden text-[#f5efe3]">
      <div ref={stage} className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pt-8">
        {/* Cassette */}
        <div className="lm-mx-in">
          <div className="lm-cassette relative mx-auto w-full max-w-[360px] rounded-[16px] p-3">
            {[["left-2 top-2"], ["right-2 top-2"], ["left-2 bottom-2"], ["right-2 bottom-2"]].map(([c]) => <span key={c} aria-hidden className={`lm-mx-screw absolute ${c}`} />)}
            <div className="lm-mx-label relative rounded-[6px] px-3 pb-3 pt-2 text-[#2a2420]">
              <div className="flex items-baseline justify-between border-b-2 border-[#e2573b] pb-1">
                <h1 className="font-hand min-w-0 truncate text-[26px] leading-none">{data.displayName || `@${data.username}`}</h1>
                <span className="pl-2 text-[11px] font-black text-[#e2573b]">A</span>
              </div>
              <div className="lm-mx-stripes mt-1 h-[6px]" aria-hidden />
              <div className="mt-2 flex items-center justify-between rounded-[30px] bg-[#211c19] px-3 py-1 shadow-[inset_0_2px_6px_rgba(0,0,0,.8)]">
                <Reel spinning={playing} tape={1 - progress} />
                <div aria-hidden className="lm-tape-window relative mx-1 h-9 flex-1 overflow-hidden rounded-[3px]">
                  <span className={`lm-mx-tapeline absolute inset-x-0 top-1/2 h-[3px] ${playing ? "lm-mx-moving" : ""}`} />
                </div>
                <Reel spinning={playing} tape={progress} />
              </div>
              <p className="mt-2 truncate text-center text-[11px] font-medium text-[#6b5e52]">{data.bio || "Side A"}</p>
            </div>
            <div aria-hidden className="mx-auto mt-2 flex h-5 w-3/5 items-center justify-around rounded-b-lg bg-black/30 px-6">
              <i className="size-2 rounded-full bg-black/60" /><i className="size-3 rounded-full bg-black/60" /><i className="size-3 rounded-full bg-black/60" /><i className="size-2 rounded-full bg-black/60" />
            </div>
          </div>
        </div>

        {/* Deck: LCD + VU + transport */}
        <div className="lm-mx-deck mx-auto mt-4 w-full max-w-[360px] rounded-[12px] p-3">
          <div className="flex items-stretch gap-2">
            <div className="lm-mx-lcd relative flex min-w-0 flex-1 items-center overflow-hidden rounded-[6px] px-2" aria-live="polite">
              <span className={`whitespace-nowrap font-mono text-[12px] ${playing ? "lm-mx-marquee" : ""}`}>
                {current ? `▶ ${String(track! + 1).padStart(2, "0")} ${current.title} · ${hostOf(current.url)}` : "■ STOP  PICK A TRACK"}
              </span>
            </div>
            <div aria-hidden className={`lm-mx-vu flex items-end gap-[3px] rounded-[6px] px-2 py-1.5 ${playing ? "lm-mx-vu-on" : ""}`}>
              {Array.from({ length: 7 }).map((_, i) => <i key={i} style={{ animationDelay: `${-i * 0.13}s`, animationDuration: `${0.42 + (i % 3) * 0.11}s` } as CSSProperties} />)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              { k: "rew", label: "Previous track", icon: "◀◀" },
              { k: "play", label: current ? `Play ${current.title}` : "Play first track", icon: "▶" },
              { k: "stop", label: "Stop", icon: "■" },
              { k: "ff", label: "Next track", icon: "▶▶" },
            ].map((b) => (
              <button key={b.k} type="button" aria-label={b.label} onClick={() => deck(b.k)}
                className={`lm-mx-key h-11 rounded-[4px] text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-[#e2573b] ${key === b.k || (b.k === "play" && playing) ? "lm-mx-key-down" : ""} ${b.k === "play" ? "text-[#e2573b]" : "text-[#3a332d]"}`}>
                <span aria-hidden>{b.icon}</span>
              </button>
            ))}
          </div>
          {current ? (
            <a ref={playRef} href={current.url} {...linkTarget(mode, current.url)}
              className="lm-pop mt-3 flex items-center justify-center gap-2 rounded-full bg-[#e2573b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_5px_0_#8f2f1d] transition-[transform,box-shadow] duration-100 active:translate-y-1 active:shadow-[0_1px_0_#8f2f1d]">
              <span aria-hidden>▶</span> <span className="truncate">Open {current.title}</span>
            </a>
          ) : null}
        </div>

        {/* J-card */}
        <section className="lm-jcard mt-5 rounded-[6px] p-4 text-[#2a2420]" aria-label="Track list">
          <h2 className="text-[11px] font-black tracking-[.2em] text-[#e2573b]">SIDE A</h2>
          <ol className="mt-2 divide-y divide-dashed divide-[#2a2420]/20">
            {data.links.map((l, i) => (
              <li key={l.id}>
                <button type="button" onClick={() => choose(i)} aria-pressed={track === i}
                  className={`group flex w-full items-center gap-3 py-2 text-left outline-none transition-colors duration-150 focus-visible:bg-[#e2573b]/10 ${track === i ? "text-[#e2573b]" : "hover:text-[#b8402a]"}`}>
                  <span className="w-6 shrink-0 font-mono text-xs opacity-60">{track === i ? <span className="lm-mx-eq" aria-hidden><i /><i /><i /></span> : String(i + 1).padStart(2, "0")}</span>
                  <span className="font-hand min-w-0 flex-1 truncate text-[22px] leading-tight transition-transform duration-200 group-hover:translate-x-0.5">{l.title}</span>
                  <span className="max-w-[38%] shrink-0 truncate text-[10px] opacity-50">{hostOf(l.url)}</span>
                </button>
              </li>
            ))}
            {data.links.length === 0 ? <li className="font-hand py-2 text-xl opacity-50">Blank tape</li> : null}
          </ol>
          {data.socials.length ? (
            <>
              <h2 className="mt-4 text-[11px] font-black tracking-[.2em] text-[#e2573b]">SIDE B</h2>
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
        <div className="h-16" />
      </div>
    </ThemeRoot>
  );
}
