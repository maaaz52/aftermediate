# Deployment & Custom Domain

This app is a Next.js 16 app deployed on **Vercel** at `https://www.aftermediate.site` (already live). This document records the exact setup so it can be re-applied or moved without guessing.

## Password recovery configuration

In Supabase **Authentication → URL Configuration**, set the Site URL to
`https://www.aftermediate.site` and add these exact Redirect URLs:

- `https://www.aftermediate.site/reset-password`
- `http://localhost:3000/reset-password` for local development
- Each additional supported origin followed by `/reset-password` (including
  preview deployments where recovery is tested). Request and open the link on
  the same origin so the browser's PKCE verifier cookie is available.

In **Authentication → Email Templates → Reset Password**, the reset action
must link to `{{ .ConfirmationURL }}`, for example:

```html
<a href="{{ .ConfirmationURL }}">Reset password</a>
```

Do not replace that action with a plain Site URL or RedirectTo value: Supabase
must verify the email link before returning the authorization code. A missing
allowed redirect can send the user to the Site URL instead. The app handles
legacy recovery callbacks at `/?code=…` and moves them to `/reset-password`
after verification. Supabase's browser client performs the exchange once.

After deployment, request a fresh reset email, open it in the requesting
browser, update the password, and confirm sign-in with the new password.
Reopening a consumed link, using an expired link, or opening without the PKCE
verifier should show a retry message. Verify dashboard settings separately;
they are not versioned in this repository. Never paste callback codes or
tokens into logs or support messages.

## Hosting

- Provider: **Vercel** (project `aftermediate`, team `themz`)
- Production: `https://www.aftermediate.site`
- Default Vercel URL: `https://aftermediate-fk5taaqx1-themz.vercel.app`
- Deploy method: `git push` to `main` (GitHub → Vercel auto-deploy) or `npx vercel --prod --scope themz`

## Custom domain setup (as currently configured)

1. **Add the domain in Vercel:** Dashboard → Project `aftermediate` → **Settings → Domains** → add `aftermediate.site` and `www.aftermediate.site`.
2. **DNS records** (at the domain registrar / DNS provider — `aftermediate.site`):
   - `www.aftermediate.site` → **CNAME** to `cname.vercel-dns.com`
   - `aftermediate.site` (apex) → **A** records to `76.76.21.21` (or ALIAS/ANAME where the registrar supports it)
   - These are Vercel's current values; if Vercel changes them, copy the exact records shown in the **Domains** panel (it lists the target records per domain).
3. **HTTPS:** Vercel issues Let's Encrypt certificates automatically once DNS resolves; no manual cert action. Confirm the domain shows **"Valid Configuration"** in the Domains panel.
4. **Redirect default Vercel URL:** In **Settings → Domains**, set the default Vercel URL (`aftermediate-fk5taaqx1-themz.vercel.app`) to **Redirect** to `www.aftermediate.site` (or set `aftermediate.site` as primary and redirect the www or vice-versa — keep exactly one canonical).
5. **Verify:** `curl -sI https://www.aftermediate.site | head -1` returns `200`, and the Vercel URL redirects (301) to the custom domain.

No code changes are required for the domain — the app has no hardcoded host (all links are relative, and `metadata.metadataBase` in `src/app/layout.tsx` is set to the production domain).

