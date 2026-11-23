
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
  { id: "mixtape", name: "Mixtape", blurb: "A hand-labeled cassette. Pick a track and press play.", pro: true, swatch: ["#1d2b2a", "#e2573b"] },
  { id: "rolodex", name: "Rolodex", blurb: "Flip through a desk card file, one link per card.", pro: true, swatch: ["#d9d2c3", "#c2410c"] },
  { id: "corkboard", name: "Corkboard", blurb: "Polaroids pinned to cork. Lift one to open it.", pro: true, swatch: ["#b98a55", "#fdfbf6"] },
  { id: "vending", name: "Vending Machine", blurb: "Punch in a code, and your link drops into the tray.", pro: true, swatch: ["#14202b", "#ffe066"] },
  { id: "desktop", name: "Mogg OS", blurb: "A chunky retro desktop. Every link is a file.", pro: true, swatch: ["#7fb7a4", "#f2c94c"] },
  { id: "radio", name: "Radio Dial", blurb: "Tune a wooden radio until a station comes in.", pro: true, swatch: ["#2b1e16", "#ff6a2b"] },
];

export function getTheme(id: string | null | undefined): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Free users always render the default theme, whatever is saved. */
export function effectiveThemeId(saved: string, isPro: boolean) {
  const t = getTheme(saved);
  return !t.pro || isPro ? t.id : DEFAULT_THEME;
}
