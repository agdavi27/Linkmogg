"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { getTheme, retiredLayout } from "./registry";
import type { ThemeProps } from "./types";

// Each theme is its own chunk, so a public page only downloads the theme it uses.
const COMPONENTS: Record<string, ComponentType<ThemeProps>> = {
  classic: dynamic(() => import("./list/classic")),
  pocket: dynamic(() => import("./list/pocket")),
  reels: dynamic(() => import("./list/reels")),
  museum: dynamic(() => import("./list/museum")),
  bookshelf: dynamic(() => import("./list/bookshelf")),
  corkboard: dynamic(() => import("./list/corkboard")),
  billboard: dynamic(() => import("./list/billboard")),
  stack: dynamic(() => import("./list/stack")),
  cases: dynamic(() => import("./list/cases")),
  folders: dynamic(() => import("./list/folders")),
  meadow: dynamic(() => import("./list/meadow")),
  garden: dynamic(() => import("./list/garden")),
};

export function ThemeRenderer({ themeId, ...props }: ThemeProps & { themeId: string }) {
  const C = COMPONENTS[getTheme(themeId).id] ?? COMPONENTS.classic;
  // a page saved on a retired sideways theme keeps that layout
  const layout = props.data.layout ?? retiredLayout(themeId);
  return <C {...props} data={layout === props.data.layout ? props.data : { ...props.data, layout }} />;
}
