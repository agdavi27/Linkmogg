import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, prospects } from "@/lib/db";
import { prospectByToken } from "@/lib/outreach/prospect-page";
import { emailHash, handleHash, suppress } from "@/lib/outreach/suppress";
import { Logo } from "@/components/logo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Remove preview", robots: { index: false, follow: false } };

async function remove(form: FormData) {
  "use server";
  const token = String(form.get("token") ?? "");
  const p = await prospectByToken(token);
  if (p && !["claimed", "trial", "paid"].includes(p.status)) {
    await suppress([
      { kind: "handle", hash: handleHash(p.platform, p.handle) },
      ...(p.email ? [{ kind: "email" as const, hash: emailHash(p.email) }] : []),
    ], "removed");
    await db.delete(prospects).where(eq(prospects.id, p.id)); // events and messages cascade
  }
  redirect("/claim/removed");
}

export default async function RemovePage({ params }: PageProps<"/claim/[token]/remove">) {
  const { token } = await params;
  const p = await prospectByToken(token);
  if (!p) redirect("/claim/removed");
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-md text-center">
        <Logo />
        <h1 className="mt-8 font-site text-3xl font-semibold tracking-[-0.03em]">Remove the preview for @{p.handle}?</h1>
        <p className="mt-3 text-ink-2">We&apos;ll delete the preview and everything we saved about you, and we won&apos;t contact you again.</p>
        <form action={remove} className="mt-6">
          <input type="hidden" name="token" value={token} />
          <button className="btn btn-primary">Yes, remove it</button>
        </form>
      </div>
    </main>
  );
}
