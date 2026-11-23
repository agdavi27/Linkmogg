import type { CSSProperties, ReactNode } from "react";
import { getTheme, plateOf } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import type { PageData } from "@/themes/types";

/**
 * A live page shown the way the whole site shows products: a phone set on its theme's color plate.
 * Used by the themes page, Convert and the editor preview.
 */
export function PhonePlate({ themeId, data, caption, className = "", height = "h-[min(700px,calc(100dvh-170px))] min-h-[520px]" }: {
  themeId: string; data: PageData; caption?: ReactNode; className?: string; height?: string;
}) {
  const p = plateOf(themeId);
  return (
    <div className={`plate flex w-full flex-col items-center rounded-[32px] px-4 pb-5 pt-7 ${className}`}
      style={{ ["--plate" as string]: p.bg, ["--plate-ink" as string]: p.ink } as CSSProperties}>
      <div className="plate-shadow w-full max-w-[360px] rounded-[44px] bg-[#0d0d0d] p-[9px]">
        <div key={themeId} className={`lm-swap relative overflow-hidden rounded-[35px] [transform:translateZ(0)] ${height}`}>
          <ThemeRenderer themeId={themeId} data={data} mode="preview" />
        </div>
      </div>
      <div className="mt-4 text-center" aria-live="polite">{caption ?? <span className="type-title text-xl">{getTheme(themeId).name}</span>}</div>
    </div>
  );
}

/** A small round chip in a theme's plate color. */
export function PlateDot({ themeId, className = "size-4" }: { themeId: string; className?: string }) {
  return <span aria-hidden className={`shrink-0 rounded-full ring-1 ring-black/10 ${className}`} style={{ background: plateOf(themeId).bg }} />;
}
