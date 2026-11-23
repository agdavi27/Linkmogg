import { notFound } from "next/navigation";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";

const EXTRA = ["Podcast", "Merch", "Tour dates", "Press kit", "Discord", "Patreon", "Blog", "Portfolio", "Contact", "Spring sale", "Behind the scenes", "Guestbook", "FAQ", "Studio tour"];

// Dev-only full-page theme preview used for visual checks. ?n=12 sets the number of links.
export default async function Preview({ params, searchParams }: PageProps<"/preview-theme/[id]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const n = typeof sp.n === "string" ? Math.max(0, Math.min(20, Number(sp.n) || 0)) : DEMO.links.length;
  const links = Array.from({ length: n }, (_, i) => DEMO.links[i] ?? { id: `x${i}`, title: EXTRA[(i - DEMO.links.length) % EXTRA.length], url: `https://example.com/${i}` });
  return <main className="flex h-dvh flex-col overflow-hidden"><ThemeRenderer themeId={id} data={{ ...DEMO, links }} mode="live" /></main>;
}
