"use client";

import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { encodeDraft, handleFrom, parsePasted } from "@/lib/convert";
import { detectPlatform } from "@/lib/socials/detect";
import { platformLabel } from "@/lib/socials/platforms";
import { THEMES, getTheme } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import type { PageData } from "@/themes/types";

const SAMPLE = `Shop the new mugs - junopark.shop/mugs
Latest video: glazing 101 - https://youtube.com/watch?v=abc
Book a wheel class
calendly.com/junopark/wheel
https://instagram.com/junopark
https://tiktok.com/@junopark`;

const PICKS = ["pocket", "museum", "garden", "billboard", "bookshelf", "corkboard", "sunflower", "classic"];

export function Converter({ host }: { host: string }) {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pasted, setPasted] = useState("");
  const [themeId, setThemeId] = useState("pocket");

  const handle = handleFrom(address);
  const parsed = useMemo(() => parsePasted(pasted), [pasted]);
  const count = parsed.links.length + parsed.socials.length;

  const data: PageData = {
    username: handle || "you",
    displayName: name || handle || "Your name",
    bio,
    avatarUrl: null,
    links: parsed.links.map((l, i) => ({ id: `c${i}`, title: l.title, url: l.url })),
    socials: parsed.socials.map((u) => ({ platform: detectPlatform(u)?.platform ?? "website", url: u })),
    showBadge: true,
    badgeUrl: "/",
  };

  const next = `/convert/finish?d=${encodeDraft({ username: handle, displayName: name || handle, bio, themeId, links: parsed.links, socials: parsed.socials })}`;
  const ready = !!handle && count > 0;

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 pb-20 pt-4 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0">
        <h1 className="font-display text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1] tracking-[-0.04em] text-balance">Convert your Linktree</h1>
        <p className="mt-4 max-w-[52ch] text-lg text-ink-2 text-pretty">
          Bring your links over, see them in any theme right here, and keep the page when you like it. Free for 14 days, no card needed.
        </p>

        <ol className="mt-8 flex flex-col gap-7">
          <li>
            <label htmlFor="cv-addr" className="label">1. Your Linktree address</label>
            <input id="cv-addr" className="field" placeholder="linktr.ee/yourname" value={address} onChange={(e) => setAddress(e.target.value)} autoCapitalize="none" spellCheck={false} />
            <p className="mt-1.5 text-sm text-ink-3">{handle ? <>Your new page would be <strong className="text-ink">{host}/{handle}</strong>.</> : "We'll try to keep the same name for you."}</p>
          </li>

          <li>
            <label htmlFor="cv-links" className="label">2. Paste your links</label>
            <p className="mb-2 text-sm text-ink-2">
              Copy each link from your Linktree and paste them here, one per line. Put a title before the link, or on the line above it.
              Profile links on their own, like instagram.com/you, become social icons.
            </p>
            <textarea id="cv-links" className="field min-h-48 resize-y font-mono text-[13px] leading-relaxed" value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder={SAMPLE} spellCheck={false} />
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-3">
              <span>{parsed.links.length} link{parsed.links.length === 1 ? "" : "s"} · {parsed.socials.length} social icon{parsed.socials.length === 1 ? "" : "s"}</span>
              {!pasted ? <button type="button" className="font-medium text-ink underline underline-offset-2" onClick={() => { setPasted(SAMPLE); if (!address) setAddress("linktr.ee/junopark"); }}>Try it with an example</button> : null}
            </div>
            {parsed.socials.length ? (
              <p className="mt-1 text-sm text-ink-3">Icons: {parsed.socials.map((u) => platformLabel(detectPlatform(u)?.platform ?? "website")).join(", ")}</p>
            ) : null}
          </li>

          <li className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cv-name" className="label">3. Name on the page</label>
              <input id="cv-name" className="field" placeholder={handle || "Juno Park"} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>
            <div>
              <label htmlFor="cv-bio" className="label">Bio <span className="font-normal text-ink-3">(optional)</span></label>
              <input id="cv-bio" className="field" placeholder="A line about you" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} />
            </div>
          </li>

          <li>
            <p className="label">4. Pick a theme</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
              {PICKS.map((id) => {
                const t = getTheme(id);
                return (
                  <button key={id} type="button" role="radio" aria-checked={themeId === id} onClick={() => setThemeId(id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${themeId === id ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}>
                    <span aria-hidden className="size-4 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${t.swatch[0]} 55%, ${t.swatch[1]} 55%)` }} />{t.name}
                  </button>
                );
              })}
              <select aria-label="More themes" className="rounded-full border border-line bg-white px-3 py-1.5 text-sm" value={PICKS.includes(themeId) ? "" : themeId} onChange={(e) => e.target.value && setThemeId(e.target.value)}>
                <option value="">More…</option>
                {THEMES.filter((t) => !PICKS.includes(t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </li>
        </ol>

        <div className="mt-9 flex flex-wrap items-center gap-4">
          <a href={ready ? `/login?next=${encodeURIComponent(next)}` : undefined} aria-disabled={!ready}
            className={`btn btn-accent ${ready ? "" : "pointer-events-none opacity-40"}`}>
            Keep this page and start my free trial <ArrowRight size={16} />
          </a>
          <p className="text-sm text-ink-3">{ready ? "You'll get a sign-in link by email. No card." : "Add your Linktree address and at least one link."}</p>
        </div>
      </div>

      <div className="flex flex-col items-center lg:sticky lg:top-6 lg:self-start">
        <div className="w-full max-w-[380px] overflow-hidden rounded-[44px] border-[10px] border-ink bg-ink shadow-[0_40px_80px_-40px_rgba(30,20,0,.7)]">
          <div key={themeId} className="relative h-[min(720px,calc(100dvh-120px))] min-h-[540px] overflow-hidden rounded-[34px] [transform:translateZ(0)]">
            <ThemeRenderer themeId={themeId} data={data} mode="preview" />
          </div>
        </div>
        <p className="mt-3 text-center text-sm text-ink-3">Live preview · {getTheme(themeId).name}</p>
      </div>
    </div>
  );
}
