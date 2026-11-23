import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getPublicPage } from "@/lib/pages";
import { ThemeRenderer } from "@/themes/render";

export const revalidate = 300;

// Empty list = every page is generated on first visit, then cached and refreshed on edit (ISR).
export async function generateStaticParams() {
  return [];
}

const load = cache((username: string) => getPublicPage(decodeURIComponent(username)));

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
  const { username } = await params;
  const p = await load(username);
  if (!p) return { title: "Not found" };
  const name = p.data.displayName || `@${p.page.username}`;
  const description = p.data.bio || `${name}'s links, all in one place.`;
  return {
    title: { absolute: `${name} | Linkmogg` },
    description,
    alternates: { canonical: `/${p.page.username}` },
    openGraph: { title: name, description, url: `/${p.page.username}`, type: "profile" },
    twitter: { card: "summary_large_image", title: name, description },
  };
}

export default async function PublicPage({ params }: PageProps<"/[username]">) {
  const { username } = await params;
  const p = await load(username);
  if (!p) notFound();
  return (
    <main className="flex h-dvh flex-col overflow-hidden">
      <ThemeRenderer themeId={p.themeId} data={p.data} mode="live" />
    </main>
  );
}
