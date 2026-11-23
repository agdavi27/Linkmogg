// Retired from the landing page in round 10. Kept for reference.
import type { CSSProperties } from "react";

export /** Little hand-built objects from the themes, floating around the phone at different depths. */
function Floaters() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className="lm-float" style={{ left: "-6%", top: "12%", ["--d" as string]: 1.4, animationDelay: "-1s" } as CSSProperties}>
        <span className="lm-fl-cassette"><i /><i /></span>
      </span>
      <span className="lm-float" style={{ right: "-4%", top: "6%", ["--d" as string]: 2.2, animationDelay: "-3s" } as CSSProperties}>
        <span className="lm-fl-icon" />
      </span>
      <span className="lm-float" style={{ right: "-10%", top: "52%", ["--d" as string]: 1, animationDelay: "-2s" } as CSSProperties}>
        <span className="lm-fl-flower">{Array.from({ length: 12 }).map((_, i) => <i key={i} style={{ rotate: `${i * 30}deg` }} />)}</span>
      </span>
      <span className="lm-float" style={{ left: "-12%", top: "60%", ["--d" as string]: 1.8, animationDelay: "-4s" } as CSSProperties}>
        <span className="lm-fl-wheel"><i /></span>
      </span>
      <span className="lm-float" style={{ left: "6%", bottom: "2%", ["--d" as string]: 2.6, animationDelay: "-2.5s" } as CSSProperties}>
        <span className="lm-fl-polaroid" />
      </span>
    </div>
  );
}
