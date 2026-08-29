# University Watchlist & Merit List Alert — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Students track university programs, get notified when closing merits change, and see their standing at a glance on the dashboard — creating a recurring reason to return throughout the June–September admissions window in Pakistan.

**Architecture:** Local-first watchlist stored in `StudentProfile.watchlist` (localStorage + Supabase JSONB sync matching existing `marks`/`quiz`/`practice` pattern). Pure functions in `watchlist.ts` for add/remove/update/computeGap. Server API routes for change detection (reads curated `universities.json`) and email notification (Resend). Dashboard section renders cards per watched program with color-coded gap indicator. Merit page gets "Track" buttons on each table row.

**Tech Stack:** Next.js 16.3.2, React 19, TypeScript, Supabase (auth + profiles), Resend (email), vitest, Tailwind 4, class-variance-authority (badge variants)

---

### Task 1: Core lib — watchlist.ts pure functions + tests

**Files:**
- Create: `src/lib/watchlist.ts`
- Create: `src/lib/watchlist.test.ts`

This task builds all pure business logic with zero React/API dependencies. Every function is testable in isolation.

- [ ] **Step 1: Write the failing test file**

```typescript
// src/lib/watchlist.test.ts
import { describe, expect, it } from "vitest";
import {
  addEntry,
  computeGap,
  findProgram,
  removeEntry,
  updateEntry,
  type WatchlistEntry,
} from "./watchlist";
import type { University } from "./types";

const mockUnis: University[] = [
  {
    id: "nust",
    name: "NUST",
    short: "NUST",
    city: "Islamabad",
    type: "public",
    category: "engineering",
    streams: ["pre-engineering", "ics"],
    programs: [
      { name: "CS", closingMerit: 80, year: "2024" },
      { name: "EE", closingMerit: 77, year: "2024" },
      { name: "NoMerit", year: "2023" },
    ],
    formulas: { note: "", components: [], eligibility: [] },
    entryTest: "NET",
    source_url: "",
  },
];

function makeEntry(overrides: Partial<WatchlistEntry> = {}): WatchlistEntry {
  return {
    id: "wl_test",
    type: "university",
    universityId: "nust",
    programName: "CS",
    capturedMerit: 80,
    capturedYear: "2024",
    capturedAt: "2026-08-01T00:00:00.000Z",
    lastKnownMerit: 80,
    lastCheckedAt: "2026-08-01T00:00:00.000Z",
    myMerit: 78,
    myStream: "pre-engineering",
    notifyEmail: true,
    lastNotifiedAt: null,
    ...overrides,
  };
}

describe("addEntry", () => {
  it("creates an entry with correct snapshot fields", () => {
    const [entry] = addEntry([], { universityId: "nust", programName: "CS", myMerit: 78, myStream: "pre-engineering" }, mockUnis);
    expect(entry.type).toBe("university");
    expect(entry.universityId).toBe("nust");
    expect(entry.programName).toBe("CS");
    expect(entry.capturedMerit).toBe(80);
    expect(entry.capturedYear).toBe("2024");
    expect(entry.myMerit).toBe(78);
    expect(entry.myStream).toBe("pre-engineering");
    expect(entry.notifyEmail).toBe(true);
    expect(entry.lastNotifiedAt).toBeNull();
    expect(entry.id).toMatch(/^wl_/);
    expect(entry.capturedAt).toBeTruthy();
  });

  it("generates a unique id", () => {
    const [a] = addEntry([], { universityId: "nust", programName: "CS", myMerit: 78 }, mockUnis);
    const [b] = addEntry([], { universityId: "nust", programName: "EE", myMerit: 78 }, mockUnis);
    expect(a.id).not.toBe(b.id);
  });

  it("deduplicates — updates existing entry instead of adding a duplicate", () => {
    const existing = makeEntry();
    const [result] = addEntry([existing], { universityId: "nust", programName: "CS", myMerit: 85, myStream: "pre-engineering" }, mockUnis);
    expect(result.id).toBe(existing.id);
    expect(result.myMerit).toBe(85);
    expect(result.capturedAt).not.toBe(existing.capturedAt);
  });

  it("returns original array when program is not found", () => {
    const result = addEntry([], { universityId: "nust", programName: "NONEXISTENT", myMerit: 78 }, mockUnis);
    expect(result).toEqual([]);
  });
});

describe("removeEntry", () => {
  it("removes the entry with matching id", () => {
    const a = makeEntry({ id: "wl_a" });
    const b = makeEntry({ id: "wl_b" });
    expect(removeEntry([a, b], "wl_a")).toEqual([b]);
  });

  it("returns the same array if id not found", () => {
    const a = makeEntry({ id: "wl_a" });
    expect(removeEntry([a], "wl_x")).toEqual([a]);
  });
});

describe("updateEntry", () => {
  it("patches fields on the matching entry", () => {
    const entry = makeEntry();
    const [updated] = updateEntry([entry], "wl_test", { lastKnownMerit: 82, notifyEmail: false });
    expect(updated.lastKnownMerit).toBe(82);
    expect(updated.notifyEmail).toBe(false);
    expect(updated.capturedMerit).toBe(80); // unchanged
  });
});

describe("computeGap", () => {
  it("returns safe when gap >= 0", () => {
    expect(computeGap(85, 80)).toBe("safe");
    expect(computeGap(80, 80)).toBe("safe");
  });

  it("returns tight when -5 <= gap < 0", () => {
    expect(computeGap(76, 80)).toBe("tight");
    expect(computeGap(75, 80)).toBe("tight");
  });

  it("returns reach when gap < -5", () => {
    expect(computeGap(74, 80)).toBe("reach");
    expect(computeGap(0, 80)).toBe("reach");
  });

  it("returns null when either merit is null", () => {
    expect(computeGap(null, 80)).toBeNull();
    expect(computeGap(80, null)).toBeNull();
    expect(computeGap(null, null)).toBeNull();
  });
});

describe("findProgram", () => {
  it("finds a program by id and name and returns merit + year", () => {
    const result = findProgram(mockUnis, "nust", "CS");
    expect(result).toEqual({ closingMerit: 80, year: "2024" });
  });

  it("returns null for unknown university", () => {
    expect(findProgram(mockUnis, "xxx", "CS")).toBeNull();
  });

  it("returns null for unknown program", () => {
    expect(findProgram(mockUnis, "nust", "AI")).toBeNull();
  });

  it("returns null for program with no closingMerit", () => {
    const result = findProgram(mockUnis, "nust", "NoMerit");
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/watchlist.test.ts`
Expected: FAIL — all tests fail with "does not provide an export" or module resolution errors.

