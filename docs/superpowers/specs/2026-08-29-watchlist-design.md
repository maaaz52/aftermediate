# University Watchlist & Merit List Alert — Design Spec

> **Audience:** Implementation engineer with zero context.
>
> **One-liner:** Students track university programs, get notified when closing merits change, and see their standing at a glance on the dashboard — creating a recurring reason to return throughout the June–September admissions window.

## Problem

Pakistani universities release merit lists incrementally (1st through 4th) over several weeks. Students currently spend months frantically refreshing university websites daily to check if their name appears on the closing merit list. This drives high initial signups ("check your merit against NUST/FAST") but near-zero retention — there is no reason to return after the first visit.

## Solution & Retention Mechanism

1. **Watchlist creation** — After entering their scores, students track specific programs (NUST CS, FAST AI, COMSATS SE). Each entry snapshots the current closing merit and the student's own aggregate.
2. **Change detection** — On every dashboard visit, the app compares each watched entry's `lastKnownMerit` against the current `closingMerit` from the curated `universities.json`. Detected changes are flagged.
3. **Email notification** — When a program's closing merit changes (new merit list published), the student receives an email alert — up to once per entry per 24 hours.
4. **Dashboard watchlist section** — Cards showing each watched program, the student's merit vs. closing merit with color-coded gap (safe/tight/reach), last updated timestamp, and refresh controls.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Data source | Curated `universities.json` (not scraping) | Ships in days, no fragility from website layout changes, no CAPTCHA/IP blocking |
| Email provider | Resend | Free tier 100/day, integrates with Supabase, simple API |
| Phase 1 scope | Existing universities only | Data model includes `type` field for future custom programs |
| Notification cadence | Only on merit list announcements (closingMerit + year change) | Prevents noise from minor data corrections |

## Data Model

### WatchlistEntry

```typescript
interface WatchlistEntry {
  id: string;                  // e.g. "wl_nust_cs"
  type: "university";          // future: "custom" | "manual"
  universityId: string;        // matches University.id (e.g. "nust")
  programName: string;         // matches University.programs[].name (e.g. "Computer Science")

  // Snapshot at time of watching
  capturedMerit: number | null;
  capturedYear: string | null; // e.g. "2025"
  capturedAt: string;          // ISO timestamp

  // Latest known state
  lastKnownMerit: number | null;
  lastCheckedAt: string | null;

  // Student's own standing
  myMerit: number | null;
  myStream: string | null;

  // Notification
  notifyEmail: boolean;        // default true
  lastNotifiedAt: string | null;
}
```

### StudentProfile extension

`watchlist: WatchlistEntry[]` — stored in localStorage key `aftermediate:watchlist` AND in Supabase `profiles.watchlist jsonb` (same local-first/sync pattern as `marks`, `quiz`, `practice`).

## Architecture

```
src/
  lib/
    watchlist.ts               — Pure functions: add/remove/update entries, detect changes,
                                  compute gap status. No React dependency, testable in isolation.
    types.ts                   — Add WatchlistEntry interface
    store.tsx                  — Extend StudentProfile with watchlist field
  app/
    api/
      watchlist/
        sync/route.ts          — POST: persist local watchlist to Supabase
        check/route.ts         — GET: compare lastKnownMerit vs curated data for all watched entries
        notify/route.ts        — POST: send email via Resend for a changed entry
  components/
    watchlist/
      watchlist-section.tsx    — Dashboard section: header + card list + track button
      watchlist-card.tsx       — Single entry card: program info, merit comparison, status
      program-search.tsx       — Search/add programs overlay (stream-filtered, reuses merit page data)
      notification-badge.tsx   — Small "NEW" indicator for recently changed entries
      emit.js                 — Desktop app "new merit list" notification (optional)
  data/
    universities.json          — Already exists; closingMerit field is the authoritative source
```

## Component Tree & Layout

### Dashboard — WatchlistSection

```
┌──────────────────────────────────────────────────────────┐
│  Merit Watchlist                   3 tracked  [Track new] │
│                                                          │
│  ┌── NUST — Computer Science ──────────────────────┐    │
│  │  ██ Closing  85.2%    My merit  83.1%  tight -2.1│    │
│  │  🔔 Updated 2 days ago              [Refresh now]│    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌── FAST — Artificial Intelligence ────────────────┐    │
│  │  ██ Closing  81.5%    My merit  78.0%  reach -3.5│    │
│  │  🔔 No changes since Aug 20           [Refresh]  │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌── COMSATS — Software Engineering ────────────────┐    │
│  │  ██ Closing  79.0%    My merit  83.1%  safe +4.1 │    │
│  │  🔔 Updated today                     [Refresh]  │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

**Left color strip** — emerald (safe, gap ≥ 0), amber (tight, -5 ≤ gap < 0), red (reach, gap < -5). Matches existing merit page badge colors.

### Track New Program

Searchable overlay listing all programs filtered by the student's stream. Each row shows university, program, current closingMerit. A "Track" button adds it. Already-tracked programs show a "Tracking" disabled state with a remove option. Empty state: "Start by tracking your target programs from the Merit page or the search above."

### Email Notification

Template (plain text + minimal HTML):

```
Subject: 🔔 Merit update: NUST Computer Science

