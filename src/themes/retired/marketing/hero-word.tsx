"use client";

import { useEffect, useState } from "react";

const WORDS = ["play with.", "spin.", "unlock.", "tune in to.", "flip through."];
const LONGEST = "flip through.";

/** The last words of the headline cycle through what visitors do on each theme. */
export function HeroWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-grid align-top text-accent">
      {/* the longest word, invisible, reserves the space so nothing below jumps */}
      <span aria-hidden className="invisible col-start-1 row-start-1 whitespace-nowrap">{LONGEST}</span>
      <span key={i} aria-hidden className="lm-word col-start-1 row-start-1 whitespace-nowrap">{WORDS[i]}</span>
      <span className="sr-only">{WORDS[0]}</span>
    </span>
  );
}
