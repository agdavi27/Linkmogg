export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-site text-xl font-extrabold tracking-[-0.03em] [font-stretch:85%] ${className}`}>
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
        <rect x="1" y="1" width="24" height="24" rx="8" fill="#111111" />
        <circle cx="9.5" cy="13" r="3.6" fill="none" stroke="#ffffff" strokeWidth="2.2" />
        <circle cx="16.5" cy="13" r="3.6" fill="none" stroke="#ff5a1f" strokeWidth="2.2" />
      </svg>
      Linkmogg
    </span>
  );
}
