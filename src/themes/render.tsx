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
  gloss: dynamic(() => import("./list/gloss")),
  orbit: dynamic(() => import("./list/orbit")),
  signal: dynamic(() => import("./list/signal")),
  corkboard: dynamic(() => import("./list/corkboard")),
  prism: dynamic(() => import("./list/prism")),
  desktop: dynamic(() => import("./list/desktop")),
  field: dynamic(() => import("./list/field")),
};

export function ThemeRenderer({ themeId, ...props }: ThemeProps & { themeId: string }) {
  const C = COMPONENTS[getTheme(themeId).id] ?? COMPONENTS.classic;
  return <C {...props} />;
}
