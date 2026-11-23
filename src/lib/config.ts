/** App-wide config read from env. Everything here has a safe default so builds work without env. */
export const APP_NAME = "Linkmogg";

export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/** Where the free-tier badge points. Defaults to this app's landing page. */
export function badgeUrl(): string {
  return process.env.NEXT_PUBLIC_BADGE_URL || `${appUrl()}/?ref=badge`;
}

export const TRIAL_DAYS = 14;
export const PRICE_LABEL = "$10/month";

export function hostLabel(): string {
  return appUrl().replace(/^https?:\/\//, "");
}
