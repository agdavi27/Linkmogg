# Linkmogg

A link-in-bio platform with interactive themes and a creator outreach pipeline.
Next.js 16 (App Router) · TypeScript · Tailwind v4 · Postgres (Supabase or Neon) + Drizzle · Stripe · Resend.

## What's here

| Area | Where |
|---|---|
| Landing page, `/themes` gallery | `src/app/(marketing)` |
| Magic-link sign-in | `src/app/(auth)/login`, `src/app/auth/*` |
| Claim a username, editor with live preview | `src/app/(app)/onboarding`, `src/app/(app)/editor` |
| Public page + OG image | `src/app/[username]` |
| Themes (11: Classic + 10 interactive) | `src/themes/list/*`, registry in `src/themes/registry.ts` |
| Billing (Checkout, portal, webhook) | `src/app/(app)/settings/billing`, `src/app/api/stripe/webhook` |
| Outreach: import, previews, email, DM queue, admin | `src/lib/outreach/*`, `src/app/admin/*`, `src/app/claim/*` |
| Schema + migrations | `src/lib/db/schema.ts`, `drizzle/` |

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, AUTH_SECRET, ADMIN_EMAIL at minimum
npm run db:migrate
npm run dev
```

Without `RESEND_API_KEY`, emails are printed to the terminal and the sign-in page shows the link on screen (dev only).

```bash
npm test          # unit tests (platform detection, page parser, import parser)
npm run typecheck
npm run lint
```

## Deploy to Vercel

1. Import the GitHub repo in Vercel. `vercel.json` already sets the build command (runs migrations, then `next build`) and a daily cron for outreach.
2. Database (Supabase): create a new project just for Linkmogg. In Connect → ORMs/Connection string, copy the **Transaction pooler** URL (port 6543) into `DATABASE_URL` and the **Session pooler** URL (port 5432) into `DATABASE_URL_UNPOOLED`. Migrations run on every deploy. (Neon from the Vercel Marketplace works the same way.)
3. Add a Vercel Blob store (Storage → Blob) for avatar uploads. It sets `BLOB_READ_WRITE_TOKEN`.
4. Add the rest of the variables from `.env.example` (Settings → Environment Variables), then redeploy.
5. Stripe: create a product with a $10/month recurring price, put its id in `STRIPE_PRICE_ID`. Add a webhook to `https://YOUR_DOMAIN/api/stripe/webhook` for `checkout.session.completed` and `customer.subscription.created/updated/deleted`. Turn on the customer portal in Stripe settings.
6. Resend: verify your main domain (sign-in mail) and a separate outreach domain. Turn on open and click tracking for the outreach domain. Add a webhook to `https://YOUR_DOMAIN/api/resend/webhook` for `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`.
7. Sign in with the address in `ADMIN_EMAIL` and open `/admin/settings` to set your mailing address (required before any outreach email goes out).

## Plans

- New accounts get a 14-day trial with every theme, no card.
- After the trial: free tier keeps the page live with the Classic theme and the "Get your own →" badge. Links stay editable.
- Pro ($10/month via Stripe Checkout): every theme, no badge. Cancelling drops back to free; nothing is deleted.

## Outreach rules built in

- Only public link-in-bio pages you supply are read. `robots.txt` is honored, the fetcher identifies itself, waits between requests, and never logs in or retries around blocks. Anything blocked is flagged for manual entry.
- Emails only go to addresses the creator lists publicly, from a separate sending domain, with your mailing address, a one-click unsubscribe (`List-Unsubscribe` + page), and a global suppression list (hashed, so removals delete everything else).
- DMs are never sent automatically: they sit in `/admin/dm-queue` with a copy + open profile button.
- Daily and per-run caps, read delay and pause switch live in `/admin/settings`.
- Preview pages (`/claim/{token}`) are `noindex`, say who they were made for, and have a one-click remove that deletes the prospect's data.
