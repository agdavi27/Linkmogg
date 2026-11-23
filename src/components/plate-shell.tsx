import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Logo } from "./logo";

/**
 * Sign-in and first-run screens: a color plate carrying one big line, and the form beside it on the plain ground.
 * On phones the plate shrinks to a band above the form.
 */
export function PlateShell({ title, note, plate = "var(--accent)", children }: { title: ReactNode; note?: ReactNode; plate?: string; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh grid-cols-1 gap-2 p-2 sm:p-3 lg:grid-cols-[1.05fr_1fr]">
      <section className="plate flex flex-col justify-between rounded-[28px] p-6 sm:rounded-[36px] sm:p-10" style={{ ["--plate" as string]: plate } as CSSProperties}>
        <Link href="/" aria-label="Linkmogg home" className="w-fit rounded-lg"><Logo className="text-white [&_rect]:fill-white [&_circle:first-of-type]:stroke-[#111]" /></Link>
        <div className="mt-10 lg:mt-0">
          <h1 className="type-plate text-[clamp(2.8rem,7vw,6rem)]">{title}</h1>
          {note ? <p className="mt-4 max-w-[40ch] text-lg opacity-85">{note}</p> : null}
        </div>
      </section>
      <section className="flex items-center justify-center px-3 py-10 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  );
}
