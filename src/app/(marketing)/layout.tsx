import Link from "next/link";
import { Logo } from "@/components/logo";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-6 px-5 py-5">
        <Link href="/" aria-label="Linkmogg home"><Logo /></Link>
        <nav className="flex flex-1 items-center justify-end gap-4 text-sm font-medium text-ink-2 sm:gap-5">
          <Link href="/convert" className="hover:text-ink">Convert</Link>
          <Link href="/themes" className="hover:text-ink">Themes</Link>
          <Link href="/#pricing" className="hidden hover:text-ink sm:inline">Pricing</Link>
          <Link href="/login" className="btn btn-primary btn-sm whitespace-nowrap">Sign in</Link>
        </nav>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-ink-3">
          <Logo className="text-base text-ink-2" />
          <span>One link for everything. Made to be played with.</span>
        </div>
      </footer>
    </div>
  );
}
