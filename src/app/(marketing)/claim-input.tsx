"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";

/** Claim a username: the site's one primary action, a white pill that reads on any color plate. */
export function ClaimInput({ host, size = "lg" }: { host: string; size?: "lg" | "md" }) {
  const [name, setName] = useState("");
  const router = useRouter();
  return (
    <form className={`flex w-full max-w-md items-center rounded-full bg-white p-1.5 text-ink shadow-[0_2px_4px_rgb(0_0_0/.08),0_18px_40px_-20px_rgb(0_0_0/.5)] ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-ink ${size === "lg" ? "text-base" : "text-sm"}`}
      onSubmit={(e) => {
        e.preventDefault();
        const next = `/onboarding?u=${encodeURIComponent(name)}`;
        router.push(`/login?next=${encodeURIComponent(next)}`);
      }}>
      <label htmlFor={`claim-${size}`} className="shrink-0 pl-3.5 text-ink-3">{host}/</label>
      <input id={`claim-${size}`} value={name} onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
        placeholder="yourname" autoCapitalize="none" spellCheck={false}
        className="min-w-0 flex-1 bg-transparent py-2 font-semibold outline-none placeholder:font-normal" />
      <button className="btn btn-primary shrink-0">Claim it <ArrowRight size={16} aria-hidden /></button>
    </form>
  );
}
