"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SocialIcon } from "@/lib/socials/icons";
import { platformLabel } from "@/lib/socials/platforms";
import type { PageData, ThemeMode, ThemeSocial } from "./types";

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

export function linkTarget(mode: ThemeMode | undefined, url: string) {
  if (url.startsWith("mailto:") || url.startsWith("tel:")) return {};
  return mode === "preview"
    ? { target: "_blank", rel: "noopener noreferrer" }
    : { rel: "noopener" };
}

export function hostOf(url: string) {
  if (url.startsWith("mailto:")) return url.slice(7);
  if (url.startsWith("tel:")) return url.slice(4);
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Stable small hash, used to give each link a consistent color / tilt. */
export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export function Avatar({ data, size = 88, className = "" }: { data: PageData; size?: number; className?: string }) {
  const name = data.displayName || data.username;
  if (data.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={data.avatarUrl} alt="" width={size} height={size}
        className={`shrink-0 rounded-full object-cover ${className}`} style={{ width: size, height: size }} />
    );
  }
  return (
    <div aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-black/10 font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials(name)}
    </div>
  );
}

export function SocialRow({
  socials, mode, className = "", iconClass = "", size = 22, color = "current",
}: {
  socials: ThemeSocial[]; mode?: ThemeMode; className?: string; iconClass?: string; size?: number; color?: string;
}) {
  if (!socials.length) return null;
  return (
    <ul className={`flex flex-wrap items-center justify-center gap-1 ${className}`} aria-label="Social profiles">
      {socials.map((s, i) => (
        <li key={`${s.platform}-${i}`}>
          <a href={s.url} {...linkTarget(mode, s.url)} aria-label={platformLabel(s.platform)}
            className={`grid size-10 place-items-center rounded-full transition-[transform,opacity] duration-150 ease-out hover:opacity-80 active:scale-95 ${iconClass}`}>
            <SocialIcon platform={s.platform} size={size} color={color} />
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Visually hidden plain list of every link: the screen-reader fallback for every theme. */
export function SrLinkList({ data, mode }: { data: PageData; mode?: ThemeMode }) {
  return (
    <nav className="sr-only" aria-label={`${data.displayName || data.username}'s links, plain list`}>
      <h2>{data.displayName || data.username}</h2>
      {data.bio ? <p>{data.bio}</p> : null}
      <ul>
        {data.links.map((l) => (
          <li key={l.id}><a href={l.url} {...linkTarget(mode, l.url)}>{l.title}</a></li>
        ))}
        {data.socials.map((s, i) => (
          <li key={`s${i}`}><a href={s.url} {...linkTarget(mode, s.url)}>{platformLabel(s.platform)}</a></li>
        ))}
      </ul>
    </nav>
  );
}

export function Badge({ data, tone = "dark" }: { data: PageData; tone?: "dark" | "light" }) {
  if (!data.showBadge) return null;
  return (
    <a href={data.badgeUrl} target="_blank" rel="noopener"
      className={`lm-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur transition-transform duration-150 ease-out active:scale-95 ${
        tone === "dark" ? "bg-black/70 text-white" : "bg-white/85 text-black"
      }`}>
      Get your own <span aria-hidden>→</span>
    </a>
  );
}

/** Root wrapper every theme uses: fills its container, adds the SR list and the badge. */
export function ThemeRoot({
  data, mode, className = "", style, children, badgeTone = "dark", label,
}: {
  data: PageData; mode?: ThemeMode; className?: string; style?: React.CSSProperties; children: ReactNode;
  badgeTone?: "dark" | "light"; label: string;
}) {
  return (
    <div className={`lm-theme relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden ${className}`} style={style}
      data-mode={mode}>
      <SrLinkList data={data} mode={mode} />
      <div className="relative flex min-h-0 flex-1 flex-col" role="region" aria-label={`${label} layout`}>
        {children}
      </div>
      {data.showBadge ? (
        <div className="relative z-40 flex shrink-0 justify-center pb-3 pt-1.5">
          <Badge data={data} tone={badgeTone} />
        </div>
      ) : null}
    </div>
  );
}

export function Empty({ className = "" }: { className?: string }) {
  return <p className={`text-center text-sm opacity-60 ${className}`}>No links yet.</p>;
}
