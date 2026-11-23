import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <Logo />
        <h1 className="mt-8 font-display text-4xl font-semibold tracking-[-0.03em]">Nobody lives here yet</h1>
        <p className="mt-3 text-ink-2">This name is still free. It could be yours.</p>
        <Link href="/login" className="btn btn-accent mt-6">Claim a page</Link>
      </div>
    </main>
  );
}
