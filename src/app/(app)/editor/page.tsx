import { redirect } from "next/navigation";
import { isAdmin, requireUser } from "@/lib/auth";
import { getPageForUser, loadPageBundle } from "@/lib/pages";
import { daysLeft, getPlan } from "@/lib/entitlements";
import { appUrl, badgeUrl } from "@/lib/config";
import { Editor } from "./editor";

export const metadata = { title: "Editor" };

export default async function EditorPage({ searchParams }: PageProps<"/editor">) {
  const user = await requireUser("/editor");
  const page = await getPageForUser(user.id);
  if (!page) redirect("/onboarding");
  const [{ links, socials }, plan, sp] = await Promise.all([loadPageBundle(page), getPlan(user), searchParams]);
  const trialDaysLeft = daysLeft(plan.trialEndsAt);
  return (
    <Editor
      page={{ username: page.username, displayName: page.displayName, bio: page.bio, avatarUrl: page.avatarUrl, themeId: page.themeId }}
      links={links.map(({ id, title, url, enabled }) => ({ id, title, url, enabled }))}
      socials={socials.map(({ id, platform, url }) => ({ id, platform, url }))}
      plan={{ isPro: plan.isPro, reason: plan.reason, trialDaysLeft }}
      pageUrl={`${appUrl()}/${page.username}`}
      badgeUrl={badgeUrl()}
      isAdmin={isAdmin(user)}
      welcome={sp.welcome === "1"}
    />
  );
}
