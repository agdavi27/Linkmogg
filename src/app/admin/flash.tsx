export function Flash({ msg }: { msg?: string | string[] }) {
  if (typeof msg !== "string" || !msg) return null;
  return <p role="status" className="lm-pop mb-6 rounded-xl bg-ink px-4 py-3 text-sm text-paper">{msg}</p>;
}
