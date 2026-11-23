import { getSettings } from "@/lib/outreach/core";
import { emailConfigured } from "@/lib/email";
import { THEMES } from "@/themes/registry";
import { saveSettingsAction } from "../actions";
import { Flash } from "../flash";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: PageProps<"/admin/settings">) {
  const [s, sp] = await Promise.all([getSettings(), searchParams]);
  const from = process.env.OUTREACH_FROM ?? process.env.EMAIL_FROM;
  return (
    <main className="max-w-3xl">
      <Flash msg={sp.msg} />
      <h1 className="font-site text-3xl font-semibold tracking-[-0.03em]">Outreach settings</h1>
      {!emailConfigured() ? <p className="mt-4 rounded-xl bg-accent/10 p-3 text-sm text-accent-ink">RESEND_API_KEY isn&apos;t set, so emails are only logged, not sent.</p> : null}
      <form action={saveSettingsAction} className="mt-6 flex flex-col gap-6">
        <section className="card grid grid-cols-2 gap-4 p-5 md:grid-cols-4">
          <h2 className="col-span-full font-site text-lg font-semibold">Caps and pacing</h2>
          <div><label className="label" htmlFor="dailyEmailCap">Emails per day</label><input id="dailyEmailCap" name="dailyEmailCap" type="number" min={0} defaultValue={s.dailyEmailCap} className="field tabular" /></div>
          <div><label className="label" htmlFor="perRunEmailCap">Emails per run</label><input id="perRunEmailCap" name="perRunEmailCap" type="number" min={1} defaultValue={s.perRunEmailCap} className="field tabular" /></div>
          <div><label className="label" htmlFor="dailyDmCap">DMs per day</label><input id="dailyDmCap" name="dailyDmCap" type="number" min={0} defaultValue={s.dailyDmCap} className="field tabular" /></div>
          <div><label className="label" htmlFor="fetchDelayMs">Delay between page reads (ms)</label><input id="fetchDelayMs" name="fetchDelayMs" type="number" min={500} defaultValue={s.fetchDelayMs} className="field tabular" /></div>
          <label className="col-span-full flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="paused" defaultChecked={s.paused} className="size-4 accent-[var(--accent)]" /> Pause all outreach email
          </label>
        </section>

        <section className="card flex flex-col gap-4 p-5">
          <h2 className="font-site text-lg font-semibold">Sender (CAN-SPAM)</h2>
          <p className="-mt-2 text-sm text-ink-2">Every outreach email includes this name and mailing address, plus a working unsubscribe link. Sending is blocked until the address is filled in. Mail goes out from <code className="rounded bg-paper-2 px-1">{from ?? "OUTREACH_FROM (not set)"}</code>.</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div><label className="label" htmlFor="senderName">Sender name</label><input id="senderName" name="senderName" defaultValue={s.senderName} className="field" /></div>
            <div><label className="label" htmlFor="physicalAddress">Physical mailing address</label><input id="physicalAddress" name="physicalAddress" defaultValue={s.physicalAddress} className="field" placeholder="Street, city, state, ZIP" /></div>
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-5">
          <h2 className="font-site text-lg font-semibold">Messages</h2>
          <p className="-mt-2 text-sm text-ink-2">Placeholders: <code>{"{name}"}</code> <code>{"{handle}"}</code> <code>{"{preview_link}"}</code> <code>{"{remove_link}"}</code>. Keep the subject honest about what the email is.</p>
          <div><label className="label" htmlFor="emailSubject">Email subject</label><input id="emailSubject" name="emailSubject" defaultValue={s.emailSubject} className="field" /></div>
          <div><label className="label" htmlFor="emailTemplate">Email body</label><textarea id="emailTemplate" name="emailTemplate" rows={7} defaultValue={s.emailTemplate} className="field text-sm" /></div>
          <div><label className="label" htmlFor="dmTemplate">DM text</label><textarea id="dmTemplate" name="dmTemplate" rows={3} defaultValue={s.dmTemplate} className="field text-sm" /></div>
          <div>
            <label className="label" htmlFor="defaultPreviewTheme">Theme for new previews</label>
            <select id="defaultPreviewTheme" name="defaultPreviewTheme" defaultValue={s.defaultPreviewTheme} className="field">
              <option value="random">Random Pro theme</option>
              {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </section>
        <button className="btn btn-primary self-start">Save settings</button>
      </form>
    </main>
  );
}
