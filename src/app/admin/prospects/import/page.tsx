import { THEMES } from "@/themes/registry";
import { PLATFORMS } from "@/lib/outreach/import-parse";
import { importAction, manualAddAction } from "../../actions";
import { Flash } from "../../flash";

export default async function ImportPage({ searchParams }: PageProps<"/admin/prospects/import">) {
  const sp = await searchParams;
  return (
    <main>
      <Flash msg={sp.msg} />
      <h1 className="font-site text-3xl font-semibold tracking-[-0.03em]">Import & add</h1>
      <p className="mt-2 max-w-[70ch] text-ink-2">
        Add creators you found yourself. For each one we read the public link-in-bio page you give us, build a preview right away, and pull a contact email only if they list one publicly. Pages whose robots.txt asks bots to stay out are skipped and flagged so you can add them by hand.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5" aria-labelledby="imp-h">
          <h2 id="imp-h" className="font-site text-lg font-semibold">Paste or upload a list</h2>
          <form action={importAction} className="mt-4 flex flex-col gap-3">
            <div>
              <label className="label" htmlFor="platform">Platform for these handles</label>
              <select id="platform" name="platform" className="field">{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select>
            </div>
            <div>
              <label className="label" htmlFor="text">One creator per line</label>
              <textarea id="text" name="text" rows={8} className="field font-mono text-sm" placeholder={"@samrivera https://linktr.ee/samrivera\n@leemakes https://beacons.ai/leemakes lee@example.com"} />
            </div>
            <div>
              <label className="label" htmlFor="file">Or a CSV file</label>
              <input id="file" name="file" type="file" accept=".csv,text/csv,text/plain" className="text-sm" />
              <p className="mt-1.5 text-xs text-ink-3">Columns: <code>handle, platform, link_url, email, name</code>. Only <code>handle</code> is required.</p>
            </div>
            <button className="btn btn-primary self-start">Import and build previews</button>
          </form>
        </section>

        <section className="card p-5" aria-labelledby="man-h">
          <h2 id="man-h" className="font-site text-lg font-semibold">Add one by hand</h2>
          <form action={manualAddAction} className="mt-4 grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="m-handle">Handle</label><input id="m-handle" name="handle" required className="field" placeholder="@samrivera" /></div>
            <div><label className="label" htmlFor="m-platform">Platform</label><select id="m-platform" name="platform" className="field">{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div className="col-span-2"><label className="label" htmlFor="m-src">Their link-in-bio page (optional)</label><input id="m-src" name="sourceUrl" className="field" placeholder="https://linktr.ee/samrivera" /></div>
            <div><label className="label" htmlFor="m-name">Name</label><input id="m-name" name="name" className="field" /></div>
            <div><label className="label" htmlFor="m-email">Public email</label><input id="m-email" name="email" type="email" className="field" /></div>
            <div className="col-span-2">
              <label className="label" htmlFor="m-links">Links, if you&apos;re not giving a page above</label>
              <textarea id="m-links" name="links" rows={4} className="field font-mono text-sm" placeholder={"Shop https://example.com/shop\nNew video https://youtube.com/watch?v=..."} />
            </div>
            <div className="col-span-2">
              <label className="label" htmlFor="m-theme">Theme</label>
              <select id="m-theme" name="theme" className="field" defaultValue="random">
                <option value="random">Random</option>
                {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary col-span-2 justify-self-start">Add and build preview</button>
          </form>
        </section>
      </div>
    </main>
  );
}
