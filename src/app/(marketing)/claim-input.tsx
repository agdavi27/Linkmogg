"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ClaimInput({ host, size = "lg" }: { host: string; size?: "lg" | "md" }) {
  const [name, setName] = useState("");
  const router = useRouter();
  return (
    <form className={`flex w-full max-w-md items-center rounded-full border border-line bg-white p-1.5 shadow-[0_10px_30px_-18px_rgba(40,30,10,.45)] focus-within:border-ink ${size === "lg" ? "text-base" : "text-sm"}`}
      onSubmit={(e) => {
        e.preventDefault();
        const next = `/onboarding?u=${encodeURIComponent(name)}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
      }}>
      <label htmlFor={`claim-${size}`} className="shrink-0 pl-3 text-ink-3">{host}/</label>
      <input id={`claim-${size}`} value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
        placeholder="yourname" autoCapitalize="none" spellCheck={false}
        className="min-w-0 flex-1 bg-transparent py-2 outline-none" />
      <button className="btn btn-accent shrink-0">Claim it</button>
    </form>
  );
}