Your watchlist program has a new merit list:

  NUST — Computer Science
  Previous: 84.0%
  New:      85.2%
  Your merit: 83.1% (tight by 2.1%)

Log in to see your full watchlist:
https://aftermediate.vercel.app/dashboard
```

Sent only when:
1. `closingMerit` in the curated data changed AND year changed (genuine new merit list, not a correction)
2. `notifyEmail === true` for that entry
3. `lastNotifiedAt` is null or > 24h ago

## Change Detection Flow

```
Dashboard mount
  │
  ├─ GET /api/watchlist/check
  │     │
  │     ├─ For each watched entry, look up universityId + programName in universities.json
  │     ├─ If closingMerit !== lastKnownMerit → diff detected
  │     ├─ If year changed → "merit list announcement" (eligible for email)
  │     └─ Return [{ entryId, currentMerit, currentYear, changed: bool }]
  │
  ├─ Client updates local lastKnownMerit + lastCheckedAt
  ├─ Shows "Updated" / "New" badges
  │
  └─ For each entry with changed==true && notifyEmail==true:
       └─ POST /api/watchlist/notify
             ├─ Resend.send({ to: user.email, subject, html })
             └─ Updates lastNotifiedAt (server-side timestamp)
```

## Data Flow (Local-First)

1. Watchlist mutations (add/remove/update) write to localStorage immediately (key `aftermediate:watchlist`)
2. `POST /api/watchlist/sync` syncs the full array to Supabase `profiles.watchlist`
3. On login, Supabase profile hydration populates the watchlist into localStorage
4. All reads come from localStorage (instant, no loading state)

This matches the exact pattern used by `marks`, `quiz`, and `practice` — no new sync infrastructure needed.

## Supabase Changes

Add column to `profiles` table:

```sql
alter table public.profiles add column if not exists watchlist jsonb default '[]'::jsonb;
```

No new table needed — watchlist is a JSONB column on the existing profiles table, matching the pattern of `marks`, `quiz`, and `practice`.

## Email Provider Setup

1. Install `resend` npm package
2. Create Resend account (free tier: 100 emails/day, 1 sending domain)
3. Verify domain ownership (or use Resend's test domain `resend.dev` for MVP)
4. Add `RESEND_API_KEY` to `.env.local`

The API route `POST /api/watchlist/notify` uses Resend SDK:

```typescript
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
  from: "Merit Alerts <watchlist@aftermediate.vercel.app>",
  to: userEmail,
  subject: `🔔 Merit update: ${programName}`,
  html: `<p>...</p>`,
});
```

## Implementation Tasks

### Task 1: Core lib + types

**Files:**
- Create: `src/lib/watchlist.ts`
- Modify: `src/lib/types.ts` (add `WatchlistEntry` interface), `src/lib/store.tsx` (extend `StudentProfile`)

`watchlist.ts` pure functions:
- `addEntry(watchlist, program): WatchlistEntry[]` — creates entry with snapshot, returns new array
- `removeEntry(watchlist, id): WatchlistEntry[]`
- `updateEntry(watchlist, id, patch): WatchlistEntry[]`
- `computeGap(myMerit, closingMerit): "safe" | "tight" | "reach"` — gap >= 0 → safe, -5 ≤ gap < 0 → tight, gap < -5 → reach
- `findProgram(universities, universityId, programName): { closingMerit, year } | null`

Tests (vitest, 10+ tests):
- addEntry creates snapshot with correct fields
- addEntry generates unique id
- removeEntry removes correct program
- updateEntry patches a field
- computeGap has correct thresholds
- computeGap handles null merits
- findProgram finds correct program
- findProgram returns null for unknown
- findProgram returns null for known program with no closingMerit
- Watchlist deduplication (adding same program twice updates instead of duplicating)

### Task 2: Store + Supabase integration

**Files:**
- Modify: `src/lib/types.ts` (add `WatchlistEntry` interface)
- Modify: `src/lib/store.tsx` (add `watchlist` to `StudentProfile`, `defaultProfile`)
- Create: `src/app/api/watchlist/sync/route.ts`
- Supabase migration

Store changes:
- `StudentProfile.watchlist: WatchlistEntry[]`
- `defaultProfile.watchlist: []`
- localStorage key `aftermediate:watchlist` — loaded in the provider initializer alongside profile
- `update({ watchlist })` writes both localStorage and triggers Supabase sync

Sync route `POST /api/watchlist/sync`:
- Auth check (supabase-js getSession)
- Upserts `profiles.watchlist` to the request body array
- Returns `{ ok: true }`

Supabase migration:
```sql
alter table public.profiles add column if not exists watchlist jsonb default '[]'::jsonb;
```

### Task 3: API routes — check + notify

**Files:**
- Create: `src/app/api/watchlist/check/route.ts`
- Create: `src/app/api/watchlist/notify/route.ts`

Check route `GET /api/watchlist/check`:
- Auth check
- Reads request watchlist from query param or body (or from Supabase profile)
- For each entry, calls `findProgram()` against `universities.json`
- Returns `{ entries: [{ id, currentMerit, currentYear, yearChanged, meritChanged }] }`
- No external calls — pure JSON lookup, ~5ms

Notify route `POST /api/watchlist/notify`:
- Auth check
- Accepts `{ entryId, currentMerit, previousMerit, programName, universityName }`
- Reads user email from Supabase auth session
- Sends via Resend
- Returns `{ sent: true }` or `{ sent: false, reason: "rate-limited" }`
- Server-side rate limit: check `lastNotifiedAt` from the watchlist entry (passed in request)
- NOTE: The server doesn't own the source of truth for watchlist (localStorage-first). The rate-limit check reads from the request body's `lastNotifiedAt`, not from the DB. For MVP this is acceptable — client is trusted. If abuse becomes a problem, add server-side tracking later.

### Task 4: Dashboard section — watchlist-section + card

**Files:**
- Create: `src/components/watchlist/watchlist-section.tsx`
- Create: `src/components/watchlist/watchlist-card.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx` (import and render section)

`watchlist-section.tsx`:
- Fetches `GET /api/watchlist/check` on mount
- Reads watchlist from `useStudent().profile.watchlist`
- Sorts entries: tight → reach → safe → unknown
- Renders header with count + "Track new program" button
- Renders card list with scrollable container
- Empty state: illustration + "Start by tracking your target programs"
- Calls `POST /api/watchlist/sync` after add/remove

`watchlist-card.tsx`:
- Props: `WatchlistEntry`, `currentMerit`, `currentYear`, `changed: boolean`, `onRefresh`, `onRemove`
- Shows: university name, program name, closing merit, student's merit, gap badge (safe/tight/reach), "Updated X ago" timestamp, bell icon for email on/off
- Left border color strip (emerald/amber/red)
- "Refresh now" button calls `onRefresh`
- Remove button (×) with confirmation
- "NEW" badge overlay when `changed===true` and user hasn't acknowledged
- Click navigates to `/merit?university=${universityId}&program=${programName}` (or program detail page)

Dashboard integration:
```tsx
// After <RahbarBanner /> (or between practice summary and coarse aggregate)
<div className="mt-4 animate-reveal" style={{ animationDelay: "480ms" }}>
  <WatchlistSection />
