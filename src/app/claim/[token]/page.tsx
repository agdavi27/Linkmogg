import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { db, outreachMessages } from "@/lib/db";
import { prospectByToken, prospectPageData } from "@/lib/outreach/prospect-page";
import { advance, logEvent } from "@/lib/outreach/core";
import { ThemeRenderer } from "@/themes/render";
import { getTheme } from "@/themes/registry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your preview", robots: { index: false, follow: false, nocache: true } };

export default async function ClaimPreview({ params, searchParams }: PageProps<"/claim/[token]">) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const p = await prospectByToken(token);
  if (!p) notFound();

  // Funnel tracking: a visit from an email link counts as a click.
  const m = typeof sp.m === "string" ? sp.m : null;
  if (m && /^[0-9a-f-]{36}$/i.test(m)) {
    await db.update(outreachMessages).set({ clickedAt: new Date(), status: "clicked" })
      .where(and(eq(outreachMessages.id, m), eq(outreachMessages.prospectId, p.id), isNull(outreachMessages.clickedAt)));
  }
  if (p.status !== "claimed" && p.status !== "trial" && p.status !== "paid") {
    await advance(p, "clicked");
    await logEvent(p.id, "preview_viewed");
  }

  const theme = getTheme(p.themeId);
  const claimed = ["claimed", "trial", "paid"].includes(p.status);
  return (
    <div className="flex min-h-dvh flex-col">
      <div role="banner" className="sticky top-0 z-50 border-b border-black/10 bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <p className="min-w-0 flex-1 text-sm leading-snug">
            {claimed
              ? <>This page has been claimed by <strong>@{p.handle}</strong>.</>
              : <>This is a preview made for <strong>@{p.handle}</strong>. Claim it or ask us to remove it.</>}
          </p>
          {!claimed ? (
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/claim/${token}/remove`} className="btn btn-ghost btn-sm">Remove it</Link>
              <Link href={`/login?next=${encodeURIComponent(`/claim/${token}/accept`)}`} className="btn btn-accent btn-sm">Claim it free</Link>
            </div>
          ) : null}
        </div>
        {!claimed ? <p className="mx-auto max-w-3xl px-4 pb-3 text-xs text-ink-2">Theme: {theme.name}. Free for 14 days, then $10/month if you want to keep editing or switching themes. Nothing goes live until you claim it.</p> : null}
      </div>
      <main className="flex flex-1 flex-col">
        <ThemeRenderer themeId={theme.id} data={prospectPageData(p)} mode="preview" />
      </main>
    </div>
  );
}
