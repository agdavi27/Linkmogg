"use client";

import { useState } from "react";
import { THEMES } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";

const FEATURED = ["pocket", "sunflower", "bookshelf", "gloss", "vending", "radio"];

export function DemoPhone() {
  const [id, setId] = useState(FEATURED[0]);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[min(340px,86vw)] overflow-hidden rounded-[44px] border-[10px] border-ink bg-ink shadow-[0_40px_80px_-40px_rgba(30,20,0,.7)]">
        <div className="relative h-[620px] overflow-y-auto overscroll-contain rounded-[34px] [transform:translateZ(0)]">
          <ThemeRenderer themeId={id} data={DEMO} mode="preview" />
        </div>
      </div>
      <div role="group" aria-label="Try a theme" className="flex flex-wrap justify-center gap-1.5">
        {FEATURED.map((t) => {
          const def = THEMES.find((x) => x.id === t)!;
          return (
            <button key={t} type="button" onClick={() => setId(t)} aria-pressed={id === t}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${id === t ? "bg-ink text-paper" : "bg-white text-ink-2 ring-1 ring-line hover:text-ink"}`}>
              <span aria-hidden className="size-3 rounded-full ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${def.swatch[0]} 50%, ${def.swatch[1]} 50%)` }} />
              {def.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
