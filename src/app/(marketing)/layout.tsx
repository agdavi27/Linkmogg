import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-6 px-5 py-4 sm:px-8">
        <Link href="/" aria-label="Linkmogg home" className="rounded-lg"><Logo /></Link>
        <nav aria-label="Main" className="flex flex-1 items-center justify-end gap-1 text-[15px] font-semibold text-ink-2 sm:gap-2">
          <Link href="/themes" className="rounded-full px-2 py-2 hover:bg-black/5 hover:text-ink sm:px-3">Themes</Link>
          <Link href="/convert" className="rounded-full px-2 py-2 hover:bg-black/5 hover:text-ink sm:px-3">Convert</Link>
          <Link href="/#pricing" className="hidden rounded-full px-3 py-2 hover:bg-black/5 hover:text-ink sm:inline">Pricing</Link>
          <Link href="/login" className="btn btn-primary btn-sm ml-1 whitespace-nowrap">Sign in</Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="mt-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-5 pb-10 pt-6 sm:px-8">
          <div>
            <Logo className="text-2xl" />
            <p className="mt-2 text-sm text-ink-3">One link for everything. Made to be played with.</p>
          </div>
          <nav aria-label="Footer" className="flex gap-5 text-sm font-semibold text-ink-2">
            <Link href="/themes" className="hover:text-ink">Themes</Link>
            <Link href="/convert" className="hover:text-ink">Convert</Link>
            <Link href="/#pricing" className="hover:text-ink">Pricing</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
