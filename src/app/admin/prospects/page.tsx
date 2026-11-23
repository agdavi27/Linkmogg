import Link from "next/link";
import { and, desc, eq, ilike, isNotNull, isNull, or, count, type SQL } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db, prospects } from "@/lib/db";
import { claimUrl, profileUrl } from "@/lib/outreach/core";
import { THEMES, getTheme } from "@/themes/registry";
import { buildPendingAction, regenerateAction, removeAction, resendAction } from "../actions";
import { Flash } from "../flash";
import { NotesBox, StatusSelect } from "./row-controls";

export const dynamic = "force-dynamic";
const PAGE = 50;
const STATUS_LIST = ["discovered", "preview_built", "contacted", "opened", "clicked", "claimed", "trial", "paid", "unsubscribed"] as const;

export default async function Prospects({ searchParams }: PageProps<"/admin/prospects">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && (STATUS_LIST as readonly string[]).includes(sp.status) ? (sp.status as (typeof STATUS_LIST)[number]) : null;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const hasEmail = sp.email === "yes" ? true : sp.email === "no" ? false : null;
  const platform = typeof sp.platform === "string" && sp.platform ? sp.platform : null;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: SQL[] = [];
  if (status) where.push(eq(prospects.status, status));
  if (platform) where.push(eq(prospects.platform, platform));
  if (hasEmail === true) where.push(isNotNull(prospects.email));
  if (hasEmail === false) where.push(isNull(prospects.email));
  if (q) where.push(or(ilike(prospects.handle, `%${q}%`), ilike(prospects.displayName, `%${q}%`), ilike(prospects.email, `%${q}%`), ilike(prospects.notes, `%${q}%`))!);
  const cond = where.length ? and(...where) : undefined;

  const [rows, [{ n: total }], [{ n: waiting }]] = await Promise.all([
    db.select().from(prospects).where(cond).orderBy(desc(prospects.updatedAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ n: count() }).from(prospects).where(cond),
    db.select({ n: count() }).from(prospects).where(and(eq(prospects.status, "discovered"), isNull(prospects.lastError))),
  ]);
  const back = `/admin/prospects?${new URLSearchParams(Object.entries(sp).filter(([k, v]) => typeof v === "string" && k !== "msg") as [string, string][]).toString()}`;

  return (
    <main>
      <Flash msg={sp.msg} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-site text-3xl font-semibold tracking-[-0.03em]">Prospects <span className="text-ink-3 tabular">{total}</span></h1>
        <div className="flex gap-2">
          {waiting ? <form action={buildPendingAction}><button className="btn btn-ghost btn-sm">Build {Math.min(10, waiting)} waiting {waiting === 1 ? "preview" : "previews"}</button></form> : null}
          <Link href="/admin/prospects/import" className="btn btn-primary btn-sm">Import or add</Link>
        </div>
      </div>

      <form className="mt-5 flex flex-wrap items-end gap-2" role="search">
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Handle, name, email, notes" className="field w-60 py-1.5 text-sm" />
        </div>
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={status ?? ""} className="field w-40 py-1.5 text-sm">
            <option value="">Any</option>
            {STATUS_LIST.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="platform">Platform</label>
          <select id="platform" name="platform" defaultValue={platform ?? ""} className="field w-36 py-1.5 text-sm">
            <option value="">Any</option>
            {["instagram", "tiktok", "x", "youtube", "threads", "twitch", "snapchat", "pinterest", "bluesky", "other"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <select id="email" name="email" defaultValue={sp.email === "yes" || sp.email === "no" ? sp.email : ""} className="field w-32 py-1.5 text-sm">
            <option value="">Any</option><option value="yes">Has email</option><option value="no">No email</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm mb-0.5">Filter</button>
        {where.length ? <Link href="/admin/prospects" className="mb-1.5 text-sm text-ink-2 hover:text-ink">Clear</Link> : null}
      </form>

      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-b border-line text-xs text-ink-2">
            <tr>
              <th className="px-4 py-3 font-medium">Prospect</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Preview</th>
              <th className="px-3 py-3 font-medium">Notes</th>
              <th className="px-3 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {p.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.avatarUrl} alt="" className="size-8 shrink-0 rounded-full object-cover" />
                      : <span className="grid size-8 shrink-0 place-items-center rounded-full bg-paper-2 text-xs font-semibold">{p.handle[0]?.toUpperCase()}</span>}
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.displayName ?? p.handle}</p>
                      <a href={profileUrl(p.platform, p.handle)} target="_blank" rel="noopener" className="text-xs text-ink-2 hover:underline">@{p.handle} · {p.platform}</a>
                    </div>
                  </div>
                  <p className="mt-1 max-w-64 truncate text-xs text-ink-3">{p.email ?? "No public email"}{p.sourceUrl ? <> · <a href={p.sourceUrl} target="_blank" rel="noopener" className="hover:underline">{p.sourceUrl.replace(/^https?:\/\//, "")}</a></> : null}</p>
                  {p.lastError ? <p className="mt-1 max-w-72 text-xs text-accent-ink">{p.lastError}</p> : null}
                </td>
                <td className="px-3 py-3"><StatusSelect id={p.id} status={p.status} /></td>
                <td className="px-3 py-3">
                  {p.themeId ? (
                    <a href={claimUrl(p)} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-sm font-medium hover:underline">
                      {getTheme(p.themeId).name} <ExternalLink size={12} />
                    </a>
                  ) : <span className="text-xs text-ink-3">Not built</span>}
                  <p className="text-xs text-ink-3 tabular">{p.links.length} links · {p.socials.length} socials</p>
                </td>
                <td className="w-64 px-3 py-2"><NotesBox id={p.id} initial={p.notes} /></td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-ink-2 tabular">{p.updatedAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <form action={resendAction}>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="back" value={back} />
                      <button className="btn btn-ghost btn-sm" disabled={!p.email || !p.themeId} title={p.email ? "Send the outreach email now" : "No public email"}>
                        {p.status === "contacted" || p.status === "opened" ? "Resend" : "Email"}
                      </button>
                    </form>
                    <form action={regenerateAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="back" value={back} />
                      <label className="sr-only" htmlFor={`th-${p.id}`}>Theme</label>
                      <select id={`th-${p.id}`} name="theme" defaultValue="random" className="rounded-full border border-line bg-white px-2 py-1 text-xs">
                        <option value="random">Random</option>
                        {THEMES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <button className="btn btn-ghost btn-sm">Regenerate</button>
                    </form>
                    <form action={removeAction}>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="back" value={back} />
                      <button className="btn btn-sm text-accent-ink hover:bg-accent/10">Remove</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-ink-2">No prospects match. <Link href="/admin/prospects/import" className="font-medium text-ink underline">Import some</Link>.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {total > PAGE ? (
        <div className="mt-4 flex items-center justify-end gap-2 text-sm">
          {page > 1 ? <Link className="btn btn-ghost btn-sm" href={`${back.replace(/&?page=\d+/, "")}&page=${page - 1}`}>Previous</Link> : null}
          <span className="text-ink-2 tabular">Page {page} of {Math.ceil(total / PAGE)}</span>
          {page * PAGE < total ? <Link className="btn btn-ghost btn-sm" href={`${back.replace(/&?page=\d+/, "")}&page=${page + 1}`}>Next</Link> : null}
        </div>
      ) : null}
    </main>
  );
}
