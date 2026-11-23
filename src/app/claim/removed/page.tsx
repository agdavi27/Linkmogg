import { Logo } from "@/components/logo";

export const metadata = { title: "Removed", robots: { index: false } };

export default function Removed() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 font-display text-3xl font-semibold tracking-[-0.03em]">Done. It&apos;s gone.</h1>
        <p className="mt-3 text-ink-2">We deleted the preview and your details, and you won&apos;t hear from us again.</p>
      </div>
    </main>
  );
}
