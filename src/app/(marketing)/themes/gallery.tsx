"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES, getTheme, themesIn } from "@/themes/registry";
import { PhonePlate, PlateDot } from "@/components/phone-plate";
import { DEMO } from "@/themes/demo";
import { BACKDROPS, DEFAULT_BACKDROP } from "@/themes/backdrops";

export function Gallery({ initial }: { initial: string }) {
  const [id, setId] = useState(getTheme(initial).id);
  const [name, setName] = useState("");
  const [backdrop, setBackdrop] = useState(DEFAULT_BACKDROP);
  const t = getTheme(id);
  const data = { ...DEMO, displayName: name || DEMO.displayName, backdrop };
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 pb-20 pt-4 sm:px-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div>
        <h1 className="type-plate text-[clamp(3rem,6vw,4.4rem)]">Try every theme</h1>
        <p className="mt-3 text-ink-2">Same links, twenty-two ways to show them. Every theme is free for 14 days, no card needed.</p>
        <label htmlFor="demo-name" className="label mt-6">See it with your name</label>
        <input id="demo-name" className="field" placeholder="Juno Park" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
        <div className="mt-6 flex flex-col gap-5">
          {CATEGORIES.map((c) => (
            <section key={c.id} aria-labelledby={`cat-${c.id}`}>
              <h2 id={`cat-${c.id}`} className="px-3 text-sm font-bold text-ink">{c.name}</h2>
              <ul className="mt-1 flex flex-col gap-0.5">
                {themesIn(c.id).map((x) => (
                  <li key={x.id}>
                    <button type="button" onClick={() => { setId(x.id); history.replaceState(null, "", `?t=${x.id}`); }} aria-pressed={id === x.id}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${id === x.id ? "bg-ink text-white" : "hover:bg-black/5"}`}>
                      <PlateDot themeId={x.id} className="size-6 rounded-lg" />
                      <span className="min-w-0 flex-1 font-semibold">{x.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center">
        <PhonePlate themeId={id} data={data} className="lg:sticky lg:top-4"
          caption={<><span className="type-title block text-2xl">{t.name}</span><span className="mx-auto mt-1 block max-w-[40ch] text-sm opacity-80">{t.blurb}</span></>} />
        {id === "meadow" ? (
          <div className="mt-4 flex flex-col items-center">
            <p className="text-sm font-semibold">Backdrop</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {BACKDROPS.map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setBackdrop(b.id)} aria-pressed={backdrop === b.id} title={b.name}
                    className={`flex flex-col items-center gap-1 rounded-xl p-1 text-[11px] transition-transform active:scale-95 ${backdrop === b.id ? "bg-ink text-paper" : "hover:bg-black/5"}`}>
                    <span aria-hidden className="block size-12 rounded-lg ring-1 ring-black/10" style={b.style} />
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs text-ink-3">Or upload your own once it&apos;s your page.</p>
          </div>
        ) : null}
        <Link href="/login" className="btn btn-primary mt-5">Use {t.name} on my page</Link>
      </div>
    </div>
  );
}
