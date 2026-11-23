"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { getTheme } from "./registry";
import type { ThemeProps } from "./types";

// Each theme is its own chunk, so a public page only downloads the theme it uses.
const COMPONENTS: Record<string, ComponentType<ThemeProps>> = {
  classic: dynamic(() => import("./list/classic")),
  pocket: dynamic(() => import("./list/pocket")),
  sunflower: dynamic(() => import("./list/sunflower")),
  bookshelf: dynamic(() => import("./list/bookshelf")),
  corkboard: dynamic(() => import("./list/corkboard")),
  halo: dynamic(() => import("./list/halo")),
  strata: dynamic(() => import("./list/strata")),
  museum: dynamic(() => import("./list/museum")),
  folders: dynamic(() => import("./list/folders")),
  billboard: dynamic(() => import("./list/billboard")),
  poster: dynamic(() => import("./list/poster")),
  garden: dynamic(() => import("./list/garden")),
  panorama: dynamic(() => import("./list/panorama")),
  discs: dynamic(() => import("./list/discs")),
  id: dynamic(() => import("./list/id")),
  window: dynamic(() => import("./list/window")),
  world: dynamic(() => import("./list/world")),
  meadow: dynamic(() => import("./list/meadow")),
  glow: dynamic(() => import("./list/glow")),
  stack: dynamic(() => import("./list/stack")),
  scatter: dynamic(() => import("./list/scatter")),
  cases: dynamic(() => import("./list/cases")),
};

export function ThemeRenderer({ themeId, ...props }: ThemeProps & { themeId: string }) {
  const C = COMPONENTS[getTheme(themeId).id] ?? COMPONENTS.classic;
  return <C {...props} />;
}