## Environment variables (Vercel → Settings → Environment Variables)

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | `https://fwphwcuklnlerdlqjbqx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public anon key (safe in the browser bundle) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server-only; never expose to the client |
| `GOOGLE_GENERATIVE_AI_API_KEY` | yes | Gemini API key; server-only |
| `RESEND_API_KEY` | yes | powers OTP emails + contact-form emails |
| `OTP_HMAC_SECRET` | yes (prod) | HMAC secret for OTP code hashing |
| `GOOGLE_MODEL` | no | default `gemini-flash-latest` |
| `CHAT_PRIMARY_PROVIDER` | no | `gemini` by default; set `nvidia` only after comparing production latency and response quality |
| `NEXT_PUBLIC_SITE_URL` | yes | canonical site origin; use `http://localhost:3000` locally |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | no | required only for Google sign-in |
| `NEXT_PUBLIC_GA_ID` | no | required only for Google Analytics |
| `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | no | server/edge and browser error reporting |
| `SENTRY_AUTH_TOKEN` | build | only needed when uploading Sentry source maps |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | no | only for R2 video streaming |
| `CRON_SECRET` | yes, for source monitoring | long random secret that authorizes Vercel's weekly official-source monitor |
| `ADMIN_EMAILS` | yes, for source review | comma-separated server-only email allowlist; set to `themz52@proton.me` |

`src/lib/server-env.ts` is the single source of truth for server-side variables.

Before deploying this hardening release, run
`supabase/migrations/20261020_security_hardening.sql` in the Supabase SQL editor.
It revokes unsafe public RPC access, adds atomic OTP and rate-limit operations,
enforces text/upload bounds, and installs the review-sentiment trigger.

## Official-source monitoring

Run `supabase/migrations/20261022_source_monitoring.sql` after the existing
migrations. The first successful cron run registers every official admissions
and fee source recorded for every university in the versioned Pakistan
directory. FAST-NUCES additionally has dedicated schedule and eligibility
checks. It also registers every source recorded in the active Pakistan and
study-abroad scholarship directories. No arbitrary URL stored in the database
can be fetched.

Run `supabase/migrations/20261022_scholarship_source_monitoring.sql` after that
migration before deploying the scholarship-monitoring expansion.

Run `supabase/migrations/20261022_admission_calendar_reviews.sql` to enable the
private review workflow and confirmed admission-calendar dates. Set
`ADMIN_EMAILS=themz52@proton.me` in Vercel before using `/admin/source-updates`.

Run `supabase/migrations/20261022_source_follows.sql` to let students follow a
university or scholarship, then `supabase/migrations/20261022_source_update_alerts.sql`
to enqueue an email only when a reviewed official-source change affects an item
they follow. The review action sends a bounded batch immediately; the existing
weekly monitoring run safely retries pending delivery without adding another
Vercel schedule.

Run `supabase/migrations/20261022_deadline_reminders.sql` to enable exact-date
deadline reminders. In the review dashboard, enter a reminder label and only a
date explicitly shown on the official source. The same weekly job emails each
current follower once when that date is within 14 days, so no estimated window
is ever sent as an exact deadline.

The same weekly monitor sends a compact pending-review digest to every address
in `ADMIN_EMAILS` when official-source candidates still await review. This
requires no additional environment variable, schedule, or Supabase migration.

Run `supabase/migrations/20261022_merit_list_alerts.sql` to classify reviewed
changes as a general update, an official merit-list publication, or a
selection/offer update. The email wording stays factual: it links a follower
to the official result and never claims the student personally received an offer.

`vercel.json` calls `/api/cron/source-monitor` every Sunday at 02:00 UTC
(07:00 Pakistan time). Set a long, random `CRON_SECRET` in Vercel before
deployment; Vercel includes it as a Bearer token when it invokes the route. A
run checks up to 12 least-recently-checked sources, so the full current
catalogue rotates over roughly fifteen weeks while keeping free-tier scheduled
usage low. The monitor stores a baseline on its first
successful run, then creates a **pending** source-update candidate on later
changes. It intentionally does not auto-publish values to students: an official
page redesign, correction, or unrelated announcement must be reviewed before
it changes an admission, fee, deadline, or merit claim.

## Production checks after deploy

- `https://www.aftermediate.site` returns 200 and `Strict-Transport-Security` header.
- The default Vercel URL redirects (301) to the custom domain.
- `https://www.aftermediate.site/nonexistent` returns HTTP **404** (see `src/app/not-found.tsx`).
- Page `<title>` is unique per route (see `src/app/layout.tsx` template + per-page `metadata`).
