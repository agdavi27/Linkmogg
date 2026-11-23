"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyAndOpen({ text, url }: { text: string; url: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-primary btn-sm"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked: the text is still visible to copy by hand */ }
        window.open(url, "_blank", "noopener");
        setDone(true);
      }}>
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? "Copied, profile opened" : "Copy + open profile"}
    </button>
  );
}
