"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ThemeProps } from "./types";

// Each theme is its own chunk, so a public page only downloads the theme it uses.
const COMPONENTS: Record<string, ComponentType<ThemeProps>> = {
  classic: dynamic(() => import("./list/classic")),
  pocket: dynamic(() => import("./list/pocket")),
  sunflower: dynamic(() => import("./list/sunflower")),
  bookshelf: dynamic(() => import("./list/bookshelf")),
  gloss: dynamic(() => import("./list/gloss")),
  mixtape: dynamic(() => import("./list/mixtape")),
  rolodex: dynamic(() => import("./list/rolodex")),
  corkboard: dynamic(() => import("./list/corkboard")),
  vending: dynamic(() => import("./list/vending")),
  desktop: dynamic(() => import("./list/desktop")),
  radio: dynamic(() => import("./list/radio")),
};

export function ThemeRenderer({ themeId, ...props }: ThemeProps & { themeId: string }) {
  const C = COMPONENTS[themeId] ?? COMPONENTS.classic;
  return <C {...props} />;
}
