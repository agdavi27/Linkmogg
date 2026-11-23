import type { Metadata } from "next";
import { Logo } from "@/components/logo";
import { unsubscribe, validUnsub } from "@/lib/outreach/unsubscribe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false } };

export default async function Unsubscribe({ searchParams }: PageProps<"/unsubscribe">) {
  const sp = await searchParams;
  const e = typeof sp.e === "string" ? sp.e : "";
  const t = typeof sp.t === "string" ? sp.t : "";
  const valid = Boolean(e) && validUnsub(e, t);
  // Unsubscribing on GET keeps it one click from the email, as CAN-SPAM expects.
  if (valid) await unsubscribe(e);
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="max-w-md">
        <Logo />
        {valid ? (
          <>
            <h1 className="mt-8 font-display text-3xl font-semibold tracking-[-0.03em]">You&apos;re unsubscribed</h1>
            <p className="mt-3 text-ink-2">{e} won&apos;t get any more emails from us.</p>
          </>
        ) : (
          <>
            <h1 className="mt-8 font-display text-3xl font-semibold tracking-[-0.03em]">That link didn&apos;t work</h1>
            <p className="mt-3 text-ink-2">Reply to the email you got and we&apos;ll take you off the list by hand.</p>
          </>
        )}
      </div>
    </main>
  );
}
