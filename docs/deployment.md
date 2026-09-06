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
| `RESEND_API_KEY` | yes | powers OTP emails + contact-form emails |
| `OTP_HMAC_SECRET` | yes (prod) | HMAC secret for OTP code hashing |
| `GOOGLE_MODEL` | no | default `gemini-flash-latest` |
| `SENTRY_AUTH_TOKEN` | dev | only needed for Sentry source maps |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | no | only for R2 video streaming |

`src/lib/server-env.ts` is the single source of truth for server-side variables.

## Production checks after deploy

- `https://www.aftermediate.site` returns 200 and `Strict-Transport-Security` header.
- The default Vercel URL redirects (301) to the custom domain.
- `https://www.aftermediate.site/nonexistent` returns HTTP **404** (see `src/app/not-found.tsx`).
- Page `<title>` is unique per route (see `src/app/layout.tsx` template + per-page `metadata`).