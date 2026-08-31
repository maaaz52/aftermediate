# "Your Voice" — Feedback & Wishlist Page Design Spec

**Status:** Approved (2026-08-31) · **Route:** `/feedback` · **Shell:** inside app layout (sidebar + topnav)

## 1. Overview

A guided, animated feedback experience replacing the traditional review form. Users journey through a 4-step wizard — mood, rating, story, wishlist — and land on a celebration screen with confetti, a personalized thank-you, auto-tagged sentiment, and a shareable story card. Reviews and feature requests persist to real Supabase tables with RLS; media uploads go to a Supabase Storage bucket.

**User-approved decisions:**

| Decision | Choice |
|---|---|
| Experience model | **A — Guided Journey** (4-step wizard + celebration) |
| Persistence | **B — Real Supabase tables** (reviews, review_media, feature_requests, feature_votes) |
| Auto-tagging | **A — Rule-based local engine** (offline, instant, unit-tested) |
| Media uploads | **B — Real Supabase Storage** (limits + moderation note) |
| Emoji usage | **Sparing** — lucide icons + text labels primary; emoji accents only on celebration screen |
| Name / placement | "Your Voice", sidebar link under **Community** group (next to Mentor Match) |
| Share card | **PNG + PDF** via html2canvas/html2pdf (bundled in existing html2pdf.js dep) |

## 2. Page Flow

Four steps, each optional-adapting (skip story / skip wishlist — the wizard advances regardless). A progress comet (4 segments) sits above the step content.

1. **How do you feel?** — Mood meter: 5 labeled levels *Loved it / Liked it / Meh / Disappointed / Frustrated*, each with a lucide icon (`Laugh`, `Smile`, `Meh`, `Frown`, `Angry`). Selection springs the level (scale + glow). Sets tone for the thank-you and auto-tag.
2. **Rate the journey** — Glowing 0–10 slider with large animated readout, end labels ("not for me" → "life-changing"). `role="slider"` with keyboard arrows.
3. **Tell your story** (optional, expandable cards) — *"What surprised me?"* textarea (lucide `Sparkles` header), *"How did this change my mindset?"* textarea (lucide `Brain` header), *"Would I recommend this to…?"* persona chips (students / professionals / beginners / educators), media uploads (preview + limits + "pending moderation" note), voice-to-text mic (Web Speech API, feature-detected, graceful fallback).
4. **Shape what's next** (optional) — feature request form: name, description, use case, P0/P1/P2 priority pills. Links to the wishlist wall below.

**Celebration screen:** confetti burst → "Hira, your voice landed" (name from profile via `useStudent()`) → sentiment tag badges → tone-matched closing message → **Share Your Story** card with PNG + PDF download → "Vote on the wishlist" (scrolls to wall) → moderation note when media attached.

**Wishlist wall** renders below the wizard on the same page: roadmap filter chips (Open / In Planning / Shipped), each feature row shows name, description, use case, priority pill, upvote button with count (optimistic update, one vote per user, toggleable).

## 3. Components

New directory `src/components/feedback/`:

- `feedback-journey.tsx` — wizard orchestrator: step state machine, progress comet, step transitions (fade/slide, reduced-motion aware), `aria-live` step announcements, focus moves to step heading on transition. Uses `useStudent()` for the greeting name.
- `mood-meter.tsx` — Step 1 widget (radiogroup semantics, `aria-pressed` toggle buttons).
- `rating-slider.tsx` — Step 2 custom slider.
- `story-step.tsx` — Step 3: story textareas, persona chips, hosts `media-uploader` and `voice-input`.
- `media-uploader.tsx` — file picker (accept image/video/audio), live object-URL preview, client-side validation via `validateMedia` (image ≤5MB, video/audio ≤25MB), moderation note text.
- `voice-input.tsx` — Web Speech API wrapper; hidden when unsupported; pulsing mic while recording; transcribes into the focused story field.
- `wishlist-step.tsx` — Step 4 form + the wall (roadmap filter, upvote rows) + `toggleVote` wiring with optimistic count.
- `celebration.tsx` — confetti (injectable `play` fn for tests), tag badges, personalized message, moderation note.
- `share-story-card.tsx` — styled summary card (name, tone tag, rating, quote, date, brand) rendered off-screen; exports PNG via `html2canvas` and PDF via `html2pdf` (both available from `html2pdf.js`).

Page shell: `src/app/(app)/feedback/page.tsx` — client page, warm heading + dark island panel (`#09090B` grid bg), same pattern as `/builder`.

## 4. Rule Engine — `src/lib/feedback-model.ts`

Pure, deterministic functions (pattern: `resume-model.ts`), zero network:

- `analyzeSentiment(tone, rating, text)` → `{ tag, score, summary }`
  - Base score from tone + rating mapping.
  - Lexicon deltas: positive words (+), negative words (−), constructive cues ("could improve", "suggestion", "but", "maybe").
  - Boundaries: ≥85 `highly-positive`, ≥60 `positive`, ≥40 `constructive`, else `critical`.
  - `summary`: deterministic template line by priority — rating ≥8 → `Rated {n}/10`; rating ≤3 → `Rated {n}/10`; first lexicon phrase hit in text (exact phrase, ≤8 words); else `Shared a {tone} experience`. Never fabricates a quote.
