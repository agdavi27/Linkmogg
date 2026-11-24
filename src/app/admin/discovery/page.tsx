import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, prospects } from "@/lib/db";
import { getSettings } from "@/lib/outreach/core";
import { callsLastHour, checkConnection, mockMode } from "@/lib/instagram/client";
import { candidateCounts, recentCandidates } from "@/lib/instagram/discovery";
import { searchConfigured } from "@/lib/instagram/search";
import { addHandlesAction, disconnectAction, runNowAction, saveDiscoveryAction } from "./actions";
import { Flash } from "../flash";

export const dynamic = "force-dynamic";

export default async function DiscoveryPage({ searchParams }: PageProps<"/admin/discovery">) {
  const [s, sp, counts, recent, calls] = await Promise.all([getSettings(), searchParams, candidateCounts(), recentCandidates(30), callsLastHour()]);
  const conn = s.igUserId || mockMode() ? await checkConnection() : null;
  const found = await db.select({ id: prospects.id, handle: prospects.handle, followers: prospects.igFollowers, reels: prospects.igReels, from: prospects.discoveredFrom, source: prospects.source, email: prospects.email })
    .from(prospects).where(eq(prospects.platform, "instagram")).orderBy(desc(prospects.createdAt)).limit(12);
  const mock = mockMode();

  return (
    <main className="max-w-4xl">
      <Flash msg={sp.msg} />
      <h1 className="font-site text-3xl font-semibold tracking-[-0.03em]">Discovery</h1>
      <p className="mt-2 max-w-[70ch] text-ink-2">Finds Instagram creators with a Linktree, builds each one a private Reels preview from their own reels, and hands them to outreach. Lookups go through Instagram&apos;s official Business Discovery API, so it only sees Business and Creator accounts.</p>
      {mock ? <p className="mt-4 rounded-xl bg-accent/10 p-3 text-sm text-accent-ink">Test mode: META_APP_ID isn&apos;t set, so every lookup returns a made-up account. Nothing touches Instagram.</p> : null}

      <section className="card mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <h2 className="font-site text-lg font-semibold">Linkmogg&apos;s Instagram account</h2>
          <p className="text-sm text-ink-2">
            {conn?.ok ? <>Connected as <strong>@{conn.username}</strong>.</> : conn ? <>Not working: {conn.error}</> : "Not connected. It needs to be a Business account linked to a Facebook Page."}
            {" "}{calls} of {s.igCallsPerHour} lookups used this hour.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/api/instagram/connect" prefetch={false} className="btn btn-primary btn-sm">{s.igUserId ? "Reconnect" : "Connect Instagram"}</Link>
          {s.igUserId ? <form action={disconnectAction}><button className="btn btn-ghost btn-sm">Disconnect</button></form> : null}
        </div>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([["Waiting", counts.pending], ["Previews built", counts.qualified], ["Skipped", counts.rejected], ["Errors", counts.error]] as const).map(([k, v]) => (
          <div key={k} className="card p-4"><p className="text-sm text-ink-2">{k}</p><p className="font-site text-2xl font-semibold tabular">{v ?? 0}</p></div>
        ))}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form action={addHandlesAction} className="card flex flex-col gap-3 p-5">
          <h2 className="font-site text-lg font-semibold">Build previews for these handles</h2>
          <p className="-mt-1 text-sm text-ink-2">Paste Instagram handles or profile links. They skip the follower and Linktree rules. The first 10 run now.</p>
          <label className="sr-only" htmlFor="handles">Handles</label>
          <textarea id="handles" name="handles" rows={4} className="field text-sm" placeholder={"@junopark\ninstagram.com/someone"} />
          <button className="btn btn-primary btn-sm self-start">Look up and build</button>
        </form>
        <div className="card flex flex-col gap-3 p-5">
          <h2 className="font-site text-lg font-semibold">Run discovery now</h2>
          <p className="-mt-1 text-sm text-ink-2">The daily job runs at 9 AM Eastern. This does up to 20 lookups right away, even while discovery is switched off.</p>
          <form action={runNowAction}><button className="btn btn-ghost btn-sm">Run 20 lookups</button></form>
        </div>
      </div>

      <form action={saveDiscoveryAction} className="card mt-6 flex flex-col gap-5 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-site text-lg font-semibold">Automatic discovery</h2>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="discoveryEnabled" defaultChecked={s.discoveryEnabled} className="size-4 accent-[var(--accent)]" /> Run every day</label>
        </div>
        <div>
          <label className="label" htmlFor="discoverySeeds">Starting accounts</label>
          <textarea id="discoverySeeds" name="discoverySeeds" rows={4} defaultValue={s.discoverySeeds} className="field text-sm" placeholder={"One handle per line. 10 to 20 per niche is plenty."} />
          <p className="mt-1 text-xs text-ink-3">Discovery reads their recent captions and follows every @mention, then the mentions of those, up to the depth below.</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div><label className="label" htmlFor="discoveryMinFollowers">Min followers</label><input id="discoveryMinFollowers" name="discoveryMinFollowers" type="number" min={0} defaultValue={s.discoveryMinFollowers} className="field tabular" /></div>
          <div><label className="label" htmlFor="discoveryMaxFollowers">Max followers</label><input id="discoveryMaxFollowers" name="discoveryMaxFollowers" type="number" min={0} defaultValue={s.discoveryMaxFollowers} className="field tabular" /></div>
          <div><label className="label" htmlFor="discoveryMinReels">Min reels</label><input id="discoveryMinReels" name="discoveryMinReels" type="number" min={1} max={6} defaultValue={s.discoveryMinReels} className="field tabular" /></div>
          <div><label className="label" htmlFor="discoveryMaxDepth">Hops from a starting account</label><input id="discoveryMaxDepth" name="discoveryMaxDepth" type="number" min={0} max={6} defaultValue={s.discoveryMaxDepth} className="field tabular" /></div>
          <div><label className="label" htmlFor="discoveryLookupsPerRun">Lookups per day</label><input id="discoveryLookupsPerRun" name="discoveryLookupsPerRun" type="number" min={1} max={180} defaultValue={s.discoveryLookupsPerRun} className="field tabular" /></div>
          <div><label className="label" htmlFor="igCallsPerHour">Max lookups per hour</label><input id="igCallsPerHour" name="igCallsPerHour" type="number" min={10} max={190} defaultValue={s.igCallsPerHour} className="field tabular" /></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="discoveryLinkHosts">Bio links that count</label>
            <textarea id="discoveryLinkHosts" name="discoveryLinkHosts" rows={2} defaultValue={s.discoveryLinkHosts} className="field text-sm" />
            <p className="mt-1 text-xs text-ink-3">One per line. We only read this from their Instagram profile, never by visiting the page.</p>
          </div>
          <div>
            <label className="label" htmlFor="searchQueries">Search for more starting accounts</label>
            <textarea id="searchQueries" name="searchQueries" rows={2} defaultValue={s.searchQueries} className="field text-sm" placeholder={"ceramics studio\nindie synth"} />
            <p className="mt-1 text-xs text-ink-3">{searchConfigured() ? "Runs each query through Brave Search, limited to the hosts on the left." : "Needs BRAVE_SEARCH_API_KEY in Vercel. Leave empty to skip."}</p>
          </div>
        </div>
        <button className="btn btn-primary self-start">Save discovery settings</button>
      </form>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-site text-lg font-semibold">Newest previews</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
            {found.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <Link href={`/admin/prospects?q=${p.handle}`} className="min-w-0 truncate font-semibold hover:underline">@{p.handle}</Link>
                <span className="shrink-0 text-ink-2 tabular">{p.followers?.toLocaleString() ?? "?"} · {p.reels.length} reels · {p.email ? "email" : "DM"}{p.from ? ` · via @${p.from}` : ""}</span>
              </li>
            ))}
            {!found.length ? <li className="px-4 py-3 text-sm text-ink-3">None yet.</li> : null}
          </ul>
        </div>
        <div>
          <h2 className="font-site text-lg font-semibold">Recent lookups</h2>
          <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-white">
            {recent.map((c) => (
              <li key={c.handle} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="min-w-0 truncate">@{c.handle} <span className="text-ink-3">· {c.source}{c.depth ? `, hop ${c.depth}` : ""}</span></span>
                <span className={`shrink-0 ${c.status === "qualified" ? "text-forest" : "text-ink-3"}`}>{c.status === "qualified" ? (c.reason ?? "built") : c.reason ?? c.status}</span>
              </li>
            ))}
            {!recent.length ? <li className="px-4 py-3 text-sm text-ink-3">Nothing looked up yet.</li> : null}
          </ul>
        </div>
      </section>
    </main>
  );
}