</div>
```

### Task 5: Program search / track picker

**Files:**
- Create: `src/components/watchlist/program-search.tsx`
- Modify: `src/app/(app)/merit/page.tsx` (add "Track" button to table rows)

`program-search.tsx`:
- Overlay/drawer triggered by "Track new program" button
- Search input filters universities + programs by name
- Filtered by student's stream (only show programs for their stream)
- Each result row: university name + program name + current closing merit + "Track" button
- Already-tracked programs show "Tracking" with a ✓ and are disabled
- Selected streams from existing merit page data

Merit page integration:
- Add a "Track" column or button to the "Where does that land?" table
- Each row gets a small "Track" button; if already in watchlist, shows "Tracking" (disabled)
- Clicking "Track" adds it and shows a brief confirmation toast
- Uses the same `update({ watchlist })` from store

### Task 6: Verification pass

**Files:**
- Create: `src/lib/watchlist.test.ts` (already created in Task 1)
- Modify: `src/data/universities.json` if necessary (update closing merits for testing)

Gates:
- `npx vitest run src/lib/watchlist.test.ts` — 10+ tests pass
- `npx tsc --noEmit` — exit 0
- `npx eslint src/components/watchlist/ src/lib/watchlist.ts` — exit 0
- `npx next build` — success, all routes compiled
- Manual smoke: dashboard loads, add/remove programs, cards show correct gaps, email notification fires (test with Resend test domain)

## Existing Patterns to Follow

- **Design tokens**: `--color-violet: #7a5bd4` accent, `--color-emerald` safe, `--color-saffron` tight, `--color-danger` reach, `--color-bg: #f4f2eb` paper, `--color-ink: #191f2c` text — all from globals.css
- **Card pattern**: `rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow` (hard shadow via `.pixel-shadow` class)
- **Badge pattern**: Existing `safe`/`tight`/`reach` badges in merit page — reuse `Badge variant="emerald|saffron|danger"`
- **Client wrapper**: Server page component rendering client component (same as dashboard, skills pages)
- **localStorage-first**: Read from localStorage, sync to Supabase on mutations — same as `marks`, `quiz`, `practice`
- **Store pattern**: `update({ watchlist })` triggers localStorage write + state update (store.tsx)
- **useLocalStorage**: Available from `@/lib/skills` for any secondary/local-only watchlist state
- **Font sizing**: `font-mono text-[11px] font-bold uppercase tracking-widest text-violet` for micro-labels (existing convention)

## Future Considerations (Not in Scope)

- Custom programs (user manually enters a merit target not in our dataset)
- Scraping-based monitoring for real-time detection
- WhatsApp/SMS notification channel
- Mobile push notifications via the app
- Historical merit trend chart ("closing merit over last 4 lists")
- Merit list PDF upload with OCR parsing
- Shared/community watchlists ("see what other pre-engineering students are tracking")