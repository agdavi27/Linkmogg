import type { CSSProperties } from "react";
import grass from "./assets/grass.jpg";

function still(id: string): CSSProperties {
  return { backgroundImage: `url(/backdrops/${id}.jpg)`, backgroundSize: "cover", backgroundPosition: "center" };
}

/** Backdrops for themes that sit on one (Meadow). People pick a preset or use their own image. */
export const BACKDROPS: { id: string; name: string; style: CSSProperties; video?: string }[] = [
  // Drew's own clips, looping and muted; the poster frame is what pickers and reduced motion show
  { id: "field", name: "Windy field", video: "/backdrops/field.mp4", style: still("field") },
  { id: "peaks", name: "Mountain dusk", video: "/backdrops/peaks.mp4", style: still("peaks") },
  { id: "sea", name: "Open sea", video: "/backdrops/sea.mp4", style: still("sea") },
  { id: "grass", name: "Still grass", style: { backgroundImage: `url(${grass.src})`, backgroundSize: "cover", backgroundPosition: "center" } },
  { id: "sky", name: "Sky", style: { background: "radial-gradient(60% 40% at 30% 30%, #fff8 0%, transparent 70%), radial-gradient(50% 30% at 75% 60%, #fff6 0%, transparent 70%), linear-gradient(180deg, #5b9be0 0%, #a9cdf0 70%, #e6eef3 100%)" } },
  { id: "sand", name: "Sand", style: { background: "repeating-radial-gradient(circle at 30% 20%, #0000000a 0 1px, transparent 1px 3px), linear-gradient(170deg, #e9d6b0, #d7bd8c 60%, #c8a671)" } },
  { id: "night", name: "Night", style: { background: "radial-gradient(1px 1px at 20% 30%, #fff, transparent), radial-gradient(1px 1px at 70% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 40% 70%, #fffb, transparent), radial-gradient(1px 1px at 85% 80%, #fff, transparent), linear-gradient(180deg, #0b1433, #1d2b5c 70%, #3a3f6e)" } },
  { id: "clay", name: "Clay", style: { background: "linear-gradient(160deg, #d9743f, #b85a2c)" } },
];
export const DEFAULT_BACKDROP = "field";

export function isPresetBackdrop(v: string) {
  return BACKDROPS.some((b) => b.id === v);
}

/** The looping video for a saved backdrop, if it is one. */
export function backdropVideo(v: string | null | undefined): string | null {
  return BACKDROPS.find((b) => b.id === (v || DEFAULT_BACKDROP))?.video ?? null;
}

/** The CSS for a saved backdrop: a preset, or the person's own image. */
export function backdropStyle(v: string | null | undefined): CSSProperties {
  const preset = BACKDROPS.find((b) => b.id === (v || DEFAULT_BACKDROP));
  if (preset) return preset.style;
  if (v && /^https:\/\//.test(v)) return { backgroundImage: `url("${v.replace(/["\\]/g, "")}")`, backgroundSize: "cover", backgroundPosition: "center" };
  return BACKDROPS.find((b) => b.id === DEFAULT_BACKDROP)!.style;
}
