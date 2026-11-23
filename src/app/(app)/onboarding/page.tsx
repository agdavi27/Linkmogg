import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getPageForUser } from "@/lib/pages";
import { hostLabel } from "@/lib/config";
import { PlateShell } from "@/components/plate-shell";
import { ClaimForm } from "./form";

export const metadata = { title: "Claim your page" };

export default async function Onboarding({ searchParams }: PageProps<"/onboarding">) {
  const user = await requireUser("/onboarding");
  if (await getPageForUser(user.id)) redirect("/editor");
  const sp = await searchParams;
  const initial = typeof sp.u === "string" ? sp.u.toLowerCase() : "";
  return (
    <PlateShell plate="var(--forest)" title="Pick the name on your link." note="This is what goes in your bio. You can't change it later, so pick one you like.">
      <h2 className="type-title mb-5 text-3xl">Claim your page</h2>
      <ClaimForm host={hostLabel()} initial={initial} />
    </PlateShell>
  );
}
