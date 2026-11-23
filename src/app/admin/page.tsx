import Link from "next/link";
import { getMetrics } from "@/lib/outreach/metrics";
import { getSettings, sentToday } from "@/lib/outreach/core";
import { sendBatchAction } from "./actions";
import { Flash } from "./flash";

export const dynamic = "force-dynamic";

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 font-site text-3xl font-semibold tabular tracking-[-0.02em]">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-ink-3">{sub}</p> : null}
    </div>
  );
}

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const [m, settings, emailsToday, dmsToday, sp] = await Promise.all([getMetrics(), getSettings(), sentToday("email"), sentToday("dm"), searchParams]);
  const max = Math.max(1, ...m.funnel.map((f) => f.reached));
  return (
    <main>
      <Flash msg={sp.msg} />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-site text-3xl font-semibold tracking-[-0.03em]">Outreach</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-2 tabular">{emailsToday}/{settings.dailyEmailCap} emails · {dmsToday}/{settings.dailyDmCap} DMs today</span>
          <form action={sendBatchAction}><button className="btn btn-primary btn-sm" disabled={settings.paused}>{settings.paused ? "Paused" : "Send next batch"}</button></form>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Stat label="Emails sent" value={String(m.emailsSent)} sub={`${m.dmsSent} DMs sent`} />
        <Stat label="Open rate" value={`${m.openRate}%`} />
        <Stat label="Click rate" value={`${m.clickRate}%`} />
        <Stat label="Claim rate" value={`${m.claimRate}%`} sub={`${m.claimed} of ${m.contacted} contacted`} />
        <Stat label="Trial to paid" value={`${m.trialToPaid}%`} sub={`${m.paid} of ${m.finishedTrials} finished trials`} />
        <Stat label="MRR" value={`$${m.mrr.toLocaleString()}`} sub={`${m.paid} paying`} />
      </div>

      <section className="card mt-6 p-5" aria-labelledby="pipe-h">
        <h2 id="pipe-h" className="font-site text-lg font-semibold">Pipeline</h2>
        <p className="mt-1 text-sm text-ink-2">How many prospects reached each stage. The second number is how many are sitting there now.</p>
        <ol className="mt-5 flex flex-col gap-2.5">
          {m.funnel.map((f) => (
            <li key={f.key} className="grid grid-cols-[110px_minmax(0,1fr)_auto] items-center gap-3 text-sm">
              <Link href={`/admin/prospects?status=${f.key}`} className="font-medium hover:underline">{f.label}</Link>
              <span className="h-6 overflow-hidden rounded-md bg-paper-2">
                <span className="block h-full rounded-md bg-ink" style={{ width: `${(f.reached / max) * 100}%` }} />
              </span>
              <span className="w-20 text-right tabular text-ink-2"><strong className="text-ink">{f.reached}</strong> · {f.now}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-ink-2 tabular">Unsubscribed: <Link className="font-medium text-ink hover:underline" href="/admin/prospects?status=unsubscribed">{m.unsubscribed}</Link> · Removed (data deleted): {m.removed}</p>
      </section>
    </main>
  );
}
