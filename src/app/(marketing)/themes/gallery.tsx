"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES, getTheme, themesIn } from "@/themes/registry";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";

export function Gallery({ initial }: { initial: string }) {
  const [id, setId] = useState(getTheme(initial).id);
  const [name, setName] = useState("");
  const t = getTheme(id);
  const data = { ...DEMO, displayName: name || DEMO.displayName };
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 pb-20 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-[-0.03em]">Try every theme</h1>
        <p className="mt-3 text-ink-2">Same links, seventeen ways to show them. Tap, spin, drag and tune. Everything here works.</p>
        <label htmlFor="demo-name" className="label mt-6">See it with your name</label>
        <input id="demo-name" className="field" placeholder="Juno Park" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <div className="mt-6 flex flex-col gap-5">
          {CATEGORIES.map((c) => (
            <section key={c.id} aria-labelledby={`cat-${c.id}`}>
              <h2 id={`cat-${c.id}`} className="px-3 text-sm font-semibold text-ink">{c.name} <span className="font-normal text-ink-3">· {c.blurb}</span></h2>
              <ul className="mt-1 flex flex-col gap-0.5">
                {themesIn(c.id).map((x) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => { setId(x.id); history.replaceState(null, "", `?t=${x.id}`); }} aria-pressed={id === x.id}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${id === x.id ? "bg-ink text-paper" : "hover:bg-black/5"}`}>
                      <span aria-hidden className="size-7 shrink-0 rounded-lg ring-1 ring-black/10" style={{ background: `linear-gradient(135deg, ${x.swatch[0]} 55%, ${x.swatch[1]} 55%)` }} />
                      <span className="min-w-0 flex-1 font-semibold">{x.name}</span>
                      {x.pro ? <span className={`text-[10px] font-bold tracking-wider ${id === x.id ? "text-paper/60" : "text-ink-3"}`}>PRO</span> : <span className="text-[10px] font-bold tracking-wider text-forest">FREE</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[400px] overflow-hidden rounded-[44px] border-[10px] border-ink bg-ink shadow-[0_40px_80px_-40px_rgba(30,20,0,.7)]">
          <div key={id} className="relative h-[min(760px,calc(100dvh-140px))] min-h-[560px] overflow-hidden rounded-[34px] [transform:translateZ(0)]">
            <ThemeRenderer themeId={id} data={data} mode="preview" />
          </div>
        </div>
        <p className="mt-4 max-w-[44ch] text-center text-sm text-ink-2">{t.blurb}</p>
        <Link href="/login" className="btn btn-accent mt-4">Use {t.name} on my page</Link>
      </div>
    </div>
  );
}
