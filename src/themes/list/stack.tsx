"use client";

import type { ThemeProps } from "../types";
import StackVertical from "./stack-vertical";
import StackHorizontal from "./stack-horizontal";

/** Stack: the same pages, stacked up and down (the default) or fanned out sideways. */
export default function Stack(props: ThemeProps) {
  return props.data.layout === "horizontal" ? <StackHorizontal {...props} /> : <StackVertical {...props} />;
}
