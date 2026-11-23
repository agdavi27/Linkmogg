// Usernames that would collide with app routes or look official.
export const RESERVED = new Set([
  "admin", "api", "app", "auth", "billing", "claim", "dashboard", "editor", "help", "login", "logout",
  "onboarding", "pricing", "settings", "signup", "support", "themes", "unsubscribe", "about", "terms",
  "privacy", "static", "assets", "public", "www", "mail", "linkmogg", "favicon.ico", "robots.txt",
  "sitemap.xml", "_next", "go", "r", "u", "me", "new", "root", "account", "legal", "remove", "preview",
  "opengraph-image", "twitter-image", "icon", "convert", "import", "preview-theme",
]);

export const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])?$/;

export function normalizeUsername(input: string) {
  return input.trim().toLowerCase().replace(/^@/, "");
}

export function usernameProblem(u: string): string | null {
  if (u.length < 3) return "Use at least 3 characters.";
  if (u.length > 30) return "Keep it to 30 characters or fewer.";
  if (!USERNAME_RE.test(u)) return "Use letters, numbers, dots and underscores. Start and end with a letter or number.";
  if (RESERVED.has(u)) return "That name is reserved.";
  return null;
}
