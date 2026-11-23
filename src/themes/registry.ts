
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
  { id: "retro", name: "Retro tech", blurb: "Folders, member cards and other old things, rebuilt." },
  { id: "cozy", name: "Cozy", blurb: "Hand-made gardens and flowers." },
];

export const DEFAULT_THEME = "classic";

export const THEMES: ThemeDef[] = [
  // Most popular
  { id: "pocket", name: "Pocket Player", blurb: "Flip through album covers with a click wheel.", pro: true, swatch: ["#e9e4dc", "#2a6fd0"], category: "popular" },
  { id: "museum", name: "Gallery", blurb: "A little art museum. Every painting is a link, and visitors wander by.", pro: true, swatch: ["#ece6dc", "#b8913f"], category: "popular" },
  { id: "bookshelf", name: "Bookshelf", blurb: "A row of spines. Pick one and it turns to show its cover.", pro: true, swatch: ["#050505", "#b8643f"], category: "popular" },
  { id: "corkboard", name: "Corkboard", blurb: "Polaroids pinned to cork. Lift one to open it.", pro: true, swatch: ["#b98a55", "#fdfbf6"], category: "popular" },
  // Minimal
  { id: "classic", name: "Classic", blurb: "Clean stacked links on warm paper.", pro: true, swatch: ["#f4efe6", "#1d1a16"], category: "minimal" },
  { id: "poster", name: "Poster", blurb: "Big stacked type on a backlit grid poster.", pro: true, swatch: ["#ece8df", "#151515"], category: "minimal" },
  // Spatial
  { id: "halo", name: "Halo", blurb: "An arch of tiles drifts over your name.", pro: true, swatch: ["#07080b", "#e9e9ee"], category: "spatial" },
  { id: "strata", name: "Strata", blurb: "Links as a stack of folders, fanned out in 3D.", pro: true, swatch: ["#ffffff", "#2a46ff"], category: "spatial" },
  { id: "billboard", name: "Billboard", blurb: "Your name on a roadside billboard, with links drifting by in bubbles.", pro: true, swatch: ["#1d3c7c", "#f4f3f1"], category: "spatial" },
  { id: "panorama", name: "Panorama", blurb: "Your links as screens on a curved band. Spin it to look around.", pro: true, swatch: ["#dcdcda", "#0e0e0e"], category: "spatial" },
  { id: "window", name: "Window Seat", blurb: "A plane window with a flight readout. Swipe for the next link.", pro: true, swatch: ["#0c0e10", "#3f7f86"], category: "spatial" },
  { id: "world", name: "World", blurb: "Your links as cards slowly circling your name.", pro: true, swatch: ["#f6f3ec", "#141414"], category: "spatial" },
  // Retro tech
  { id: "folders", name: "Folders", blurb: "Every link is a folder in its own material.", pro: true, swatch: ["#e4e4e2", "#3f7be0"], category: "retro" },
  { id: "discs", name: "Discs", blurb: "A row of discs. The one in the middle gets circled in marker.", pro: true, swatch: ["#efeeeb", "#141414"], category: "retro" },
  { id: "id", name: "ID Card", blurb: "An old turquoise ID card with your links typed into its fields.", pro: true, swatch: ["#5fa8a0", "#6a3d8f"], category: "retro" },
  // Cozy
  { id: "garden", name: "Garden", blurb: "A poster on a hillside. Every link is a pixel flower.", pro: true, swatch: ["#3b7be0", "#e3231b"], category: "cozy" },
  { id: "sunflower", name: "Sunflower", blurb: "Every link is a named petal. Tap one to bloom it.", pro: true, swatch: ["#bfe3f2", "#f2b632"], category: "cozy" },
];

export function themesIn(category: CategoryId) {
  return THEMES.filter((t) => t.category === category);
}

/** Retired themes and the theme that replaced them, so saved pages keep a similar look. */
const RETIRED: Record<string, string> = {
  mixtape: "discs", rolodex: "strata", vending: "halo", radio: "classic",
  signal: "discs", prism: "strata", orbit: "halo", field: "classic",
  gloss: "pocket", desktop: "folders",
  wheel: "panorama", portrait: "classic", spindle: "discs", dial: "panorama", pass: "id",
};

export function getTheme(id: string | null | undefined): ThemeDef {
  const resolved = id && RETIRED[id] ? RETIRED[id] : id;
  return THEMES.find((t) => t.id === resolved) ?? THEMES[0];
}

/** Once a trial ends without a subscription, the page stays up in the default theme. */
export function effectiveThemeId(saved: string, isPro: boolean) {
  const t = getTheme(saved);
  return !t.pro || isPro ? t.id : DEFAULT_THEME;
}
