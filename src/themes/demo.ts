import type { PageData } from "./types";

export const DEMO: PageData = {
  username: "junopark",
  displayName: "Juno Park",
  bio: "Ceramics, synths and slow mornings. New mugs drop every first Friday.",
  avatarUrl: null,
  links: [
    { id: "d1", title: "Shop the new mugs", url: "https://example.com/shop" },
    { id: "d2", title: "Latest video: glazing 101", url: "https://www.youtube.com/@example" },
    { id: "d3", title: "My studio playlist", url: "https://open.spotify.com/playlist/example" },
    { id: "d4", title: "Book a wheel class", url: "https://example.com/classes" },
    { id: "d5", title: "Newsletter", url: "https://example.substack.com" },
    { id: "d6", title: "Wholesale inquiries", url: "mailto:hello@example.com" },
  ],
  socials: [
    { platform: "instagram", url: "https://instagram.com/example" },
    { platform: "tiktok", url: "https://tiktok.com/@example" },
    { platform: "youtube", url: "https://youtube.com/@example" },
    { platform: "spotify", url: "https://open.spotify.com/user/example" },
  ],
  showBadge: true,
  badgeUrl: "/",
};
