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
  wheel: dynamic(() => import("./list/wheel")),
  halo: dynamic(() => import("./list/halo")),
  portrait: dynamic(() => import("./list/portrait")),
  strata: dynamic(() => import("./list/strata")),
  museum: dynamic(() => import("./list/museum")),
  folders: dynamic(() => import("./list/folders")),
  spindle: dynamic(() => import("./list/spindle")),
  billboard: dynamic(() => import("./list/billboard")),
  pass: dynamic(() => import("./list/pass")),
  poster: dynamic(() => import("./list/poster")),
  garden: dynamic(() => import("./list/garden")),
  panorama: dynamic(() => import("./list/panorama")),
  discs: dynamic(() => import("./list/discs")),
  dial: dynamic(() => import("./list/dial")),
};

export function ThemeRenderer({ themeId, ...props }: ThemeProps & { themeId: string }) {
  const C = COMPONENTS[getTheme(themeId).id] ?? COMPONENTS.classic;
  return <C {...props} />;
}
