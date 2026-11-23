import {
  siInstagram, siTiktok, siX, siYoutube, siYoutubemusic, siSpotify, siApplemusic, siApplepodcasts,
  siSnapchat, siThreads, siFacebook, siPinterest, siTwitch, siKick, siDiscord, siGithub, siSubstack,
  siMedium, siSoundcloud, siBandcamp, siDeezer, siTidal, siBluesky, siMastodon, siReddit, siTumblr,
  siTelegram, siWhatsapp, siPatreon, siKofi, siBuymeacoffee, siCashapp, siVenmo, siPaypal, siEtsy,
  siBehance, siDribbble, siVimeo, siLetterboxd, siGoodreads, siSteam, siCalendly, siSignal, siOnlyfans,
} from "simple-icons";
import { platformLabel } from "./platforms";

type Icon = { path: string; hex: string };

const ICONS: Record<string, Icon> = {
  instagram: siInstagram, tiktok: siTiktok, x: siX, youtube: siYoutube, youtubemusic: siYoutubemusic,
  spotify: siSpotify, applemusic: siApplemusic, applepodcasts: siApplepodcasts, snapchat: siSnapchat,
  threads: siThreads, facebook: siFacebook, pinterest: siPinterest, twitch: siTwitch, kick: siKick,
  discord: siDiscord, github: siGithub, substack: siSubstack, medium: siMedium, soundcloud: siSoundcloud,
  bandcamp: siBandcamp, deezer: siDeezer, tidal: siTidal, bluesky: siBluesky, mastodon: siMastodon,
  reddit: siReddit, tumblr: siTumblr, telegram: siTelegram, whatsapp: siWhatsapp, patreon: siPatreon,
  kofi: siKofi, buymeacoffee: siBuymeacoffee, cashapp: siCashapp, venmo: siVenmo, paypal: siPaypal,
  etsy: siEtsy, behance: siBehance, dribbble: siDribbble, vimeo: siVimeo, letterboxd: siLetterboxd,
  goodreads: siGoodreads, steam: siSteam, calendly: siCalendly, signal: siSignal, onlyfans: siOnlyfans,
  // Brands not in simple-icons get a neutral, original glyph (24x24 viewBox).
  linkedin: {
    hex: "0A66C2",
    path: "M3 3h18v18H3V3zm3.2 7.3V18h2.6v-7.7H6.2zm1.3-3.9a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10.6 10.3V18h2.6v-4.1c0-1.1.4-1.8 1.4-1.8s1.3.8 1.3 1.9v4h2.6v-4.6c0-2.3-1.2-3.3-2.9-3.3-1.3 0-2 .7-2.4 1.3v-1.1h-2.6z",
  },
  email: {
    hex: "6B7280",
    path: "M2 5h20v14H2V5zm2 2v.5l8 5.2 8-5.2V7H4zm16 2.9l-8 5.2-8-5.2V17h16V9.9z",
  },
  phone: {
    hex: "6B7280",
    path: "M6.6 2h3l1.6 4.6-2.1 1.5a12 12 0 006.8 6.8l1.5-2.1L22 14.4v3c0 1.4-1.2 2.6-2.6 2.6C10 20 4 14 4 4.6 4 3.2 5.2 2 6.6 2z",
  },
  website: {
    hex: "6B7280",
    path: "M12 2a10 10 0 110 20 10 10 0 010-20zm-1.5 2.2A8 8 0 004.1 11h3.4c.1-2.5.9-4.9 3-6.8zm3 0c2.1 1.9 2.9 4.3 3 6.8h3.4a8 8 0 00-6.4-6.8zM9.5 11h5c-.1-2.4-.9-4.3-2.5-5.9-1.6 1.6-2.4 3.5-2.5 5.9zm-5.4 2a8 8 0 006.4 6.8c-2.1-1.9-2.9-4.3-3-6.8H4.1zm5.4 0c.1 2.4.9 4.3 2.5 5.9 1.6-1.6 2.4-3.5 2.5-5.9h-5zm7 0c-.1 2.5-.9 4.9-3 6.8a8 8 0 006.4-6.8h-3.4z",
  },
};

export function iconFor(platform: string): Icon {
  return ICONS[platform] ?? ICONS.website;
}

export function SocialIcon({
  platform, size = 20, color, className,
}: { platform: string; size?: number; color?: "brand" | "current" | string; className?: string }) {
  const icon = iconFor(platform);
  const fill = color === "brand" ? `#${icon.hex}` : color && color !== "current" ? color : "currentColor";
  return (
    <svg role="img" aria-label={platformLabel(platform)} viewBox="0 0 24 24" width={size} height={size}
      className={className} fill={fill}>
      <path d={icon.path} />
    </svg>
  );
}
