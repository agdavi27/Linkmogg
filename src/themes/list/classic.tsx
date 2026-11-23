"use client";

import { Avatar, Empty, SocialRow, ThemeRoot, hostOf, linkTarget } from "../shared";
import type { ThemeProps } from "../types";

export default function Classic({ data, mode }: ThemeProps) {
  return (
    <ThemeRoot data={data} mode={mode} label="Classic" className="bg-[#f4efe6] text-[#1d1a16]">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center px-5 pb-8 pt-12">
        <Avatar data={data} size={92} className="ring-4 ring-white shadow-[0_6px_20px_-8px_rgba(40,30,10,.35)]" />
        <h1 className="mt-4 text-center font-display text-[1.6rem] font-semibold leading-tight tracking-[-0.02em] text-balance">
          {data.displayName || `@${data.username}`}
        </h1>
        {data.bio ? <p className="mt-2 max-w-[34ch] text-center text-[0.95rem] leading-relaxed text-[#5b5348] text-pretty">{data.bio}</p> : null}
        <SocialRow socials={data.socials} mode={mode} className="mt-4" iconClass="text-[#2a251f] hover:bg-black/5" />
        <ul className="mt-6 flex w-full flex-col gap-2.5" aria-label="Links">
          {data.links.map((l) => (
            <li key={l.id}>
              <a href={l.url} {...linkTarget(mode, l.url)}
                className="group flex items-center gap-3 rounded-2xl border border-black/[.07] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(40,30,10,.06),0_8px_24px_-16px_rgba(40,30,10,.25)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(40,30,10,.06),0_14px_28px_-16px_rgba(40,30,10,.35)] active:scale-[.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff5b2e]">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{l.title}</span>
                  <span className="block truncate text-xs text-[#8a8174]">{hostOf(l.url)}</span>
                </span>
                <span aria-hidden className="text-[#b3a99a] transition-transform duration-150 ease-out group-hover:translate-x-0.5">→</span>
              </a>
            </li>
          ))}
        </ul>
        {data.links.length === 0 ? <Empty className="mt-6" /> : null}
      </div>
    </ThemeRoot>
  );
}
