"use client";

import { useRef, type CSSProperties } from "react";
import { platformLabel } from "@/lib/socials/platforms";
import { SocialIcon } from "@/lib/socials/icons";
import { Empty, ThemeRoot, hash, linkTarget } from "../shared";
import { LinkArt } from "../art";
import { buzz, useParallax, useSize } from "../motion";
import type { ThemeProps } from "../types";

/** Your photo, big and soft, with your links scattered around it like files on a desktop, and a dock below. */
export default function Scatter({ data, mode }: ThemeProps) {
  const n = data.links.length;
  const stage = useRef<HTMLDivElement>(null);
  useParallax(stage);
  const { w, h } = useSize(stage);
  const name = data.displayName || data.username;

  const tile = Math.max(40, Math.min(Math.min(w, h) * 0.12, 70));
  // Spread the links around an oval, nudged a little so it looks hand-placed.
  const spots = data.links.map((l, i) => {
    const k = hash(l.id + l.title);
    const a = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2 + ((k % 11) - 5) * 0.03;
    const rx = w * (0.33 + (k % 7) * 0.012), ry = h * (0.32 + ((k >>> 3) % 7) * 0.012);
    return { x: w / 2 + Math.cos(a) * rx, y: h * 0.46 + Math.sin(a) * ry, z: (k % 3) + 1 };
  });

  return (
    <ThemeRoot data={data} mode={mode} label="Scatter" className="lm-sc bg-[#e9e9ec] text-[#141414]">
      <div ref={stage} className="relative min-h-0 flex-1 overflow-hidden">
        {/* you, in the middle */}
        <div aria-hidden className="lm-sc-me absolute left-1/2 top-[46%]" style={{ width: Math.min(w, h) * 0.78, height: Math.min(w, h) * 0.78 }}>
          {data.avatarUrl
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={data.avatarUrl} alt="" className="size-full rounded-full object-cover" />
            : <span className="block size-full rounded-full bg-[radial-gradient(circle_at_40%_35%,#b9bcc4,#8d919b)]" />}
        </div>
        <h1 className="absolute inset-x-0 top-[46%] z-10 -translate-y-1/2 px-6 text-center font-display text-[clamp(26px,8cqw,54px)] font-bold leading-none tracking-[-0.05em] text-white [text-shadow:0_2px_24px_rgba(0,0,0,.35)]">{name}</h1>

        {w > 0 ? (
          <ul aria-label="Links">
            {data.links.map((l, i) => (
              <li key={l.id} className="lm-sc-item absolute" style={{ left: spots[i].x, top: spots[i].y, ["--z" as string]: spots[i].z, ["--i" as string]: i } as CSSProperties}>
                <a href={l.url} {...linkTarget(mode, l.url)} onPointerDown={() => buzz(4)}
                  className="lm-sc-link flex -translate-x-1/2 -translate-y-1/2 flex-col items-center outline-none">
                  <LinkArt link={l} className="lm-sc-tile rounded-[6px]" style={{ width: tile, height: tile }} icon={Math.round(tile * 0.32)} blur={0.4} />
                  <span className="mt-1 max-w-[96px] truncate rounded-[3px] px-1 text-[10.5px] font-medium leading-tight">{l.title}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {data.bio ? <p className="absolute inset-x-0 bottom-3 mx-auto max-w-[44ch] px-6 text-center text-[12px] text-black/55">{data.bio}</p> : null}
        {n === 0 ? <Empty className="absolute inset-x-0 bottom-12" /> : null}
      </div>

      {/* the dock: your socials, or a little stack of your first links if you have none */}
      <nav aria-label="Social profiles" className="relative z-10 flex shrink-0 justify-center pb-1">
        <ul className="lm-sc-dock flex items-end gap-1.5 px-2 py-1.5">
          {data.socials.length ? data.socials.map((s, i) => (
            <li key={i}>
              <a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)} className="lm-sc-dockicon grid size-10 place-items-center rounded-[10px] text-white">
                <SocialIcon platform={s.platform} size={20} />
              </a>
            </li>
          )) : <li className="px-3 py-2 text-[12px] text-black/55">@{data.username}</li>}
        </ul>
      </nav>
    </ThemeRoot>
  );
}
