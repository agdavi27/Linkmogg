"use client";

import { useActionState, useEffect, useState } from "react";
import { claimUsername, isUsernameFree, type ClaimState } from "./actions";

export function ClaimForm({ host, initial }: { host: string; initial: string }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimUsername, {});
  const [name, setName] = useState(initial);
  const [check, setCheck] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (name.length < 3) return;
    const t = setTimeout(() => isUsernameFree(name).then(setCheck), 300);
    return () => clearTimeout(t);
  }, [name]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="username" className="label">Your link</label>
        <div className="flex items-center rounded-xl border-[1.5px] border-line bg-white pl-3 focus-within:border-ink focus-within:shadow-[0_0_0_3px_rgb(17_17_17/.08)]">
          <span className="shrink-0 text-ink-3">{host}/</span>
          <input id="username" name="username" required autoFocus autoCapitalize="none" autoComplete="off" spellCheck={false}
            value={name} onChange={(e) => { setName(e.target.value.toLowerCase().replace(/\s/g, "")); setCheck(null); }}
            className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 outline-none" placeholder="yourname" aria-describedby="u-hint" />
        </div>
        <p id="u-hint" aria-live="polite" className={`mt-1.5 min-h-5 text-sm ${check ? (check.ok ? "text-forest" : "text-accent-ink") : "text-ink-3"}`}>
          {check?.message ?? "Letters, numbers, dots and underscores."}
        </p>
      </div>
      <div>
        <label htmlFor="displayName" className="label">Display name</label>
        <input id="displayName" name="displayName" className="field" placeholder="What should your page say at the top?" maxLength={60} />
      </div>
      {state.error ? <p role="alert" className="text-sm text-accent-ink">{state.error}</p> : null}
      <button className="btn btn-primary" disabled={pending || check?.ok === false}>{pending ? "Claiming…" : "Claim my page"}</button>
    </form>
  );
}
