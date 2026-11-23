import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPageForUser } from "@/lib/pages";
import { hostLabel } from "@/lib/config";
import { Logo } from "@/components/logo";
import { ClaimForm } from "./form";

export const metadata = { title: "Claim your page" };

export default async function Onboarding({ searchParams }: PageProps<"/onboarding">) {
  const user = await requireUser("/onboarding");
  if (await getPageForUser(user.id)) redirect("/editor");
  const sp = await searchParams;
  const initial = typeof sp.u === "string" ? sp.u.toLowerCase() : "";
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-3xl font-semibold tracking-[-0.03em]">Pick your name</h1>
          <p className="mb-6 mt-2 text-ink-2">This is the link you&apos;ll put in your bio. You can&apos;t change it later, so pick one you like.</p>
          <ClaimForm host={hostLabel()} initial={initial} />
        </div>
      </div>
    </main>
  );
}
