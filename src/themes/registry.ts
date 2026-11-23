
export type ThemeDef = {
  id: string;
  name: string;
  blurb: string;
  pro: boolean;
  swatch: [string, string];
};

export const DEFAULT_THEME = "classic";

export const THEMES: ThemeDef[] = [
  { id: "classic", name: "Classic", blurb: "Clean stacked links on warm paper.", pro: false, swatch: ["#f4efe6", "#1d1a16"] },
  { id: "pocket", name: "Pocket Player", blurb: "Spin a click wheel through your links. Press the center to open.", pro: true, swatch: ["#e9e4dc", "#2a6fd0"] },
  { id: "sunflower", name: "Sunflower", blurb: "Every link is a petal. Tap one to bloom it.", pro: true, swatch: ["#bfe3f2", "#f2b632"] },
  { id: "bookshelf", name: "Bookshelf", blurb: "Links are book spines. Pull one off the shelf.", pro: true, swatch: ["#2a1d14", "#c8a15a"] },
  { id: "gloss", name: "Gloss Phone", blurb: "Glossy app icons on a water-drop home screen.", pro: true, swatch: ["#2a6fb0", "#ffffff"] },
  { id: "corkboard", name: "Corkboard", blurb: "Polaroids pinned to cork. Lift one to open it.", pro: true, swatch: ["#b98a55", "#fdfbf6"] },
  { id: "orbit", name: "Orbit", blurb: "Links circle your avatar like satellites. Catch one to open it.", pro: true, swatch: ["#05060a", "#7cf7ff"] },
  { id: "signal", name: "Signal", blurb: "A quiet heads-up display with a live waveform.", pro: true, swatch: ["#07110f", "#3cffb4"] },
  { id: "prism", name: "Prism", blurb: "Frosted glass over slow, shifting light.", pro: true, swatch: ["#eef0f6", "#7a5cff"] },
  { id: "field", name: "Field", blurb: "Big type over a dot field that ripples when you touch it.", pro: true, swatch: ["#ece9e2", "#ff4d1f"] },
  { id: "desktop", name: "Mogg OS", blurb: "A chunky retro desktop. Every link is a file.", pro: true, swatch: ["#7fb7a4", "#f2c94c"] },
];

/** Retired themes and the theme that replaced them, so saved pages keep a similar look. */
const RETIRED: Record<string, string> = { mixtape: "signal", rolodex: "prism", vending: "orbit", radio: "field" };

export function getTheme(id: string | null | undefined): ThemeDef {
  const resolved = id && RETIRED[id] ? RETIRED[id] : id;
  return THEMES.find((t) => t.id === resolved) ?? THEMES[0];
}

/** Free users always render the default theme, whatever is saved. */
export function effectiveThemeId(saved: string, isPro: boolean) {
  const t = getTheme(saved);
  return !t.pro || isPro ? t.id : DEFAULT_THEME;
}
