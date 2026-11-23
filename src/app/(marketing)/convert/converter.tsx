"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { encodeDraft, handleFrom, parsePasted } from "@/lib/convert";
import { detectPlatform, normalizeUrl } from "@/lib/socials/detect";
import { platformLabel } from "@/lib/socials/platforms";
import { THEMES, getTheme } from "@/themes/registry";
import { PhonePlate, PlateDot } from "@/components/phone-plate";
import type { PageData } from "@/themes/types";

const SAMPLE = `Shop the new mugs - junopark.shop/mugs
Latest video: glazing 101 - https://youtube.com/watch?v=abc
Book a wheel class
calendly.com/junopark/wheel
https://instagram.com/junopark
https://tiktok.com/@junopark`;

const PICKS = ["pocket", "museum", "garden", "billboard", "bookshelf", "corkboard", "reels", "folders"];

export function Converter({ host }: { host: string }) {
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [pasted, setPasted] = useState("");
  const [themeId, setThemeId] = useState("pocket");

  const handle = handleFrom(address);
  const found = useMemo(() => parsePasted(pasted), [pasted]);
  const [skip, setSkip] = useState<Set<string>>(new Set()); // urls the person unticked
  const [extra, setExtra] = useState<{ title: string; url: string }[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const parsed = {
    links: [...found.links.filter((l) => !skip.has(l.url)), ...extra].slice(0, 40),
    socials: found.socials.filter((u) => !skip.has(u)),
  };
  const count = parsed.links.length + parsed.socials.length;
  const toggle = (url: string) => setSkip((cur) => { const next = new Set(cur); if (next.has(url)) next.delete(url); else next.add(url); return next; });
  const addExtra = () => {
    const url = normalizeUrl(newUrl);
    if (!url) return;
    setExtra((x) => [...x, { title: (newTitle.trim() || new URL(url.startsWith("mailto:") ? "https://email.me" : url).hostname.replace(/^www\./, "")).slice(0, 80), url }]);
    setNewTitle(""); setNewUrl("");
  };

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
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 pb-20 pt-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px]">
      <div className="min-w-0">
        <h1 className="type-plate text-[clamp(3rem,7vw,4.8rem)]">Bring your Linktree over</h1>
        <p className="mt-4 max-w-[52ch] text-lg text-ink-2 text-pretty">
          Paste your links, see them in any theme right here, and keep the page when you like it. Free for 14 days, no card needed.
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
            {!pasted ? (
              <button type="button" className="mt-2 text-sm font-medium text-ink underline underline-offset-2" onClick={() => { setPasted(SAMPLE); if (!address) setAddress("linktr.ee/junopark"); }}>Try it with an example</button>
            ) : null}
          </li>

          <li>
            <p className="label">3. Choose what to keep <span className="font-normal text-ink-3">({count} selected)</span></p>
            {found.links.length || found.socials.length || extra.length ? (
              <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                {found.links.map((l) => (
                  <li key={l.url}><Pick on={!skip.has(l.url)} onChange={() => toggle(l.url)} title={l.title} sub={l.url.replace(/^https?:\/\/(www\.)?/, "").replace(/^mailto:/, "")} /></li>
                ))}
                {found.socials.map((u) => (
                  <li key={u}><Pick on={!skip.has(u)} onChange={() => toggle(u)} title={`${platformLabel(detectPlatform(u)?.platform ?? "website")} icon`} sub={u.replace(/^https?:\/\/(www\.)?/, "")} /></li>
                ))}
                {extra.map((l, k) => (
                  <li key={`x${k}`}><Pick on onChange={() => setExtra((x) => x.filter((_, j) => j !== k))} title={l.title} sub={`${l.url.replace(/^https?:\/\/(www\.)?/, "")} · added`} /></li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-3">Your links show up here once they&apos;re in. Untick anything you don&apos;t want.</p>}
            <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); addExtra(); }}>
              <label htmlFor="cv-nt" className="sr-only">New link title</label>
              <input id="cv-nt" className="field sm:max-w-[38%]" placeholder="Title (optional)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} maxLength={80} />
              <label htmlFor="cv-nu" className="sr-only">New link address</label>
              <input id="cv-nu" className="field flex-1" placeholder="Add another link: example.com/new" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} autoCapitalize="none" spellCheck={false} />
              <button className="btn btn-ghost shrink-0" disabled={!normalizeUrl(newUrl)}><Plus size={16} /> Add</button>
            </form>
          </li>

          <li className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="cv-name" className="label">4. Name on the page</label>
              <input id="cv-name" className="field" placeholder={handle || "Juno Park"} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
            </div>
            <div>
              <label htmlFor="cv-bio" className="label">Bio <span className="font-normal text-ink-3">(optional)</span></label>
              <input id="cv-bio" className="field" placeholder="A line about you" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={160} />
            </div>
          </li>

          <li>
            <p className="label">5. Pick a theme</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Theme">
              {PICKS.map((id) => {
                const t = getTheme(id);
                return (
                  <button key={id} type="button" role="radio" aria-checked={themeId === id} onClick={() => setThemeId(id)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${themeId === id ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink"}`}>
                    <PlateDot themeId={id} />{t.name}
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

      <div className="lg:sticky lg:top-4 lg:self-start">
        <PhonePlate themeId={themeId} data={data}
          caption={<span className="text-sm font-semibold">Live preview · {getTheme(themeId).name}</span>} />
      </div>
    </div>
  );
}

function Pick({ on, onChange, title, sub }: { on: boolean; onChange: () => void; title: string; sub: string }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-paper-2/60 ${on ? "" : "opacity-50"}`}>
      <input type="checkbox" checked={on} onChange={onChange} className="size-4 shrink-0 accent-[var(--ink)]" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-ink-3">{sub}</span>
      </span>
    </label>
  );
}
