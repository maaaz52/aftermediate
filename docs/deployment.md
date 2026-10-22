# Deployment & Custom Domain

This app is a Next.js 16 app deployed on **Vercel** at `https://www.aftermediate.site` (already live). This document records the exact setup so it can be re-applied or moved without guessing.

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
| `CRON_SECRET` | yes, for source monitoring | long random secret that authorizes Vercel's daily official-source monitor |

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
checks. No arbitrary URL stored in the database can be fetched.

`vercel.json` calls `/api/cron/source-monitor` daily at 02:00 UTC. Set a long,
random `CRON_SECRET` in Vercel before deployment; Vercel includes it as a Bearer
token when it invokes the route. A run checks up to 12 least-recently-checked
sources, so the full current catalogue rotates over roughly six days while
keeping the serverless job reliable. The monitor stores a baseline on its first
successful run, then creates a **pending** source-update candidate on later
changes. It intentionally does not auto-publish values to students: an official
page redesign, correction, or unrelated announcement must be reviewed before
it changes an admission, fee, deadline, or merit claim.

## Production checks after deploy

- `https://www.aftermediate.site` returns 200 and `Strict-Transport-Security` header.
- The default Vercel URL redirects (301) to the custom domain.
- `https://www.aftermediate.site/nonexistent` returns HTTP **404** (see `src/app/not-found.tsx`).
- Page `<title>` is unique per route (see `src/app/layout.tsx` template + per-page `metadata`).
