# Dashboard Redesign — Design Spec

**Date:** 2026-08-26
**Status:** Approved by user (visual direction B chosen via browser mockup)

## Summary

Rebuild `/dashboard` from a stacked content page into an organized, Modern-SaaS-style dashboard that gives a student a one-glance status: who they are, where they stand (aggregates), where they're most valuable globally, and what to do next — with summaries only, and deep links to the detailed pages (Merit, Career, Money, Trends).

## Design Decisions (user-confirmed)

| Decision | Choice |
|---|---|
| Visual direction | **B · Modern SaaS** — rounded cards, soft shadows, sparklines, gradient progress bars, status chips |
| Coarse aggregate | **One overall number** — weighted FSc **60%** + Matric **40%**, marks only (no entry test) |
| Fine aggregate | **Formula breakdown** — real weighted formulas per stream (NUST 75/15/10, FAST 50/40/10, PMDC 50/40/10) with contribution bars + final number |
| "Most valuable" predictor | **Hybrid** — rule-based country scores (demand + post-study work mix) shown instantly, AI one-line insight per country added via Gemini |
| Best-fit fields | **5 compact tiles**, ranked by quiz **interests** first, then demand |
| Study abroad | **Summary only** — top 3 destinations by volume with volume + post-study work chips |
| Profile | Brief summary card + chip row, no details |
| Removed | Reality-check card, 4 tool-link cards, big Rahbar block (→ slim gradient banner) |

## Page Structure (top → bottom)

1. **Header row** — "Salam, {name} 👋" + subline + stream badge + FSc% chip + Edit profile link
2. **Profile summary** — avatar tile (initial, name, city · province · year, budget · relocate) + chips (Matric %, FSc %, entry test score if present, interests (2–3), scholarship need)
3. **Coarse aggregate card** — "Overall Standing": big number + "top X%" chip + sparkline + note
4. **Fine aggregate card** — "Formula Breakdown": 3 weighted rows with gradient bars (component · weight → contribution) + final aggregate per applicable formula
5. **"Where you're most valuable"** — 3 country tiles: flag, country, demand score (0–100, green ≥85, amber ≥70), one-line reason (AI insight or static fallback), "✦ AI insight" badge
6. **Study abroad summary** — 3 destination rows: flag, country, volume chip, post-study-work chip, → Money
7. **Best-fit fields** — 5 tiles: emoji, name, demand chip, salary range, → Career
8. **Slim Rahbar banner** — gradient strip with "Ask Rahbar" button

## Logic & Data

### Coarse aggregate (new)
New function in `src/lib/aggregates.ts`:
```
overallStanding(marks) → { value: number, percentile: number, label: string }
```
- `value` = FSc% × 0.60 + Matric% × 0.40 (marks only; entry test ignored)
- Percentile mapping (approximate bands derived from existing `mdcatPercentile` style):
  - ≥95 → top 1% · ≥90 → top 5% · ≥85 → top 10% · ≥80 → top 20% · ≥70 → top 40% · ≥60 → top 60% · else → top 80%
- Hidden entirely when `fscTotal === 0` (no marks yet)

### Fine aggregate (existing formulas)
- `pre-medical` → `mdcatAggregate` (50/40/10)
- `pre-engineering` / `ics` / `alevel` → `nustAggregate` (75/15/10) + `fastAggregate` (50/40/10) — show breakdown of the primary one, final numbers for both
- `icom` → no formula; card shows guidance text + link to Merit
- Entry test missing → breakdown bars show weights with "add your score" CTA to `/merit` (values from available marks only)

### Most-valuable predictor (hybrid)
New data file `src/data/demand.json`:
```json
{
  "pre-engineering": [
    { "country": "Germany", "flag": "🇩🇪", "score": 94,
      "reason": "EU Blue Card pathway; chronic engineer shortage",
      "focus": "Mechanical / Electrical" },
    { "country": "Canada", "flag": "🇨🇦", "score": 88,
      "reason": "Express Entry + 3-year PGWP; engineering in-demand list", "focus": "Software / Civil" },
    { "country": "UAE", "flag": "🇦🇪", "score": 76,
      "reason": "Tax-free; construction & infrastructure boom", "focus": "Civil / Electrical" }
  ],
  "pre-medical": [ /* Germany (physician recognition), UK (NHS), Australia (AHPRA) */ ],
  "ics": [ /* Germany, Canada, USA (STEM OPT) */ ],
  "icom": [ /* UAE, UK, Australia (business) */ ],
  "alevel": [ /* UK, Canada, Australia */ ]
}
```
- Score = mix of job demand (primary) + post-study work rights (secondary), 0–100, hand-curated per stream
- Colors: score ≥85 emerald, ≥70 amber, else gray
- AI insight: new route `src/app/api/demand/route.ts` — `POST { stream, interests[] }` → Gemini returns 3 one-liners (one per country). Client caches in `localStorage["aftermediate:demand-insights"]` keyed by stream; TTL 7 days. Static `reason` from demand.json is the instant fallback while AI loads or on failure.

### Study abroad summary
Reuse `data.destinations` from `src/data/abroad.json`. Deterministic: take the first 3 entries of the `destinations` array order (China, UK, Australia). Each row shows: flag, country, volume chip (`approxStudents`), post-study-work chip (`postStudyWork`), link to `/money`.

### Best-fit fields
- `getMajorsByStream(stream)`, take top 5 by: (1) interests overlap (major field vs `profile.interests` keywords), (2) demand rank (high > medium > low), (3) salary high
- Tile: emoji, name, demand chip (colored), salary range compact, link to `/career/{id}`

## Components

New files (all client components under `src/components/dashboard/`):
- `profile-summary.tsx` — header row + profile card
- `coarse-aggregate.tsx` — big number card with sparkline + percentile chip
- `fine-aggregate.tsx` — formula breakdown card
- `valuable-countries.tsx` — country tiles + AI insight fetch/cache
- `study-abroad-summary.tsx` — top-3 destination rows
- `best-fields.tsx` — 5 compact field tiles
- `rahbar-banner.tsx` — slim gradient CTA (dispatch `open-rahbar` event)

`src/app/(app)/dashboard/page.tsx` — rewritten to compose the above (or contain sections inline if smaller; prefer inline sections in page + separate `valuable-countries` for AI logic).

## Motion / "Wow Factor"

- Count-up on all big numbers on mount (reuse `src/components/count-up.tsx`)
- Sparkline SVG (hand-rolled polyline, no recharts needed)
- Gradient progress bars with width transition on mount
- Staggered fade-up entrance (`animate-reveal` with delays)
- Hover lift on cards (translate-y + shadow)
- AI insight shimmer skeleton while loading

## Error / Edge Handling

- No marks (`fscTotal === 0`): coarse hidden, fine shows CTA to `/merit` (already have profile data via onboarding, so this is a safety net)
- AI route fails / no API key: fall back to static `reason`; badge hides "✦ AI insight"
- `icom`: fine aggregate shows explanatory text instead of formula bars
- Unknown stream: default to `pre-engineering` (existing pattern in current page)

## Out of Scope

- No changes to sidebar/top-nav, Merit/Career/Money/Trends pages (they stay as the "detailed" destinations)
- No backend/database changes (demand data is static JSON + AI route)
- No landing page changes

## Test Plan

- `npm run build` passes (TS + lint)
- Manual: dashboard renders all sections with seeded profile; count-ups animate; AI insights load with fallback; `/merit`, `/career`, `/money` links work; mobile grid collapses to 1 column
- `npx tsc --noEmit` clean
