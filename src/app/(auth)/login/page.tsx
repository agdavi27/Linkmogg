import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { PlateShell } from "@/components/plate-shell";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  if (await currentUser()) redirect(next ?? "/editor");
  return (
    <PlateShell title="Your page is one email away." note="We'll send you a link. No password to remember, and new accounts get every theme free for 14 days.">
      <h2 className="type-title mb-5 text-3xl">Sign in or sign up</h2>
      {error ? <p role="alert" className="mb-4 rounded-xl border-[1.5px] border-accent-ink/30 bg-accent/10 p-3 text-sm text-accent-ink">That link has expired or was already used. Request a new one below.</p> : null}
      <LoginForm next={next} />
    </PlateShell>
  );
}
