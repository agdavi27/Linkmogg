"use client";

import { detectPlatform } from "@/lib/socials/detect";
import { SocialIcon } from "@/lib/socials/icons";
import { Avatar, SocialRow, ThemeRoot, hash, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

const PHOTO = [
  "linear-gradient(135deg,#f6a57a,#e2573b)", "linear-gradient(135deg,#8fd3c1,#2f7f6f)",
  "linear-gradient(135deg,#f9dc7a,#e09b2d)", "linear-gradient(135deg,#a9c4f5,#3e64b8)",
  "linear-gradient(135deg,#f3b4c8,#c2457a)", "linear-gradient(135deg,#c9e59a,#5e8c2a)",
];
const PINS = ["#e2453b", "#2f6fd6", "#f2b632", "#2fa36b", "#f2f2f2"];

export default function Corkboard({ data, mode }: ThemeProps) {
  return (
    <ThemeRoot data={data} mode={mode} label="Corkboard" badgeTone="light" className="lm-cork text-[#2a1f14]">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pt-8">
        <div className="lm-note mx-auto flex w-[88%] -rotate-1 items-center gap-3 p-4">
          <Avatar data={data} size={58} />
          <div className="min-w-0">
            <h1 className="font-hand truncate text-3xl leading-none">{data.displayName || `@${data.username}`}</h1>
            {data.bio ? <p className="font-hand mt-1 line-clamp-3 text-lg leading-tight text-[#4a3b28]">{data.bio}</p> : null}
          </div>
        </div>

        <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6" aria-label="Links">
          {data.links.map((l) => {
            const h = hash(l.id + l.url);
            const rot = ((h % 9) - 4) * 1.1;
            const p = detectPlatform(l.url)?.platform ?? "website";
            return (
              <li key={l.id} className="flex justify-center">
                <a href={l.url} {...linkTarget(mode, l.url)}
                  className="lm-polaroid group relative block w-full max-w-[190px] bg-[#fdfbf6] p-2.5 pb-3 outline-none transition-[transform,box-shadow] duration-200 ease-out hover:z-10 hover:!rotate-0 hover:scale-[1.04] focus-visible:z-10 focus-visible:!rotate-0 focus-visible:scale-[1.04] focus-visible:ring-2 focus-visible:ring-[#2f6fd6] active:scale-[1.02]"
                  style={{ rotate: `${rot}deg` }}>
                  <span aria-hidden className="lm-pin absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full"
                    style={{ background: PINS[(h >> 3) % PINS.length] }} />
                  <span className="grid aspect-square place-items-center text-white" style={{ background: PHOTO[h % PHOTO.length] }}>
                    {p !== "website" ? <SocialIcon platform={p} size={44} color="#fff" className="opacity-90" />
                      : <span className="font-display text-5xl font-bold opacity-90">{l.title.trim()[0]?.toUpperCase()}</span>}
                  </span>
                  <span className="font-hand mt-2 block truncate text-center text-xl leading-tight">{l.title}</span>
                  <span className="block truncate text-center text-[10px] text-[#8a7a62]">{hostOf(l.url)}</span>
                </a>
              </li>
            );
          })}
        </ul>
        {data.links.length === 0 ? <p className="font-hand mt-8 text-center text-2xl text-[#fdf6e6]">Nothing pinned yet.</p> : null}
        <SocialRow socials={data.socials} mode={mode} className="mx-auto my-6 rounded-full bg-[#fdfbf6]/90 px-2 py-1 shadow-md" iconClass="text-[#2a1f14] hover:bg-black/5" />
      </div>
    </ThemeRoot>
  );
}
