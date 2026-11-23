
export type ThemeDef = {
  id: string;
  name: string;
  blurb: string;
  pro: boolean;
  swatch: [string, string];
  category: CategoryId;
};

export type CategoryId = "popular" | "minimal" | "spatial" | "retro" | "cozy";

export const CATEGORIES: { id: CategoryId; name: string; blurb: string }[] = [
  { id: "popular", name: "Most popular", blurb: "The ones people pick the most." },
  { id: "minimal", name: "Minimal", blurb: "Clean type and quiet motion." },
  { id: "spatial", name: "Spatial", blurb: "3D scenes, arches and wheels." },
  { id: "retro", name: "Retro tech", blurb: "Gadgets and desktops, rebuilt." },
  { id: "cozy", name: "Cozy", blurb: "Hand-made gardens." },
];

export const DEFAULT_THEME = "classic";

export const THEMES: ThemeDef[] = [
  // Most popular
  { id: "pocket", name: "Pocket Player", blurb: "Flip through album covers with a click wheel.", pro: true, swatch: ["#e9e4dc", "#2a6fd0"], category: "popular" },
  { id: "museum", name: "Gallery", blurb: "A little art museum. Every painting is a link, and visitors wander by.", pro: true, swatch: ["#ece6dc", "#b8913f"], category: "popular" },
  { id: "bookshelf", name: "Bookshelf", blurb: "A row of spines. Pick one and it turns to show its cover.", pro: true, swatch: ["#050505", "#b8643f"], category: "popular" },
  { id: "corkboard", name: "Corkboard", blurb: "Polaroids pinned to cork. Lift one to open it.", pro: true, swatch: ["#b98a55", "#fdfbf6"], category: "popular" },
  // Minimal
  { id: "classic", name: "Classic", blurb: "Clean stacked links on warm paper.", pro: false, swatch: ["#f4efe6", "#1d1a16"], category: "minimal" },
  { id: "poster", name: "Poster", blurb: "Big stacked type on a backlit grid poster.", pro: true, swatch: ["#ece8df", "#151515"], category: "minimal" },
  // Spatial
  { id: "wheel", name: "Wheel", blurb: "Your links ride a big turning wheel of cards.", pro: true, swatch: ["#f1f1ef", "#ff6a2b"], category: "spatial" },
  { id: "halo", name: "Halo", blurb: "An arch of tiles drifts over your name.", pro: true, swatch: ["#07080b", "#e9e9ee"], category: "spatial" },
  { id: "portrait", name: "Portrait", blurb: "Your photo, with your links floating around it.", pro: true, swatch: ["#f2f2f2", "#2b2b2b"], category: "spatial" },
  { id: "strata", name: "Strata", blurb: "Links as a stack of folders, fanned out in 3D.", pro: true, swatch: ["#ffffff", "#2a46ff"], category: "spatial" },
  { id: "spindle", name: "Spindle", blurb: "A stack of discs. Swipe and the one in focus opens up.", pro: true, swatch: ["#000000", "#f2f2f2"], category: "spatial" },
  { id: "billboard", name: "Billboard", blurb: "Your name on a roadside billboard, with links drifting by in bubbles.", pro: true, swatch: ["#1d3c7c", "#f4f3f1"], category: "spatial" },
  // Retro tech
  { id: "gloss", name: "Gloss Phone", blurb: "Glossy app icons on a water-drop home screen.", pro: true, swatch: ["#2a6fb0", "#ffffff"], category: "retro" },
  { id: "folders", name: "Folders", blurb: "Every link is a folder in its own material.", pro: true, swatch: ["#e4e4e2", "#3f7be0"], category: "retro" },
  { id: "desktop", name: "Mogg OS", blurb: "A chunky retro desktop. Every link is a file.", pro: true, swatch: ["#7fb7a4", "#f2c94c"], category: "retro" },
  { id: "pass", name: "Pass", blurb: "A worn member card with your photo and your links typed in.", pro: true, swatch: ["#8fd3cf", "#6a3fd1"], category: "retro" },
  // Cozy
  { id: "sunflower", name: "Sunflower", blurb: "Every link is a named petal. Tap one to bloom it.", pro: true, swatch: ["#bfe3f2", "#f2b632"], category: "cozy" },
];

export function themesIn(category: CategoryId) {
  return THEMES.filter((t) => t.category === category);
}

/** Retired themes and the theme that replaced them, so saved pages keep a similar look. */
const RETIRED: Record<string, string> = {
  mixtape: "spindle", rolodex: "strata", vending: "halo", radio: "classic",
  signal: "spindle", prism: "strata", orbit: "halo", field: "classic",
};

export function getTheme(id: string | null | undefined): ThemeDef {
  const resolved = id && RETIRED[id] ? RETIRED[id] : id;
  return THEMES.find((t) => t.id === resolved) ?? THEMES[0];
}

/** Free users always render the default theme, whatever is saved. */
export function effectiveThemeId(saved: string, isPro: boolean) {
  const t = getTheme(saved);
  return !t.pro || isPro ? t.id : DEFAULT_THEME;
}