- [ ] **Step 3: Write the minimal implementation**

```typescript
// src/lib/watchlist.ts
import type { University } from "./types";

export interface WatchlistEntry {
  id: string;
  type: "university";
  universityId: string;
  programName: string;
  capturedMerit: number | null;
  capturedYear: string | null;
  capturedAt: string;
  lastKnownMerit: number | null;
  lastCheckedAt: string | null;
  myMerit: number | null;
  myStream: string | null;
  notifyEmail: boolean;
  lastNotifiedAt: string | null;
}

export interface AddEntryInput {
  universityId: string;
  programName: string;
  myMerit: number | null;
  myStream: string | null;
}

let _counter = 0;
function uid(): string {
  _counter++;
  return `wl_${Date.now()}_${_counter}`;
}

export function addEntry(
  watchlist: WatchlistEntry[],
  input: AddEntryInput,
  universities: University[]
): WatchlistEntry[] {
  const uni = universities.find((u) => u.id === input.universityId);
  if (!uni) return watchlist;
  const prog = uni.programs.find((p) => p.name === input.programName);
  if (!prog) return watchlist;

  const existing = watchlist.find(
    (e) => e.universityId === input.universityId && e.programName === input.programName
  );
  const now = new Date().toISOString();

  const entry: WatchlistEntry = {
    id: existing?.id ?? uid(),
    type: "university",
    universityId: input.universityId,
    programName: input.programName,
    capturedMerit: prog.closingMerit ?? null,
    capturedYear: prog.year ?? null,
    capturedAt: now,
    lastKnownMerit: existing?.lastKnownMerit ?? prog.closingMerit ?? null,
    lastCheckedAt: existing?.lastCheckedAt ?? now,
    myMerit: input.myMerit,
    myStream: input.myStream ?? null,
    notifyEmail: existing?.notifyEmail ?? true,
    lastNotifiedAt: existing?.lastNotifiedAt ?? null,
  };

  if (existing) {
    return watchlist.map((e) => (e.id === existing.id ? entry : e));
  }
  return [...watchlist, entry];
}

export function removeEntry(watchlist: WatchlistEntry[], id: string): WatchlistEntry[] {
  return watchlist.filter((e) => e.id !== id);
}

export function updateEntry(
  watchlist: WatchlistEntry[],
  id: string,
  patch: Partial<WatchlistEntry>
): WatchlistEntry[] {
  return watchlist.map((e) => (e.id === id ? { ...e, ...patch } : e));
}

export function computeGap(
  myMerit: number | null,
  closingMerit: number | null
): "safe" | "tight" | "reach" | null {
  if (myMerit === null || closingMerit === null) return null;
  const gap = myMerit - closingMerit;
  if (gap >= 0) return "safe";
  if (gap >= -5) return "tight";
  return "reach";
}

export function findProgram(
  universities: University[],
  universityId: string,
  programName: string
): { closingMerit: number; year: string } | null {
  const uni = universities.find((u) => u.id === universityId);
  if (!uni) return null;
  const prog = uni.programs.find((p) => p.name === programName);
  if (!prog || prog.closingMerit === undefined) return null;
  return { closingMerit: prog.closingMerit, year: prog.year ?? "" };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/watchlist.test.ts`
