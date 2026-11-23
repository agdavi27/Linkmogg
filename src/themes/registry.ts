
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
  { id: "spatial", name: "Spatial", blurb: "3D scenes, stacks and cases." },
  { id: "retro", name: "Retro tech", blurb: "Old desktops and folders, rebuilt." },
  { id: "cozy", name: "Cozy", blurb: "A hand-made garden." },
];

/** New pages start here. */
export const DEFAULT_THEME = "pocket";
/** A plain look, kept out of the pickers. Pages fall back to it when a trial ends without a plan. */
export const FALLBACK_THEME = "classic";

export const THEMES: ThemeDef[] = [
  // Most popular
  { id: "pocket", name: "Pocket Player", blurb: "Flip through album covers with a click wheel.", pro: true, swatch: ["#ff5a1f", "#c9ccd0"], category: "popular" },
  { id: "reels", name: "Reels", blurb: "Your reels playing soft and blurred behind your links in white.", pro: true, swatch: ["#111111", "#ffffff"], category: "popular" },
  { id: "museum", name: "Gallery", blurb: "A little art museum. Every painting is a link, hung right in front of you.", pro: true, swatch: ["#ece6dc", "#b8913f"], category: "popular" },
  { id: "bookshelf", name: "Bookshelf", blurb: "Wooden shelves with every link standing cover-out.", pro: true, swatch: ["#c8914f", "#8a5a2b"], category: "popular" },
  { id: "corkboard", name: "Corkboard", blurb: "Polaroids pinned to cork. Lift one to open it.", pro: true, swatch: ["#b98a55", "#fdfbf6"], category: "popular" },
  // Spatial
  { id: "billboard", name: "Billboard", blurb: "Your name on a roadside billboard, with links drifting by in bubbles.", pro: true, swatch: ["#1d3c7c", "#f4f3f1"], category: "spatial" },
  { id: "stack", name: "Stack", blurb: "Your links as a deep stack of pages. Stack them up and down, or fan them sideways.", pro: true, swatch: ["#0b0b0c", "#e94a2b"], category: "spatial" },
  { id: "cases", name: "Cases", blurb: "A long row of CD cases. Tap one and it slides out.", pro: true, swatch: ["#d6d6d6", "#151515"], category: "spatial" },
  // Retro tech
  { id: "folders", name: "Folders", blurb: "A grey 90s desktop. Every link is a folder, opened in a little window.", pro: true, swatch: ["#008080", "#c0c0c0"], category: "retro" },
  { id: "meadow", name: "Meadow", blurb: "A desktop lying in the grass. Your links are files around a little window.", pro: true, swatch: ["#3d6b2a", "#69bdf0"], category: "retro" },
  // Cozy
  { id: "garden", name: "Garden", blurb: "A hillside of labeled buds. Tap one and it blooms into the link.", pro: true, swatch: ["#3b7be0", "#e3231b"], category: "cozy" },
];

/** Kept out of the pickers, but still renderable. */
const HIDDEN: ThemeDef[] = [
  { id: "classic", name: "Classic", blurb: "Clean stacked links on warm paper.", pro: false, swatch: ["#f4efe6", "#1d1a16"], category: "popular" },
];

/** Each theme's color plate: the saturated field it sits on across the site, and the text color that reads on it. */
const PLATES: Record<string, [string, string]> = {
  pocket: ["#ff5a1f", "#ffffff"], reels: ["#1a1a1a", "#ffffff"], museum: ["#c99a2e", "#141414"], bookshelf: ["#8a3b1f", "#ffffff"], corkboard: ["#b5793f", "#ffffff"],
  classic: ["#1c1c1c", "#ffffff"], poster: ["#d93a2b", "#ffffff"], halo: ["#0b0d14", "#ffffff"], strata: ["#2a46ff", "#ffffff"],
  billboard: ["#2f6fd6", "#ffffff"], panorama: ["#9a9a96", "#141414"], window: ["#1f5b66", "#ffffff"], world: ["#e6d3a8", "#141414"],
  stack: ["#e94a2b", "#ffffff"], cases: ["#bdbdbd", "#141414"], meadow: ["#3f8f2e", "#ffffff"], glow: ["#1736c9", "#ffffff"],
  scatter: ["#d9d9de", "#141414"], folders: ["#008080", "#ffffff"], discs: ["#141414", "#ffffff"], id: ["#5fa8a0", "#141414"],
  garden: ["#3b7be0", "#ffffff"], sunflower: ["#f2b632", "#141414"],
};
export function plateOf(id: string): { bg: string; ink: string } {
  const [bg, ink] = PLATES[getTheme(id).id] ?? ["#1c1c1c", "#ffffff"];
  return { bg, ink };
}

export function themesIn(category: CategoryId) {
  return THEMES.filter((t) => t.category === category);
}

/** Categories that still have themes in them. */
export function liveCategories() {
  return CATEGORIES.filter((c) => themesIn(c.id).length > 0);
}

/** Retired themes and the theme that replaced them, so saved pages keep a similar look. */
const RETIRED: Record<string, string> = {
  mixtape: "discs", rolodex: "strata", vending: "halo", radio: "classic",
  signal: "discs", prism: "strata", orbit: "halo", field: "classic",
  gloss: "pocket", desktop: "folders",
  wheel: "panorama", portrait: "classic", spindle: "discs", dial: "panorama", pass: "id",
  // retired 2026-11-23
  poster: "stack", halo: "stack", panorama: "cases", scatter: "meadow", sunflower: "garden",
  id: "folders", glow: "folders", window: "billboard", world: "cases", discs: "cases", strata: "stack",
};

export function getTheme(id: string | null | undefined): ThemeDef {
  let resolved = id;
  for (let i = 0; i < 4 && resolved && RETIRED[resolved]; i++) resolved = RETIRED[resolved];
  return THEMES.find((t) => t.id === resolved) ?? HIDDEN.find((t) => t.id === resolved) ?? THEMES[0];
}

/** Saved pages that used Strata keep its sideways layout inside Stack. */
export function retiredLayout(id: string | null | undefined): "horizontal" | null {
  return id === "strata" || id === "rolodex" || id === "prism" ? "horizontal" : null;
}

/** Once a trial ends without a subscription, the page stays up in the default theme. */
export function effectiveThemeId(saved: string, isPro: boolean) {
  const t = getTheme(saved);
  return !t.pro || isPro ? t.id : FALLBACK_THEME;
}
