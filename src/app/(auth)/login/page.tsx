import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  if (await currentUser()) redirect(next ?? "/editor");
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mx-auto mb-8 flex w-fit"><Logo /></Link>
        <div className="card p-6">
          <h1 className="mb-5 text-center font-display text-2xl font-semibold tracking-[-0.02em]">Sign in or sign up</h1>
          {error ? <p role="alert" className="mb-4 rounded-lg bg-accent/10 p-3 text-sm text-accent-ink">That link has expired or was already used. Request a new one below.</p> : null}
          <LoginForm next={next} />
        </div>
      </div>
    </main>
  );
}
