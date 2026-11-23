/**
 * Platform table: id, label, matching hosts, and the simple-icons export name.
 * Order matters: the first match wins, so put specific hosts before generic ones.
 */
export type PlatformDef = {
  id: string;
  label: string;
  hosts: string[]; // matched against the hostname (without www.)
  icon?: string; // simple-icons export name, e.g. "siInstagram"
  pathPrefix?: string; // optional, for hosts shared between products
};

export const PLATFORMS: PlatformDef[] = [
  { id: "instagram", label: "Instagram", hosts: ["instagram.com", "instagr.am"], icon: "siInstagram" },
  { id: "tiktok", label: "TikTok", hosts: ["tiktok.com", "vm.tiktok.com"], icon: "siTiktok" },
  { id: "x", label: "X", hosts: ["x.com", "twitter.com"], icon: "siX" },
  { id: "youtubemusic", label: "YouTube Music", hosts: ["music.youtube.com"], icon: "siYoutubemusic" },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be", "m.youtube.com"], icon: "siYoutube" },
  { id: "spotify", label: "Spotify", hosts: ["open.spotify.com", "spotify.com", "spotify.link"], icon: "siSpotify" },
  { id: "applepodcasts", label: "Apple Podcasts", hosts: ["podcasts.apple.com"], icon: "siApplepodcasts" },
  { id: "applemusic", label: "Apple Music", hosts: ["music.apple.com"], icon: "siApplemusic" },
  { id: "snapchat", label: "Snapchat", hosts: ["snapchat.com"], icon: "siSnapchat" },
  { id: "threads", label: "Threads", hosts: ["threads.net", "threads.com"], icon: "siThreads" },
  { id: "linkedin", label: "LinkedIn", hosts: ["linkedin.com", "lnkd.in"] },
  { id: "facebook", label: "Facebook", hosts: ["facebook.com", "fb.com", "fb.me", "m.facebook.com"], icon: "siFacebook" },
  { id: "pinterest", label: "Pinterest", hosts: ["pinterest.com", "pin.it"], icon: "siPinterest" },
  { id: "twitch", label: "Twitch", hosts: ["twitch.tv"], icon: "siTwitch" },
  { id: "kick", label: "Kick", hosts: ["kick.com"], icon: "siKick" },
  { id: "discord", label: "Discord", hosts: ["discord.gg", "discord.com"], icon: "siDiscord" },
  { id: "github", label: "GitHub", hosts: ["github.com"], icon: "siGithub" },
  { id: "substack", label: "Substack", hosts: ["substack.com"], icon: "siSubstack" },
  { id: "medium", label: "Medium", hosts: ["medium.com"], icon: "siMedium" },
  { id: "soundcloud", label: "SoundCloud", hosts: ["soundcloud.com", "on.soundcloud.com"], icon: "siSoundcloud" },
  { id: "bandcamp", label: "Bandcamp", hosts: ["bandcamp.com"], icon: "siBandcamp" },
  { id: "deezer", label: "Deezer", hosts: ["deezer.com", "deezer.page.link"], icon: "siDeezer" },
  { id: "tidal", label: "TIDAL", hosts: ["tidal.com", "listen.tidal.com"], icon: "siTidal" },
  { id: "bluesky", label: "Bluesky", hosts: ["bsky.app"], icon: "siBluesky" },
  { id: "mastodon", label: "Mastodon", hosts: ["mastodon.social", "mastodon.online", "mstdn.social"], icon: "siMastodon" },
  { id: "reddit", label: "Reddit", hosts: ["reddit.com"], icon: "siReddit" },
  { id: "tumblr", label: "Tumblr", hosts: ["tumblr.com"], icon: "siTumblr" },
  { id: "telegram", label: "Telegram", hosts: ["t.me", "telegram.me"], icon: "siTelegram" },
  { id: "whatsapp", label: "WhatsApp", hosts: ["wa.me", "whatsapp.com", "api.whatsapp.com"], icon: "siWhatsapp" },
  { id: "patreon", label: "Patreon", hosts: ["patreon.com"], icon: "siPatreon" },
  { id: "kofi", label: "Ko-fi", hosts: ["ko-fi.com"], icon: "siKofi" },
  { id: "buymeacoffee", label: "Buy Me a Coffee", hosts: ["buymeacoffee.com"], icon: "siBuymeacoffee" },
  { id: "cashapp", label: "Cash App", hosts: ["cash.app"], icon: "siCashapp" },
  { id: "venmo", label: "Venmo", hosts: ["venmo.com"], icon: "siVenmo" },
  { id: "paypal", label: "PayPal", hosts: ["paypal.com", "paypal.me"], icon: "siPaypal" },
  { id: "etsy", label: "Etsy", hosts: ["etsy.com"], icon: "siEtsy" },
  { id: "behance", label: "Behance", hosts: ["behance.net"], icon: "siBehance" },
  { id: "dribbble", label: "Dribbble", hosts: ["dribbble.com"], icon: "siDribbble" },
  { id: "vimeo", label: "Vimeo", hosts: ["vimeo.com"], icon: "siVimeo" },
  { id: "letterboxd", label: "Letterboxd", hosts: ["letterboxd.com"], icon: "siLetterboxd" },
  { id: "goodreads", label: "Goodreads", hosts: ["goodreads.com"], icon: "siGoodreads" },
  { id: "steam", label: "Steam", hosts: ["steamcommunity.com", "store.steampowered.com"], icon: "siSteam" },
  { id: "calendly", label: "Calendly", hosts: ["calendly.com"], icon: "siCalendly" },
  { id: "signal", label: "Signal", hosts: ["signal.me", "signal.group"], icon: "siSignal" },
  { id: "onlyfans", label: "OnlyFans", hosts: ["onlyfans.com"], icon: "siOnlyfans" },
];

export const SPECIAL_PLATFORMS = {
  email: { id: "email", label: "Email" },
  phone: { id: "phone", label: "Phone" },
  website: { id: "website", label: "Website" },
} as const;

export function platformLabel(id: string): string {
  return PLATFORMS.find((p) => p.id === id)?.label
    ?? (SPECIAL_PLATFORMS as Record<string, { label: string }>)[id]?.label
    ?? "Link";
}
