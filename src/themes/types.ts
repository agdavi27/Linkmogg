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
};

export type ThemeMode = "live" | "preview";

export type ThemeProps = {
  data: PageData;
  /** "preview" = inside the editor or gallery: links open in a new tab. */
  mode?: ThemeMode;
};
