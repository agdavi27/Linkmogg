@AGENTS.md

# Linkmogg

See README.md for the map of the codebase.

## Design skills

Every UI change should go through these three skills. Install them in your Claude Code environment before building UI:

- Emil Kowalski's skills: `npx skills@latest add emilkowalski/skills` (https://github.com/emilkowalski/skills)
- Impeccable: `/plugin marketplace add pbakaus/impeccable`
- Taste: `npx skills add Leonxlnx/taste-skill`

## Conventions

- Themes live in `src/themes/list/*`. Every theme takes `ThemeProps`, wraps itself in `ThemeRoot` (which adds the screen-reader link list and the badge), works with touch and keyboard, and must respect `prefers-reduced-motion`.
- Brand tokens are in `src/app/globals.css` (`--paper`, `--ink`, `--accent`, `--forest`). No eyebrow labels above headings, no gradient text.
- Server actions validate input and scope every query to the signed-in user's page.
- Never add anything to outreach that bypasses platform terms, rate limits, logins or CAPTCHAs.
