import { notFound } from "next/navigation";
import { ThemeRenderer } from "@/themes/render";
import { DEMO } from "@/themes/demo";

// Dev-only full-page theme preview used for visual checks.
export default async function Preview({ params }: PageProps<"/preview-theme/[id]">) {
  if (process.env.NODE_ENV === "production") notFound();
  const { id } = await params;
  return <main className="flex min-h-dvh flex-col"><ThemeRenderer themeId={id} data={DEMO} mode="live" /></main>;
}
