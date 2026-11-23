import Link from "next/link";
import { and, asc, eq, isNull, notInArray } from "drizzle-orm";
import { db, outreachMessages, prospects } from "@/lib/db";
import { dmText, getSettings, profileUrl, sentToday, claimUrl } from "@/lib/outreach/core";
import { getTheme } from "@/themes/registry";
import { markDmSentAction, skipDmAction } from "../actions";
import { Flash } from "../flash";
import { CopyAndOpen } from "./copy-open";

export const dynamic = "force-dynamic";

export default async function DmQueue({ searchParams }: PageProps<"/admin/dm-queue">) {
  const sp = await searchParams;
  const includeEmail = sp.all === "1";
  const [settings, today] = await Promise.all([getSettings(), sentToday("dm")]);
  const handled = db.select({ id: outreachMessages.prospectId }).from(outreachMessages).where(eq(outreachMessages.channel, "dm"));
  const rows = await db.select().from(prospects)
    .where(and(eq(prospects.status, "preview_built"), notInArray(prospects.id, handled), includeEmail ? undefined : isNull(prospects.email)))
    .orderBy(asc(prospects.createdAt)).limit(40);
  const capHit = today >= settings.dailyDmCap;

  return (
    <main>
      <Flash msg={sp.msg} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.03em]">DM queue</h1>
          <p className="mt-2 max-w-[64ch] text-ink-2">DMs are never sent automatically. Copy the message, the profile opens in a new tab, you send it yourself, then mark it sent here.</p>
        </div>
        <div className="text-right">
          <p className={`text-sm tabular ${capHit ? "font-semibold text-accent-ink" : "text-ink-2"}`}>{today}/{settings.dailyDmCap} sent today</p>
          <Link href={includeEmail ? "/admin/dm-queue" : "/admin/dm-queue?all=1"} className="text-sm text-ink-2 underline-offset-4 hover:underline">
            {includeEmail ? "Only people without an email" : "Include people with an email"}
          </Link>
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {rows.map((p) => {
          const text = dmText(p, settings);
          return (
            <li key={p.id} className="card flex flex-col gap-3 p-4 md:flex-row md:items-start">
              <div className="w-56 shrink-0">
                <p className="font-medium">{p.displayName ?? p.handle}</p>
                <p className="text-sm text-ink-2">@{p.handle} · {p.platform}</p>
                <a href={claimUrl(p)} target="_blank" rel="noopener" className="text-xs text-ink-3 hover:underline">{getTheme(p.themeId).name} preview</a>
              </div>
              <p className="min-w-0 flex-1 whitespace-pre-wrap rounded-xl bg-paper-2 p-3 text-sm">{text}</p>
              <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-stretch">
                <CopyAndOpen text={text} url={profileUrl(p.platform, p.handle)} />
                <form action={markDmSentAction}><input type="hidden" name="id" value={p.id} /><button className="btn btn-ghost btn-sm w-full" disabled={capHit}>Mark sent</button></form>
                <form action={skipDmAction}><input type="hidden" name="id" value={p.id} /><button className="btn btn-sm w-full text-ink-2 hover:bg-black/5">Skip</button></form>
              </div>
            </li>
          );
        })}
        {rows.length === 0 ? <li className="card p-10 text-center text-ink-2">Nothing waiting. Previews without a public email land here.</li> : null}
      </ul>
    </main>
  );
}
