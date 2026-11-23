"use client";

import { useActionState } from "react";
import { requestLogin, type LoginState } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(requestLogin, {});
  if (state.ok) {
    return (
      <div className="lm-pop text-center">
        <p className="font-site text-xl font-semibold">Check your inbox</p>
        <p className="mt-2 text-ink-2">We sent a sign-in link to <strong className="text-ink">{state.email}</strong>. It expires in 20 minutes.</p>
        {state.devLink ? (
          <p className="mt-5 rounded-xl bg-paper-2 p-3 text-left text-sm">
            Email isn&apos;t configured yet, so here&apos;s your link: <a className="break-all font-medium text-accent-ink underline" href={state.devLink}>Sign in</a>
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="next" value={next ?? ""} />
      <label htmlFor="email" className="label">Email</label>
      <input id="email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" className="field" />
      {state.error ? <p role="alert" className="text-sm text-accent-ink">{state.error}</p> : null}
      <button className="btn btn-primary mt-1" disabled={pending}>{pending ? "Sending…" : "Email me a sign-in link"}</button>
      <p className="text-center text-xs text-ink-3">New here? The same link creates your account and starts a 14-day free trial.</p>
    </form>
  );
}