- `TONE_META` — level labels, lucide icon names, colors.
- `PERSONAS` — `["students", "professionals", "beginners", "educators"]` with labels.
- `PRIORITIES` — p0/p1/p2 labels.
- `validateMedia(file)` → `{ ok: true } | { ok: false, error }` — type allowlist + size limits.

## 5. Data Model — `supabase/schema.sql` (append, idempotent)

```sql
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tone text not null check (tone in ('loved','liked','meh','disappointed','frustrated')),
  rating smallint not null check (rating between 0 and 10),
  review_text text default '',
  surprised text default '',
  mindset text default '',
  recommend_to text[] default '{}',
  sentiment_tag text check (sentiment_tag in ('highly-positive','positive','constructive','critical')),
  sentiment_score smallint check (sentiment_score between 0 and 100),
  status text not null default 'pending' check (status in ('pending','published','hidden')),
  created_at timestamptz default now()
);

create table if not exists public.review_media (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete cascade,
  url text not null,
  media_type text not null check (media_type in ('image','video','audio')),
  file_name text not null,
  file_size integer not null,
  created_at timestamptz default now()
);

create table if not exists public.feature_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text default '',
  use_case text default '',
  priority text not null default 'p1' check (priority in ('p0','p1','p2')),
  status text not null default 'open' check (status in ('open','planning','shipped')),
  votes_count integer not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.feature_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  feature_id uuid references public.feature_requests(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, feature_id)
);
```

**RLS** (naming matches existing conventions):

- `reviews`: select — own row OR `status = 'published'`; insert/update — own row.
- `review_media`: select/insert via `exists` subquery on parent review (own row, or published for select).
- `feature_requests`: select — all authenticated users; insert/update — own row.
- `feature_votes`: select — own; insert — own (unique constraint enforces one vote); delete — own (toggle off).
- **Storage bucket `review-media`** (public, for previews): object paths `{user_id}/{uuid}.{ext}`; insert/delete policies scoped to `(storage.foldername(name))[1] = auth.uid()::text` — same pattern as existing `marksheets` bucket.
- `votes_count` maintained by a trigger on `feature_votes` insert/delete.

## 6. Data Layer — `src/lib/feedback-api.ts`

Wraps the browser Supabase client (`src/lib/supabase/client.ts`):

- `submitReview(payload, files[])` — uploads files to `review-media/{user_id}/{uuid}.{ext}`, inserts the review row + media rows.
- `toggleVote(featureId)` — insert/delete vote; returns new count for optimistic UI.
- `listFeatureRequests(status)` — ordered by `votes_count desc`, filtered by status chip.

Errors surface as inline messages on the form; no throw-through.

## 7. Accessibility

- Step transitions: `aria-live="polite"` announcement; focus moved to the step heading.
- Mood meter: toggle buttons (`aria-pressed`); slider: `role="slider"` + arrow keys; chips: toggle buttons; mic: `aria-label`.
- All animations (confetti, springs, comet) disabled under `prefers-reduced-motion`.
- Voice input feature-detected; unsupported browsers get the plain textarea automatically.

## 8. Testing & Gates

- `src/lib/feedback-model.test.ts` — ~12 tests: tone+rating mapping, lexicon deltas, tag boundaries, summary determinism, `validateMedia` limits.
- `src/components/feedback/feedback-journey.test.tsx` — ~12–15: render, step navigation, skip paths, greeting name from mocked `useStudent`, sentiment badges on celebration, confetti stub (injectable `play`), share card stub, vote optimistic + toggle, moderation note.
- `src/components/feedback/media-uploader.test.tsx` — limits, preview, moderation note.
- `src/components/feedback/story-step.test.tsx` — chip toggling, voice fallback.
- Supabase calls mocked (`vi.mock` on the client module); test conventions match `builder.test.tsx` (jsdom, `userEvent`, `within` scoping, generous `waitFor`).
- All four gates green before commit: vitest, tsc, eslint, build.

## 9. Integration & Delivery

- `src/components/sidebar.tsx` — "Your Voice" link in Community group (icon: `MessageSquareHeart`, verified exported by installed lucide-react).
- New dependency: `canvas-confetti` + `@types/canvas-confetti` (dev).
- Schema appended to `supabase/schema.sql`; applied manually in Supabase dashboard SQL Editor (project convention).
- Execution: implementation plan → subagent-driven tasks with two-stage review; frequent commits; then push + Vercel production with the L3 security gate before push.

## 10. Out of Scope

- Admin moderation UI (reviews stay `pending`; moderation is a note only).
- Public review wall UI (published reviews are readable via RLS but no wall page in this scope).
- Cross-device draft sync; email notifications; LLM deep analysis.
