import { Gallery } from "./gallery";

export const metadata = { title: "Themes", description: "Try every Linkmogg theme live: click wheels, sunflowers, bookshelves, orbiting satellites and more." };

export default async function ThemesPage({ searchParams }: PageProps<"/themes">) {
  const sp = await searchParams;
  return <Gallery initial={typeof sp.t === "string" ? sp.t : "pocket"} />;
}
