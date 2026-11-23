const WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty"];

/** 11 → "eleven". Falls back to digits past twenty. */
export function countWord(n: number, capital = false) {
  const w = WORDS[n] ?? String(n);
  return capital ? w[0].toUpperCase() + w.slice(1) : w;
}