Expected: PASS — all 14 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/watchlist.ts src/lib/watchlist.test.ts
git commit -m "feat(watchlist): add core lib with pure functions and tests"
```

---

### Task 2: Types + Store integration + Supabase migration

**Files:**
- Modify: `src/lib/types.ts` (add `WatchlistEntry` re-export)
- Modify: `src/lib/store.tsx` (add `watchlist` to `StudentProfile`)
- Modify: `supabase/schema.sql` (add watchlist column)

- [ ] **Step 1: Update types.ts to re-export WatchlistEntry**

Add to `src/lib/types.ts` (append before the final newline or after the last export, near line 350):

```typescript
export type { WatchlistEntry } from "./watchlist";
```

- [ ] **Step 2: Extend StudentProfile in store.tsx**

Add `watchlist` to the import at line 4 and to the interface + defaultProfile:

Replace line 4:
```typescript
import type { Marks, PracticeAttempt, QuizAnswers, Stream, WatchlistEntry } from "@/lib/types";
```

Add to `StudentProfile` interface (after `practice: PracticeAttempt[];`):
```typescript
  watchlist: WatchlistEntry[];
```

Add to `defaultProfile` (after `practice: [],`):
```typescript
  watchlist: [],
```

- [ ] **Step 3: Add Supabase migration to schema.sql**

Append at end of `supabase/schema.sql`:

```sql
-- Migration for University Watchlist feature:
alter table public.profiles add column if not exists watchlist jsonb default '[]'::jsonb;
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/store.tsx supabase/schema.sql
git commit -m "feat(watchlist): add WatchlistEntry type, store integration, and Supabase migration"
```

---

### Task 3: API route — POST /api/watchlist/sync

**Files:**
- Create: `src/app/api/watchlist/sync/route.ts`

This route persists the client-side watchlist array to Supabase on every mutation. Matches the local-first pattern: write to localStorage first, sync to server after.

- [ ] **Step 1: Create the sync route**

```typescript
// src/app/api/watchlist/sync/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const watchlist = body.watchlist;

    if (!Array.isArray(watchlist)) {
      return NextResponse.json({ error: "watchlist must be an array" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profiles")
      .update({ watchlist })
      .eq("id", session.user.id);

    if (error) {
      console.error("watchlist sync error", error);
      return NextResponse.json({ error: "Sync failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("watchlist sync error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0, no type errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/watchlist/sync/route.ts
git commit -m "feat(watchlist): add POST /api/watchlist/sync route"
```

---

### Task 4: API routes — check + notify

**Files:**
- Create: `src/app/api/watchlist/check/route.ts`
- Create: `src/app/api/watchlist/notify/route.ts`

The check route compares each watched entry against `universities.json` — no external calls, ~5ms. The notify route sends email via Resend with server-side rate limiting (24h cooldown).

- [ ] **Step 1: Create the check route**

```typescript
// src/app/api/watchlist/check/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findProgram } from "@/lib/watchlist";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const watchlistParam = url.searchParams.get("watchlist");
    if (!watchlistParam) {
      return NextResponse.json({ error: "watchlist query param required" }, { status: 400 });
    }

    let watchlist: unknown[];
    try {
      watchlist = JSON.parse(watchlistParam);
    } catch {
      return NextResponse.json({ error: "watchlist must be valid JSON array" }, { status: 400 });
    }

    if (!Array.isArray(watchlist)) {
      return NextResponse.json({ error: "watchlist must be an array" }, { status: 400 });
    }

    const unis = universities as unknown as University[];
    const entries = watchlist.map((entry: unknown) => {
      const e = entry as { id: string; universityId: string; programName: string; lastKnownMerit: number | null };
      const current = findProgram(unis, e.universityId, e.programName);
      return {
        id: e.id,
        currentMerit: current?.closingMerit ?? null,
        currentYear: current?.year ?? null,
        yearChanged: current?.year ? e.lastKnownMerit !== null && current.closingMerit !== e.lastKnownMerit : false,
        // meritChanged is true when closingMerit differs from lastKnownMerit AND they're both non-null
        meritChanged: current?.closingMerit !== undefined && current.closingMerit !== null && e.lastKnownMerit !== null && current.closingMerit !== e.lastKnownMerit,
      };
    });

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("watchlist check error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the notify route**

```typescript
// src/app/api/watchlist/notify/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Server-side rate limit check: 24h cooldown per entry
function isRateLimited(lastNotifiedAt: string | null): boolean {
  if (!lastNotifiedAt) return false;
  const cooldown = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - new Date(lastNotifiedAt).getTime() < cooldown;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!RESEND_API_KEY) {
      return NextResponse.json({ sent: false, reason: "email-not-configured" });
    }

    const body = await req.json();
    const { entryId, currentMerit, previousMerit, programName, universityName, lastNotifiedAt } = body;

    if (!entryId || !programName || !universityName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Server-side rate limit check
    if (isRateLimited(lastNotifiedAt)) {
      return NextResponse.json({ sent: false, reason: "rate-limited" });
    }

    const userEmail = session.user.email;
    if (!userEmail) {
      return NextResponse.json({ error: "User has no email" }, { status: 400 });
    }

    // Send email via Resend
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Merit Alerts <watchlist@aftermediate.vercel.app>",
        to: userEmail,
        subject: `🔔 Merit update: ${universityName} — ${programName}`,
        html: `
          <p>Your watchlist program has a new merit list:</p>
          <table style="border-collapse:collapse;margin:16px 0;font-family:monospace;">
            <tr><td style="padding:4px 12px 4px 0;color:#666;">Program</td><td style="font-weight:bold;">${universityName} — ${programName}</td></tr>
            ${previousMerit !== null && previousMerit !== undefined ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Previous merit</td><td>${previousMerit}%</td></tr>` : ""}
            <tr><td style="padding:4px 12px 4px 0;color:#666;">New merit</td><td style="font-weight:bold;">${currentMerit}%</td></tr>
          </table>
          <p><a href="https://aftermediate.vercel.app/dashboard" style="color:#7a5bd4;">Log in to see your full watchlist →</a></p>
        `,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error("resend error", errText);
      return NextResponse.json({ sent: false, reason: "email-failed" });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("watchlist notify error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add RESEND_API_KEY to .env.local**

```bash
echo "" >> /home/themz/aftermediate/.env.local
echo "# Resend API key for watchlist email notifications" >> /home/themz/aftermediate/.env.local
echo "RESEND_API_KEY=" >> /home/themz/aftermediate/.env.local
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/watchlist/check/route.ts src/app/api/watchlist/notify/route.ts .env.local
git commit -m "feat(watchlist): add check and notify API routes with Resend email"
```

---

### Task 5: Dashboard watchlist section + card components

**Files:**
- Create: `src/components/watchlist/watchlist-section.tsx`
- Create: `src/components/watchlist/watchlist-card.tsx`
- Create: `src/components/watchlist/notification-badge.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx` (import and render WatchlistSection)

The watchlist section mounts on the dashboard, fetches current merit data from the check API, and renders color-coded cards sorted by urgency (tight → reach → safe).

- [ ] **Step 1: Create the notification badge component**

```typescript
// src/components/watchlist/notification-badge.tsx
"use client";

export function NotificationBadge() {
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-saffron px-1 text-[10px] font-bold text-white shadow-sm">
      NEW
    </span>
  );
}
```

- [ ] **Step 2: Create the watchlist card component**

```typescript
// src/components/watchlist/watchlist-card.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { NotificationBadge } from "./notification-badge";
import { computeGap } from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/watchlist";

interface WatchlistCardProps {
  entry: WatchlistEntry;
  currentMerit: number | null;
  currentYear: string | null;
  changed: boolean;
  onRefresh: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleEmail: (id: string, enabled: boolean) => void;
  universityName: string;
}

export function WatchlistCard({
  entry,
  currentMerit,
  changed,
  onRefresh,
  onRemove,
  onToggleEmail,
  universityName,
}: WatchlistCardProps) {
  const gap = computeGap(entry.myMerit, currentMerit ?? entry.lastKnownMerit);

  const gapColor =
    gap === "safe" ? "bg-emerald" : gap === "tight" ? "bg-saffron" : gap === "reach" ? "bg-danger" : "bg-line";

  const gapLabel =
    gap === "safe"
      ? `safe (+${(entry.myMerit! - (currentMerit ?? entry.lastKnownMerit!)).toFixed(1)})`
      : gap === "tight"
        ? `tight (${(entry.myMerit! - (currentMerit ?? entry.lastKnownMerit!)).toFixed(1)})`
        : gap === "reach"
          ? `reach (${(entry.myMerit! - (currentMerit ?? entry.lastKnownMerit!)).toFixed(1)})`
          : "—";

  const displayMerit = currentMerit ?? entry.lastKnownMerit;

  const lastCheckedLabel = entry.lastCheckedAt
    ? (() => {
        const diff = Date.now() - new Date(entry.lastCheckedAt).getTime();
        if (diff < 60_000) return "moments ago";
        if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
        if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
        return `${Math.floor(diff / 86_400_000)}d ago`;
      })()
    : "never";

  return (
    <div className="relative flex rounded-2xl border-2 border-ink bg-surface pixel-shadow">
      {/* Color strip */}
      <div className={`w-2 shrink-0 rounded-l-2xl ${gapColor}`} />

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-ink">{universityName}</p>
            <p className="text-xs text-muted">{entry.programName}</p>
          </div>
          <div className="flex items-center gap-2">
            {changed && <NotificationBadge />}
            <button
              onClick={() => onToggleEmail(entry.id, !entry.notifyEmail)}
              className="relative text-faint hover:text-ink transition-colors"
              aria-label={entry.notifyEmail ? "Disable email alerts" : "Enable email alerts"}
            >
              {entry.notifyEmail ? "🔔" : "🔕"}
            </button>
            <button
              onClick={() => onRemove(entry.id)}
              className="text-faint hover:text-danger transition-colors"
              aria-label={`Remove ${entry.programName} from watchlist`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Merit comparison */}
        <div className="flex items-baseline gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">Closing</span>
            <span className="font-mono text-lg font-bold text-ink">
              {displayMerit !== null ? `${displayMerit}%` : "—"}
            </span>
            {entry.capturedYear && (
              <span className="text-[10px] text-faint">{entry.capturedYear}</span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-faint">My merit</span>
            <span className="font-mono text-base text-ink">
              {entry.myMerit !== null ? `${entry.myMerit}%` : "—"}
            </span>
          </div>
          {gap !== null && (
            <Badge
              variant={
                gap === "safe" ? "emerald" : gap === "tight" ? "saffron" : "danger"
              }
              className="font-mono"
            >
              {gapLabel}
            </Badge>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between text-[11px] text-faint">
          <span>Updated {lastCheckedLabel}</span>
          <button
            onClick={() => onRefresh(entry.id)}
            className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-surface-2 transition-colors"
          >
            Refresh now
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create the watchlist section component**

```typescript
// src/components/watchlist/watchlist-section.tsx
"use client";

import * as React from "react";
import { useStudent } from "@/lib/store";
import { removeEntry, updateEntry } from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/watchlist";
import { WatchlistCard } from "./watchlist-card";
import { ProgramSearch } from "./program-search";
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";

const UNIS = universities as unknown as University[];

interface CheckResult {
  id: string;
  currentMerit: number | null;
  currentYear: string | null;
  yearChanged: boolean;
  meritChanged: boolean;
}

function uniNameFor(id: string): string {
  return UNIS.find((u) => u.id === id)?.short ?? id;
}

export function WatchlistSection() {
  const { profile, update } = useStudent();
  const watchlist = profile.watchlist ?? [];
  const [checkResults, setCheckResults] = React.useState<Map<string, CheckResult>>(new Map());
  const [syncing, setSyncing] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  // Fetch current merit data on mount and periodically
  const doCheck = React.useCallback(async () => {
    if (watchlist.length === 0) return;
    try {
      const res = await fetch(`/api/watchlist/check?watchlist=${encodeURIComponent(JSON.stringify(watchlist))}`);
      if (!res.ok) return;
      const data = await res.json() as { entries: CheckResult[] };
      const map = new Map<string, CheckResult>();
      for (const e of data.entries) map.set(e.id, e);
      setCheckResults(map);

      // Update lastCheckedAt for all entries
      const now = new Date().toISOString();
      const updated = watchlist.map((entry) => {
        const result = map.get(entry.id);
        return result
          ? { ...entry, lastKnownMerit: result.currentMerit ?? entry.lastKnownMerit, lastCheckedAt: now }
          : entry;
      });
      update({ watchlist: updated });

      // Fire notifications for changed entries
      for (const entry of watchlist) {
        const result = map.get(entry.id);
        if (result?.meritChanged && entry.notifyEmail) {
          fetch("/api/watchlist/notify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              entryId: entry.id,
              currentMerit: result.currentMerit,
              previousMerit: entry.lastKnownMerit,
              programName: entry.programName,
              universityName: uniNameFor(entry.universityId),
              lastNotifiedAt: entry.lastNotifiedAt,
            }),
          }).then((r) => {
            if (r.ok) r.json().then((d) => {
              if (d.sent) {
                const patched = watchlist.map((e) =>
                  e.id === entry.id ? { ...e, lastNotifiedAt: new Date().toISOString() } : e
                );
                update({ watchlist: patched });
              }
            });
          }).catch(() => {
            // notify failure is non-blocking
          });
        }
      }
    } catch {
      // check failure is non-blocking
    }
  }, [watchlist, update]);

  React.useEffect(() => {
    doCheck();
    const interval = setInterval(doCheck, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(interval);
  }, [doCheck]);

  const syncToServer = React.useCallback(async (updated: WatchlistEntry[]) => {
    setSyncing(true);
    try {
      await fetch("/api/watchlist/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchlist: updated }),
      });
    } catch {
      // sync failure is non-blocking — next login will hydrate
    } finally {
      setSyncing(false);
    }
  }, []);

  const handleAdd = React.useCallback((added: WatchlistEntry) => {
    const updated = [...watchlist, added];
    update({ watchlist: updated });
    syncToServer(updated);
  }, [watchlist, update, syncToServer]);

  const handleRemove = React.useCallback((id: string) => {
    const updated = removeEntry(watchlist, id);
    update({ watchlist: updated });
    syncToServer(updated);
  }, [watchlist, update, syncToServer]);

  const handleToggleEmail = React.useCallback((id: string, enabled: boolean) => {
    const updated = updateEntry(watchlist, id, { notifyEmail: enabled });
    update({ watchlist: updated });
    syncToServer(updated);
  }, [watchlist, update, syncToServer]);

  const handleRefresh = React.useCallback((id: string) => {
    doCheck();
  }, [doCheck]);

  // Sort: tight → reach → safe → unknown
  const sorted = React.useMemo(() => {
    const withGap = watchlist.map((e) => {
      const result = checkResults.get(e.id);
      const currentMerit = result?.currentMerit ?? e.lastKnownMerit;
      const gap = e.myMerit !== null && currentMerit !== null ? e.myMerit - currentMerit : null;
      return { entry: e, gap, changed: result?.meritChanged ?? false, currentMerit, currentYear: result?.currentYear ?? null };
    });

    const order = (g: number | null): number => {
      if (g === null || g === undefined) return 3; // unknown last
      if (g < -5) return 0; // reach first
      if (g < 0) return 1; // tight second
      return 2; // safe third
    };

    withGap.sort((a, b) => order(a.gap) - order(b.gap));
    return withGap;
  }, [watchlist, checkResults]);

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-ink">Merit Watchlist</p>
          {watchlist.length > 0 && (
            <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold text-emerald">
              {watchlist.length} tracked
            </span>
          )}
          {syncing && (
            <span className="text-[10px] text-faint">syncing...</span>
          )}
        </div>
        <button
          onClick={() => setShowSearch(true)}
          className="rounded-lg border border-saffron/30 px-3 py-1.5 text-[11px] font-semibold text-saffron hover:bg-saffron/10 transition-colors"
        >
          + Track new program
        </button>
      </div>

      {watchlist.length === 0 ? (
        <div className="mt-6 text-center">
          <p className="text-3xl">🎯</p>
          <p className="mt-2 text-sm text-muted">
            Start by tracking your target programs from the Merit page or the search above.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sorted.map(({ entry, changed, currentMerit, currentYear }) => (
            <WatchlistCard
              key={entry.id}
              entry={entry}
              currentMerit={currentMerit}
              currentYear={currentYear}
              changed={changed}
              onRefresh={handleRefresh}
              onRemove={handleRemove}
              onToggleEmail={handleToggleEmail}
              universityName={uniNameFor(entry.universityId)}
            />
          ))}
        </div>
      )}

      {showSearch && (
        <ProgramSearch
          watchlist={watchlist}
          onAdd={handleAdd}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create ProgramSearch component (for inline use in watchlist-section)**

The ProgramSearch component needs to exist as a dependency of watchlist-section, but it will be fleshed out fully in Task 6. For now create a minimal placeholder that enables the Task 5 components to compile:

```typescript
// src/components/watchlist/program-search.tsx
"use client";

import * as React from "react";
import universities from "@/data/universities.json";
import { useStudent } from "@/lib/store";
import { addEntry } from "@/lib/watchlist";
import type { WatchlistEntry } from "@/lib/watchlist";
import type { University, Stream } from "@/lib/types";

const UNIS = universities as unknown as University[];

interface ProgramSearchProps {
  watchlist: WatchlistEntry[];
  onAdd: (entry: WatchlistEntry) => void;
  onClose: () => void;
}

export function ProgramSearch({ watchlist, onAdd, onClose }: ProgramSearchProps) {
  const { profile } = useStudent();
  const stream = (profile.stream ?? "pre-engineering") as Stream;
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    // Filter universities by stream
    const streamUnis = UNIS.filter((u) => u.streams.includes(stream));
    const rows: { uni: University; program: University["programs"][number] }[] = [];
    for (const uni of streamUnis) {
      for (const prog of uni.programs) {
        if (
          !query ||
          uni.short.toLowerCase().includes(query.toLowerCase()) ||
          uni.name.toLowerCase().includes(query.toLowerCase()) ||
          prog.name.toLowerCase().includes(query.toLowerCase())
        ) {
          rows.push({ uni, program: prog });
        }
      }
    }
    // Limit display
    return rows.slice(0, 50);
  }, [stream, query]);

  const tracked = new Set(watchlist.map((e) => `${e.universityId}:${e.programName}`));

  const handleTrack = (uniId: string, progName: string) => {
    const result = addEntry(watchlist, {
      universityId: uniId,
      programName: progName,
      myMerit: profile.marks.fscObtained > 0 ? (profile.marks.fscObtained / profile.marks.fscTotal) * 100 : null,
      myStream: stream,
    }, UNIS);
    const added = result.find((e) => e.universityId === uniId && e.programName === progName);
    if (added) onAdd(added);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/60 pt-20 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border-2 border-ink bg-surface p-5 pixel-shadow">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">Track a program</p>
          <button onClick={onClose} className="text-faint hover:text-ink transition-colors" aria-label="Close search">
            ✕
          </button>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search universities or programs..."
          className="mt-3 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-violet/50"
          autoFocus
        />

        <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-faint">No programs found.</p>
          ) : (
            filtered.map(({ uni, program }) => {
              const key = `${uni.id}:${program.name}`;
              const isTracked = tracked.has(key);
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-surface-2 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{uni.short}</p>
                    <p className="text-xs text-muted">{program.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {program.closingMerit !== undefined && (
                      <span className="font-mono text-xs text-faint">{program.closingMerit}%</span>
                    )}
                    {isTracked ? (
                      <span className="rounded-lg border border-emerald/30 px-2.5 py-1 text-[11px] font-medium text-emerald">
                        Tracking ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => handleTrack(uni.id, program.name)}
                        className="rounded-lg border border-violet/30 px-2.5 py-1 text-[11px] font-medium text-violet hover:bg-violet/10 transition-colors"
                      >
                        Track
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update dashboard page to render watchlist section**

Add the import after `import { RahbarBanner }` (line 11):
```typescript
import { WatchlistSection } from "@/components/watchlist/watchlist-section";
```

Add the WatchlistSection after `</RahbarBanner>` wrapper (after line 68), inside the outer `<div>`:
```typescript
      <div className="mt-4 animate-reveal" style={{ animationDelay: "480ms" }}>
        <WatchlistSection />
      </div>
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/watchlist/watchlist-card.tsx src/components/watchlist/watchlist-section.tsx src/components/watchlist/program-search.tsx src/components/watchlist/notification-badge.tsx src/app/(app)/dashboard/page.tsx
git commit -m "feat(watchlist): add dashboard watchlist section with cards and search"
```

---

### Task 6: Merit page "Track" button integration

**Files:**
- Modify: `src/app/(app)/merit/page.tsx` (add Track button to the "Where does that land?" table)

Each row in the program comparison table gets a "Track" button. Already-tracked programs show "Tracking" (disabled).

- [ ] **Step 1: Add imports to merit page**

Add to the existing imports (after line 12):
```typescript
import { WatchlistEntry, addEntry } from "@/lib/watchlist";
```

- [ ] **Step 2: Add watched programs set to the merit page component**

Inside the `MeritPage` function, after the `unis` declaration (after line 52), add:
```typescript
const watchlist: WatchlistEntry[] = profile.watchlist ?? [];
const tracked = new Set(watchlist.map((e) => `${e.universityId}:${e.programName}`));
```

- [ ] **Step 3: Add "Track" column to the table header**

Replace line 143 (`<th className="py-3">Your chance</th>`) with:
```typescript
                  <th className="py-3">Your chance</th>
                  <th className="py-3 pl-4"></th>
```

- [ ] **Step 4: Add "Track" button cell to each table row**

After the `<td>` with the `Badge` (the `your chance` cell, currently lines 155-165), add:
```typescript
                      <td className="py-3 pl-4">
                        {(() => {
                          const key = `${u.id}:${p.name}`;
                          if (tracked.has(key)) {
                            return <span className="text-[11px] font-medium text-emerald">Tracking ✓</span>;
                          }
                          return (
                            <button
                              onClick={() => {
                                const result = addEntry(watchlist, {
                                  universityId: u.id,
                                  programName: p.name,
                                  myMerit: results[0]?.value ?? null,
                                  myStream: stream,
                                }, UNIS);
                                const added = result.find(
                                  (e) => e.universityId === u.id && e.programName === p.name
                                );
                                if (added) {
                                  const updated = [...watchlist, added];
                                  update({ watchlist: updated });
                                  // Sync to server
                                  fetch("/api/watchlist/sync", {
                                    method: "POST",
                                    headers: { "content-type": "application/json" },
                                    body: JSON.stringify({ watchlist: updated }),
                                  }).catch(() => {});
                                }
                              }}
                              className="rounded-lg border border-violet/30 px-2 py-1 text-[11px] font-medium text-violet hover:bg-violet/10 transition-colors"
                            >
                              Track
                            </button>
                          );
                        })()}
                      </td>
```

- [ ] **Step 5: Import universities data for addEntry**

The `addEntry` and `WatchlistEntry` imports were added by Step 1 above. This step adds the universities data import needed by the `addEntry` call. Add after line 10 (`import { ... } from "@/lib/data";`):
```typescript
import universities from "@/data/universities.json";
import type { University } from "@/lib/types";
```

And add the cast after the existing `const stream` declaration:
```typescript
const UNIS = universities as unknown as University[];
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/app/(app)/merit/page.tsx
git commit -m "feat(watchlist): add Track button to merit page table"
```

---

### Task 7: Verification pass

**Files:** All files from Tasks 1-6.

Run all verification gates and confirm the feature is production-ready.

- [ ] **Step 1: Run watchlist unit tests**

Run: `npx vitest run src/lib/watchlist.test.ts`
Expected: PASS — 14 tests passing.

- [ ] **Step 2: Run entire test suite**

Run: `npm test`
Expected: All tests pass (existing ones may have pre-existing failures; verify no NEW failures).

- [ ] **Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: exit 0, no type errors.

- [ ] **Step 4: ESLint check**

Run: `npx eslint src/lib/watchlist.ts src/lib/watchlist.test.ts src/components/watchlist/ src/app/api/watchlist/`
Expected: exit 0, no lint errors.

- [ ] **Step 5: Build check**

Run: `npx next build`
Expected: Success — all routes compile without errors.

- [ ] **Step 6: Commit any lint/build fixes if needed, then final commit**

```bash
git add -A
git commit -m "chore(watchlist): verification pass — all gates green"
```

- [ ] **Step 7: Print summary for user**

Echo a completion summary with file counts and gate results.