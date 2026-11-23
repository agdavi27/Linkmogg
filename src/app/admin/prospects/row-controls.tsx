"use client";

import { useRef, useState, useTransition } from "react";
import { saveNotes, setStatusAction } from "../actions";

export function NotesBox({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [, start] = useTransition();
  return (
    <div className="relative">
      <textarea aria-label="Notes" value={value} rows={2} onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value === initial) return;
          setState("saving");
          start(async () => { await saveNotes(id, value); setState("saved"); setTimeout(() => setState("idle"), 1200); });
        }}
        placeholder="Add a note"
        className="w-full min-w-40 resize-y rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm hover:border-line focus:border-ink focus:bg-white focus:outline-none" />
      {state !== "idle" ? <span className="absolute bottom-1 right-2 text-[10px] text-ink-3">{state === "saving" ? "Saving" : "Saved"}</span> : null}
    </div>
  );
}

const STATUSES = ["discovered", "preview_built", "contacted", "opened", "clicked", "claimed", "trial", "paid", "unsubscribed"];

export function StatusSelect({ id, status }: { id: string; status: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={setStatusAction}>
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`st-${id}`}>Status</label>
      <select id={`st-${id}`} name="status" defaultValue={status} onChange={() => formRef.current?.requestSubmit()}
        className="rounded-full border border-line bg-white px-2 py-1 text-xs font-medium">
        {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
      </select>
    </form>
  );
}
