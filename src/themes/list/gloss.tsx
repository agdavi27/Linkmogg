"use client";

import { useEffect, useState } from "react";
import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { platformLabel } from "@/lib/socials/platforms";
import { Avatar, ThemeRoot, hash, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

const TINTS = ["#2f8cff", "#34c759", "#ff9f0a", "#ff375f", "#5ac8fa", "#ffd60a", "#30b0c7", "#ff6b3d", "#64d2a0"];
const DROPS = Array.from({ length: 26 }, (_, i) => {
  const h = hash(`drop${i}`);
  return { x: h % 100, y: (h >> 7) % 100, s: 10 + ((h >> 13) % 34) };
});

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () => setT(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    f();
    const id = setInterval(f, 30_000);
    return () => clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{t}</span>;
}

export default function GlossPhone({ data, mode }: ThemeProps) {
  return (
    <ThemeRoot data={data} mode={mode} label="Gloss Phone" badgeTone="light"
      className="bg-[#1a1f26] text-white">
      <div className="flex flex-1 items-start justify-center sm:items-center sm:py-8">
        <div className="lm-gloss-frame w-full sm:w-[360px]">
          <div className="lm-gloss-screen relative flex min-h-[640px] flex-col overflow-hidden">
            <div aria-hidden className="absolute inset-0">
              {DROPS.map((d, i) => (
                <span key={i} className="lm-drop absolute rounded-full"
                  style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s * 1.08 }} />
              ))}
            </div>
            <div className="relative flex items-center justify-between bg-black/55 px-2 py-[3px] text-[11px] font-semibold">
              <span aria-hidden>●●●●○ mogg</span>
              <Clock />
              <span aria-hidden className="lm-gloss-batt" />
            </div>

            <div className="relative mx-3 mt-3 flex items-center gap-3 rounded-xl border border-white/30 bg-gradient-to-b from-white/35 to-white/10 p-2.5 shadow-[0_2px_8px_rgba(0,0,0,.35)] backdrop-blur-sm">
              <Avatar data={data} size={44} className="rounded-[10px]! border border-white/50" />
              <div className="min-w-0 [text-shadow:0_1px_1px_rgba(0,0,0,.6)]">
                <h1 className="truncate text-[15px] font-bold">{data.displayName || `@${data.username}`}</h1>
                {data.bio ? <p className="line-clamp-2 text-[11px] leading-tight text-white/90">{data.bio}</p> : null}
              </div>
            </div>

            <ul className="relative grid grid-cols-4 gap-x-2 gap-y-4 px-4 pt-5" aria-label="Links">
              {data.links.map((l) => {
                const p = detectPlatform(l.url)?.platform ?? "website";
                const known = p !== "website" && p !== "email";
                const tint = TINTS[hash(l.id) % TINTS.length];
                return (
                  <li key={l.id}>
                    <a href={l.url} {...linkTarget(mode, l.url)}
                      className="group flex flex-col items-center gap-1 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/80">
                      <span className="lm-gloss-icon relative grid size-[58px] place-items-center rounded-[14px] transition-[filter,transform] duration-100 group-active:scale-95 group-active:brightness-75"
                        style={{ ["--tint" as string]: tint }}>
                        {known ? <SocialIcon platform={p} size={30} color="#fff" className="relative drop-shadow-[0_1px_1px_rgba(0,0,0,.4)]" />
                          : <span className="relative text-2xl font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,.4)]">{l.title.trim()[0]?.toUpperCase() ?? "•"}</span>}
                      </span>
                      <span className="w-full truncate text-center text-[11px] font-semibold [text-shadow:0_1px_2px_rgba(0,0,0,.8)]">{l.title}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            {data.links.length === 0 ? <p className="relative mt-8 text-center text-sm [text-shadow:0_1px_2px_#000]">No apps yet.</p> : null}

            <div className="flex-1" />
            <div aria-hidden className="relative mb-2 flex justify-center gap-1.5">
              <span className="size-1.5 rounded-full bg-white" /><span className="size-1.5 rounded-full bg-white/40" />
            </div>
            {data.socials.length ? (
              <ul className="lm-gloss-dock relative flex justify-center gap-3 px-3 pb-3 pt-3" aria-label="Social profiles">
                {data.socials.slice(0, 5).map((s, i) => (
                  <li key={i}>
                    <a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)}
                      className="lm-gloss-icon grid size-[50px] place-items-center rounded-[12px] outline-none transition-[filter] active:brightness-75 focus-visible:ring-2 focus-visible:ring-white"
                      style={{ ["--tint" as string]: "#3a3f47" }}>
                      <SocialIcon platform={s.platform} size={26} color="#fff" className="relative" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
    </ThemeRoot>
  );
}
