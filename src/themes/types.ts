export type ThemeLink = { id: string; title: string; url: string };
export type ThemeSocial = { platform: string; url: string };

export type PageData = {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  links: ThemeLink[];
  socials: ThemeSocial[];
  showBadge: boolean;
  badgeUrl: string;
  /** For themes that sit on a backdrop: a preset id or an https image URL. */
  backdrop?: string | null;
  /** Stack: pages stacked up and down, or fanned sideways. */
  layout?: "vertical" | "horizontal" | null;
  /** Reels: the person's Instagram handle and the clips they uploaded. */
  instagram?: InstagramInfo | null;
};

export type InstagramInfo = { handle: string; reels: string[] };

export type ThemeMode = "live" | "preview";

export type ThemeProps = {
  data: PageData;
  /** "preview" = inside the editor or gallery: links open in a new tab. */
  mode?: ThemeMode;
};
