# "Your Voice" Feedback & Wishlist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Your Voice" guided feedback page at `/feedback` — a 4-step animated wizard (mood → rating → story → wishlist), celebration screen with confetti + share card, real Supabase persistence, and a community wishlist wall with voting.

**Architecture:** Rule-based sentiment engine in `src/lib/feedback-model.ts` (pure, deterministic, tested); Supabase data layer in `src/lib/feedback-api.ts` (browser client); wizard orchestrator `feedback-journey.tsx` owns step state and submission; page shell + wall render below. Follows the established patterns: pure lib functions like `resume-model.ts`, dark island `#09090B` panel + warm shell like `/builder`, `useStudent()` from `store.tsx`, vitest with `@` alias.

**Tech Stack:** Next.js 16 App Router (Turbopack), React 19, TypeScript strict, Tailwind 4, vitest 4, lucide-react, @supabase/ssr, canvas-confetti (new), html2canvas + html2pdf.js (share card), Web Speech API (voice input, feature-detected).

**Design spec:** `docs/superpowers/specs/2026-08-31-voice-feedback-design.md`

---

## Task 1: Sentiment Engine — `src/lib/feedback-model.ts`

**Files:**
- Create: `src/lib/feedback-model.ts`
- Test: `src/lib/feedback-model.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/feedback-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  analyzeSentiment,
  CLOSINGS,
  mediaKindFor,
  PERSONAS,
  PRIORITIES,
  TONE_META,
  validateMedia,
} from "./feedback-model";

describe("constants", () => {
  it("exposes 5 tone levels with icons in order", () => {
    expect(TONE_META).toHaveLength(5);
    expect(TONE_META.map((t) => t.icon)).toEqual(["Laugh", "Smile", "Meh", "Frown", "Angry"]);
    expect(TONE_META.map((t) => t.label)).toEqual([
      "Loved it", "Liked it", "Meh", "Disappointed", "Frustrated",
    ]);
  });

  it("exposes 4 personas", () => {
    expect(PERSONAS.map((p) => p.id)).toEqual(["students", "professionals", "beginners", "educators"]);
  });

  it("exposes p0/p1/p2 priorities", () => {
    expect(PRIORITIES.map((p) => p.id)).toEqual(["p0", "p1", "p2"]);
  });

  it("has a closing message for every tone", () => {
    for (const t of TONE_META) {
      expect(CLOSINGS[t.id]).toBeTruthy();
    }
  });
});

describe("analyzeSentiment", () => {
  it("maps tone base scores to tags", () => {
    expect(analyzeSentiment("loved", 10).tag).toBe("highly-positive");
    expect(analyzeSentiment("frustrated", 0).tag).toBe("critical");
  });

  it("shifts score by rating (full 40-point swing)", () => {
    const low = analyzeSentiment("meh", 0).score;
    const high = analyzeSentiment("meh", 10).score;
    expect(high - low).toBe(40);
  });

  it("boosts with positive lexicon", () => {
    expect(analyzeSentiment("meh", 10, "amazing incredible fantastic awesome").tag).toBe("highly-positive");
  });

  it("penalizes with negative lexicon", () => {
    expect(analyzeSentiment("frustrated", 5, "broken and confusing").score).toBeLessThanOrEqual(10);
  });

  it("applies a constructive-cue penalty", () => {
    const plain = analyzeSentiment("liked", 5, "it was great");
    const cued = analyzeSentiment("liked", 5, "it was great but could improve");
    expect(cued.score).toBeLessThan(plain.score);
  });

  it("clamps score to 0..100", () => {
    expect(analyzeSentiment("loved", 10, "amazing incredible fantastic").score).toBe(100);
    expect(analyzeSentiment("frustrated", 0, "terrible awful useless").score).toBe(0);
  });

  it("uses 85/60/40 tag boundaries", () => {
    expect(analyzeSentiment("loved", 5).score).toBeGreaterThanOrEqual(85);
    expect(analyzeSentiment("liked", 5).score).toBe(70);
    expect(analyzeSentiment("meh", 5).score).toBe(50);
    expect(analyzeSentiment("disappointed", 5).score).toBe(30);
  });

  it("summarizes with rating extremes first", () => {
    expect(analyzeSentiment("meh", 9, "whatever").summary).toBe("Rated 9/10");
    expect(analyzeSentiment("meh", 2, "whatever").summary).toBe("Rated 2/10");
  });

  it("summarizes with the first lexicon phrase", () => {
    const s = analyzeSentiment("meh", 5, "the mentor matching was amazing and I loved it");
    expect(s.summary).toContain("amazing");
    expect(s.summary.split(" ").length).toBeLessThanOrEqual(8);
  });

  it("falls back to a tone summary", () => {
    expect(analyzeSentiment("loved", 5, "nothing special here").summary).toBe("Shared a loved experience");
  });
});

describe("media validation", () => {
  it("detects media kinds", () => {
    expect(mediaKindFor({ type: "image/png" })).toBe("image");
    expect(mediaKindFor({ type: "video/mp4" })).toBe("video");
    expect(mediaKindFor({ type: "audio/mpeg" })).toBe("audio");
    expect(mediaKindFor({ type: "application/pdf" })).toBeNull();
  });

  it("rejects unsupported file types", () => {
    const r = validateMedia({ type: "application/pdf", size: 10 } as File);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Unsupported");
  });

  it("enforces image 5MB limit", () => {
    expect(validateMedia({ type: "image/png", size: 6 * 1024 * 1024 } as File).ok).toBe(false);
    expect(validateMedia({ type: "image/png", size: 4 * 1024 * 1024 } as File).ok).toBe(true);
  });

  it("allows video and audio up to 25MB", () => {
    expect(validateMedia({ type: "video/mp4", size: 25 * 1024 * 1024 } as File).ok).toBe(true);
    expect(validateMedia({ type: "audio/mpeg", size: 25 * 1024 * 1024 + 1 } as File).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/feedback-model.test.ts`
Expected: FAIL — module not found (`feedback-model`).

- [ ] **Step 3: Write the implementation**

Create `src/lib/feedback-model.ts`:

```ts
export const TONE_META = [
  { id: "loved", label: "Loved it", icon: "Laugh", color: "#10B981" },
  { id: "liked", label: "Liked it", icon: "Smile", color: "#3B82F6" },
  { id: "meh", label: "Meh", icon: "Meh", color: "#d99a2b" },
  { id: "disappointed", label: "Disappointed", icon: "Frown", color: "#f97316" },
  { id: "frustrated", label: "Frustrated", icon: "Angry", color: "#d63d3d" },
] as const;

export type ToneId = (typeof TONE_META)[number]["id"];

export const PERSONAS = [
  { id: "students", label: "Students" },
  { id: "professionals", label: "Professionals" },
  { id: "beginners", label: "Beginners" },
  { id: "educators", label: "Educators" },
] as const;
export type PersonaId = (typeof PERSONAS)[number]["id"];

export const PRIORITIES = [
  { id: "p0", label: "P0 — Must have" },
  { id: "p1", label: "P1 — Should have" },
  { id: "p2", label: "P2 — Nice to have" },
] as const;
export type PriorityId = (typeof PRIORITIES)[number]["id"];

export type SentimentTag = "highly-positive" | "positive" | "constructive" | "critical";
export type SentimentResult = { tag: SentimentTag; score: number; summary: string };

const POSITIVE_WORDS = ["amazing", "awesome", "great", "love", "loved", "excellent", "fantastic", "incredible", "helpful", "best"];
const NEGATIVE_WORDS = ["bad", "terrible", "awful", "worst", "hate", "broke", "broken", "confusing", "useless", "disappointing"];
const CONSTRUCTIVE_CUES = ["could improve", "suggestion", "maybe", "but", "however", "would be better"];

const TONE_BASE: Record<ToneId, number> = {
  loved: 85,
  liked: 70,
  meh: 50,
  disappointed: 30,
  frustrated: 15,
};

export function analyzeSentiment(tone: ToneId, rating: number, text = ""): SentimentResult {
  let score = TONE_BASE[tone] + Math.round(((rating - 5) / 5) * 20);
  const lower = text.toLowerCase();
  for (const w of POSITIVE_WORDS) if (lower.includes(w)) score += 4;
  for (const w of NEGATIVE_WORDS) if (lower.includes(w)) score -= 6;
  if (CONSTRUCTIVE_CUES.some((c) => lower.includes(c))) score -= 5;
  score = Math.max(0, Math.min(100, score));
  const tag: SentimentTag = score >= 85 ? "highly-positive" : score >= 60 ? "positive" : score >= 40 ? "constructive" : "critical";
  return { tag, score, summary: summarize(tone, rating, text) };
}

function summarize(tone: ToneId, rating: number, text: string): string {
  if (rating >= 8 || rating <= 3) return `Rated ${rating}/10`;
  const lower = text.toLowerCase();
  const hit = [...POSITIVE_WORDS, ...NEGATIVE_WORDS].find((w) => lower.includes(w));
  if (hit) {
    const words = text.trim().split(/\s+/);
    const idx = words.findIndex((w) => w.toLowerCase().includes(hit));
    if (idx >= 0) return words.slice(idx, idx + 8).join(" ");
  }
  return `Shared a ${tone} experience`;
}

export const MEDIA_RULES = {
  image: { maxBytes: 5 * 1024 * 1024, types: ["image/png", "image/jpeg", "image/webp", "image/gif"] },
  video: { maxBytes: 25 * 1024 * 1024, types: ["video/mp4", "video/webm"] },
  audio: { maxBytes: 25 * 1024 * 1024, types: ["audio/mpeg", "audio/webm", "audio/wav"] },
} as const;
export type MediaKind = keyof typeof MEDIA_RULES;

export function mediaKindFor(file: Pick<File, "type">): MediaKind | null {
  const t = file.type;
  if (MEDIA_RULES.image.types.includes(t)) return "image";
  if (MEDIA_RULES.video.types.includes(t)) return "video";
  if (MEDIA_RULES.audio.types.includes(t)) return "audio";
  return null;
}

export function validateMedia(file: File): { ok: true } | { ok: false; error: string } {
  const kind = mediaKindFor(file);
  if (!kind) return { ok: false, error: `Unsupported file type${file.type ? ` (${file.type})` : ""}` };
  const limit = MEDIA_RULES[kind].maxBytes / (1024 * 1024);
  if (file.size > MEDIA_RULES[kind].maxBytes) return { ok: false, error: `${kind} files must be ${limit}MB or smaller` };
  return { ok: true };
}

export const CLOSINGS: Record<ToneId, string> = {
  loved: "Thank you — your excitement means the world to us.",
  liked: "Thank you — we're glad it landed well.",
  meh: "Thanks for the honesty — that's exactly what helps us improve.",
  disappointed: "We're sorry it fell short — thank you for telling us.",
  frustrated: "We hear you, and we're sorry. Thank you for speaking up.",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/feedback-model.test.ts`
Expected: PASS (all ~18 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/feedback-model.ts src/lib/feedback-model.test.ts
git commit -m "feat: your voice sentiment engine — tone lexicon scoring, media validation, closings"
```

---

## Task 2: Schema SQL + Data Layer

**Files:**
- Modify: `supabase/schema.sql` (append)
- Create: `src/lib/feedback-api.ts`
- Test: `src/lib/feedback-api.test.ts`

- [ ] **Step 1: Append the schema**

Append to `supabase/schema.sql` (after the existing storage section):

```sql
-- ============================================================
-- Your Voice — feedback & feature wishlist
-- ============================================================
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

-- votes counter
create or replace function public.bump_votes_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update public.feature_requests set votes_count = votes_count + 1 where id = new.feature_id;
  elsif tg_op = 'DELETE' then
    update public.feature_requests set votes_count = greatest(0, votes_count - 1) where id = old.feature_id;
  end if;
  return coalesce(new, old);
end; $$ language plpgsql security definer;

drop trigger if exists feature_votes_bump on public.feature_votes;
create trigger feature_votes_bump after insert or delete on public.feature_votes
  for each row execute function public.bump_votes_count();

-- RLS
alter table public.reviews enable row level security;
alter table public.review_media enable row level security;
alter table public.feature_requests enable row level security;
alter table public.feature_votes enable row level security;

create policy "reviews_select" on public.reviews for select using (auth.uid() = user_id or status = 'published');
create policy "reviews_insert_own" on public.reviews for insert with check (auth.uid() = user_id);
create policy "reviews_update_own" on public.reviews for update using (auth.uid() = user_id);
create policy "reviews_delete_own" on public.reviews for delete using (auth.uid() = user_id);

create policy "review_media_select" on public.review_media for select using (
  exists (select 1 from public.reviews r where r.id = review_id and (r.user_id = auth.uid() or r.status = 'published'))
);
create policy "review_media_insert_own" on public.review_media for insert with check (
  exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
);

create policy "feature_requests_select" on public.feature_requests for select using (auth.role() = 'authenticated');
create policy "feature_requests_insert_own" on public.feature_requests for insert with check (auth.uid() = user_id);
create policy "feature_requests_update_own" on public.feature_requests for update using (auth.uid() = user_id);

create policy "feature_votes_select_own" on public.feature_votes for select using (auth.uid() = user_id);
create policy "feature_votes_insert_own" on public.feature_votes for insert with check (auth.uid() = user_id);
create policy "feature_votes_delete_own" on public.feature_votes for delete using (auth.uid() = user_id);

-- Storage bucket for review media
insert into storage.buckets (id, name, public)
values ('review-media', 'review-media', true)
on conflict (id) do nothing;

create policy "review_media_upload_own" on storage.objects
  for insert with check (bucket_id = 'review-media' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "review_media_delete_own" on storage.objects
  for delete using (bucket_id = 'review-media' and auth.uid()::text = (storage.foldername(name))[1]);
```

- [ ] **Step 2: Write the failing data-layer test**

Create `src/lib/feedback-api.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  listFeatureRequests,
  submitFeatureRequest,
  submitReview,
  toggleVote,
} from "./feedback-api";
import type { MediaKind } from "./feedback-model";

const s = vi.hoisted(() => ({
  user: null as null | { id: "u1" },
  reviewResult: { error: null as null | { message: string }, data: null as null | { id: "r1" } },
  voteRow: null as null | { id: "v1" },
  requestRow: { votes_count: 7 },
  uploadError: null as null | { message: string },
  insertError: null as null | { message: string },
  requestRows: [] as Record<string, unknown>[],
  chain: [] as string[],
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: s.user } })),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: s.uploadError })),
      })),
    },
    from: vi.fn((table: string) => {
      s.chain.push(`from:${table}`);
      const q = {
        insert: vi.fn(() => {
          s.chain.push("insert");
          return q;
        }),
        select: vi.fn(() => {
          s.chain.push("select");
          return q;
        }),
        single: vi.fn(async () => {
          s.chain.push("single");
          return table === "reviews" ? s.reviewResult : { data: s.requestRow, error: s.insertError };
        }),
        maybeSingle: vi.fn(async () => {
          s.chain.push("maybeSingle");
          return { data: s.voteRow, error: null };
        }),
        eq: vi.fn(() => {
          s.chain.push("eq");
          return q;
        }),
        delete: vi.fn(() => {
          s.chain.push("delete");
          return q;
        }),
        order: vi.fn(async () => {
          s.chain.push("order");
          return { data: s.requestRows, error: null };
        }),
      };
      return q;
    }),
  }),
}));

beforeEach(() => {
  s.user = { id: "u1" };
  s.reviewResult = { error: null, data: { id: "r1" } };
  s.voteRow = null;
  s.requestRow = { votes_count: 7 };
  s.uploadError = null;
  s.insertError = null;
  s.requestRows = [{ id: "f1", name: "Dark mode", votes_count: 4, status: "open" }];
});

describe("submitReview", () => {
  const payload = {
    tone: "loved" as const,
    rating: 9,
    reviewText: "Great",
    surprised: "",
    mindset: "",
    recommendTo: ["students"],
    sentimentTag: "highly-positive",
    sentimentScore: 92,
  };

  it("rejects when signed out", async () => {
    s.user = null;
    const r = await submitReview(payload, []);
    expect(r.ok).toBe(false);
  });

  it("inserts the review with mapped columns", async () => {
    await submitReview(payload, []);
    expect(s.chain).toContain("from:reviews");
    expect(s.chain).toContain("insert");
    expect(s.chain).toContain("select");
    expect(s.chain).toContain("single");
  });

  it("uploads media and inserts media rows after the review", async () => {
    const file = new File(["x"], "shot.png", { type: "image/png" });
    await submitReview(payload, [{ file, kind: "image" as MediaKind }]);
    expect(s.chain.filter((c) => c === "from:review_media").length).toBe(1);
  });

  it("returns upload errors", async () => {
    s.uploadError = { message: "quota exceeded" };
    const file = new File(["x"], "shot.png", { type: "image/png" });
    const r = await submitReview(payload, [{ file, kind: "image" as MediaKind }]);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("quota exceeded");
  });
});

describe("toggleVote", () => {
  it("inserts a vote when none exists and returns the new count", async () => {
    const r = await toggleVote("f1");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.voted).toBe(true);
      expect(r.count).toBe(7);
    }
  });

  it("deletes the vote when one exists", async () => {
    s.voteRow = { id: "v1" };
    const r = await toggleVote("f1");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.voted).toBe(false);
  });

  it("rejects when signed out", async () => {
    s.user = null;
    expect((await toggleVote("f1")).ok).toBe(false);
  });
});

describe("listFeatureRequests", () => {
  it("filters by status", async () => {
    await listFeatureRequests("open");
    expect(s.chain).toContain("order");
  });
});

describe("submitFeatureRequest", () => {
  it("inserts a feature request", async () => {
    const r = await submitFeatureRequest({ name: "Dark mode", description: "", useCase: "", priority: "p1" });
    expect(r.ok).toBe(true);
    expect(s.chain).toContain("from:feature_requests");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/lib/feedback-api.test.ts`
Expected: FAIL — module not found (`feedback-api`).

- [ ] **Step 4: Write the implementation**

Create `src/lib/feedback-api.ts`:

```ts
import { createClient } from "@/lib/supabase/client";
import type { MediaKind, PriorityId, ToneId } from "./feedback-model";

export type ReviewPayload = {
  tone: ToneId;
  rating: number;
  reviewText: string;
  surprised: string;
  mindset: string;
  recommendTo: string[];
  sentimentTag: string;
  sentimentScore: number;
};

export type ReviewFile = { file: File; kind: MediaKind };

export type FeatureRequest = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  use_case: string;
  priority: PriorityId;
  status: "open" | "planning" | "shipped";
  votes_count: number;
  created_at: string;
};

function extensionFor(kind: MediaKind, name: string): string {
  const ext = name.split(".").pop() ?? "";
  if (ext && ext.length <= 5 && /^[a-z0-9]+$/i.test(ext)) return ext;
  return kind === "image" ? "png" : kind === "video" ? "mp4" : "mpeg";
}

export async function submitReview(
  payload: ReviewPayload,
  files: ReviewFile[]
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to share your voice." };

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      tone: payload.tone,
      rating: payload.rating,
      review_text: payload.reviewText,
      surprised: payload.surprised,
      mindset: payload.mindset,
      recommend_to: payload.recommendTo,
      sentiment_tag: payload.sentimentTag,
      sentiment_score: payload.sentimentScore,
    })
    .select("id")
    .single();

  if (error || !review) return { ok: false, error: error?.message ?? "Could not save your review." };

  for (const m of files) {
    const path = `${user.id}/${crypto.randomUUID()}.${extensionFor(m.kind, m.file.name)}`;
    const { error: upErr } = await supabase.storage.from("review-media").upload(path, m.file);
    if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };
    const { error: mediaErr } = await supabase.from("review_media").insert({
      review_id: review.id,
      url: path,
      media_type: m.kind,
      file_name: m.file.name,
      file_size: m.file.size,
    });
    if (mediaErr) return { ok: false, error: `Media row failed: ${mediaErr.message}` };
  }

  return { ok: true, id: review.id };
}

export async function toggleVote(
  featureId: string
): Promise<{ ok: true; voted: boolean; count: number } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to vote." };

  const { data: existing } = await supabase
    .from("feature_votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("feature_id", featureId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("feature_votes").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("feature_votes").insert({ user_id: user.id, feature_id: featureId });
    if (error) return { ok: false, error: error.message };
  }

  const { data: row } = await supabase.from("feature_requests").select("votes_count").eq("id", featureId).single();
  return { ok: true, voted: !existing, count: row?.votes_count ?? 0 };
}

export async function listFeatureRequests(status: "all" | "open" | "planning" | "shipped"): Promise<FeatureRequest[]> {
  const supabase = createClient();
  let query = supabase.from("feature_requests").select("*").order("votes_count", { ascending: false });
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query;
  return (data ?? []) as FeatureRequest[];
}

export async function submitFeatureRequest(input: {
  name: string;
  description: string;
  useCase: string;
  priority: PriorityId;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to propose a feature." };

  const { data, error } = await supabase
    .from("feature_requests")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      use_case: input.useCase,
      priority: input.priority,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not save your idea." };
  return { ok: true, id: data.id };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/lib/feedback-api.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 6: Commit**

```bash
git add supabase/schema.sql src/lib/feedback-api.ts src/lib/feedback-api.test.ts
git commit -m "feat: your voice schema + supabase data layer — reviews, media, wishlist, votes"
```

---

## Task 3: Wizard Shell + Steps 1–2

**Files:**
- Create: `src/components/feedback/mood-meter.tsx`
- Create: `src/components/feedback/rating-slider.tsx`
- Create: `src/components/feedback/feedback-journey.tsx`
- Modify: `src/app/globals.css` (add `step-in` keyframes)
- Test: `src/components/feedback/feedback-journey.test.tsx`

- [ ] **Step 1: Write the failing journey test**

Create `src/components/feedback/feedback-journey.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/lib/store", () => ({
  useStudent: () => ({ profile: { name: "Hira Ahmed" }, update: vi.fn(), reset: vi.fn(), hydrated: true, hydrate: vi.fn() }),
}));

const submitReview = vi.hoisted(() => vi.fn());
const confetti = vi.hoisted(() => vi.fn());

vi.mock("@/lib/feedback-api", () => ({
  submitReview,
  toggleVote: vi.fn(),
  listFeatureRequests: vi.fn(),
  submitFeatureRequest: vi.fn(),
}));
vi.mock("canvas-confetti", () => ({ default: confetti }));

import { FeedbackJourney } from "./feedback-journey";

describe("FeedbackJourney", () => {
  it("renders step 1 and blocks Next until a mood is chosen", async () => {
    const user = userEvent.setup();
    render(<FeedbackJourney />);
    const next = screen.getByRole("button", { name: /next/i });
    expect(next).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    expect(next).toBeEnabled();
  });

  it("announces step changes and moves focus to the heading", async () => {
    const user = userEvent.setup();
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 2 })).toHaveFocus());
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/rate/i);
  });

  it("surfaces submit errors inline instead of crashing", async () => {
    const user = userEvent.setup();
    submitReview.mockResolvedValue({ ok: false, error: "quota exceeded" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument());
    expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/feedback/feedback-journey.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Add the step animation to globals.css**

Append to `src/app/globals.css`:

```css
@keyframes step-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-step-in { animation: step-in 260ms ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .animate-step-in { animation: none; }
}
```

- [ ] **Step 4: Write the three components**

Create `src/components/feedback/mood-meter.tsx`:

```tsx
"use client";

import { Angry, Frown, Laugh, Meh, Smile } from "lucide-react";
import { TONE_META, type ToneId } from "@/lib/feedback-model";

const ICONS = { Laugh, Smile, Meh, Frown, Angry } as const;

export function MoodMeter({ value, onChange }: { value: ToneId | null; onChange: (t: ToneId) => void }) {
  return (
    <div role="group" aria-label="How do you feel?" className="flex flex-wrap gap-3">
      {TONE_META.map((tone) => {
        const Icon = ICONS[tone.icon as keyof typeof ICONS];
        const active = value === tone.id;
        return (
          <button
            key={tone.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tone.id)}
            className={`flex min-w-[110px] flex-1 flex-col items-center gap-2 rounded-xl border px-4 py-5 transition-all duration-200 ${
              active
                ? "scale-105 border-blue-500/60 bg-blue-500/10 shadow-[0_0_24px_rgba(59,130,246,0.35)]"
                : "border-[#222] bg-[#111118] hover:border-[#3a3a48]"
            }`}
          >
            <Icon className="h-7 w-7" style={{ color: active ? tone.color : "#8a8a9e" }} aria-hidden />
            <span className={`text-sm font-semibold ${active ? "text-white" : "text-faint"}`}>{tone.label}</span>
          </button>
        );
      })}
    </div>
  );
}
```

Create `src/components/feedback/rating-slider.tsx`:

```tsx
"use client";

export function RatingSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-1">
        <span className="text-5xl font-black tabular-nums text-blue-400">{value}</span>
        <span className="text-sm text-faint">/ 10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Rating out of 10"
        className="w-full accent-blue-500"
      />
      <div className="mt-1 flex justify-between text-xs text-faint">
        <span>not for me</span>
        <span>life-changing</span>
      </div>
    </div>
  );
}
```

Create `src/components/feedback/feedback-journey.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { analyzeSentiment, type SentimentResult, type ToneId } from "@/lib/feedback-model";
import { submitReview } from "@/lib/feedback-api";
import { useStudent } from "@/lib/store";
import { MoodMeter } from "./mood-meter";
import { RatingSlider } from "./rating-slider";
import { StoryStep } from "./story-step";
import { WishlistStep } from "./wishlist-step";
import { Celebration } from "./celebration";
import type { MediaItem } from "./media-uploader";

export const STEPS = [
  { id: 1, title: "How do you feel?" },
  { id: 2, title: "Rate the journey" },
  { id: 3, title: "Tell your story" },
  { id: 4, title: "Shape what's next" },
] as const;

export function FeedbackJourney({ onFeatureAdded }: { onFeatureAdded?: () => void }) {
  const { profile } = useStudent();
  const [step, setStep] = useState(1);
  const [tone, setTone] = useState<ToneId | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [surprised, setSurprised] = useState("");
  const [mindset, setMindset] = useState("");
  const [recommendTo, setRecommendTo] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const stepMeta = STEPS.find((s) => s.id === step)!;

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  const canContinue = step === 1 ? tone !== null : true;
  const first = profile.name.split(" ")[0] || "friend";

  const handleSend = useCallback(async () => {
    if (!tone || submitting) return;
    setSubmitting(true);
    setError(null);
    const sentiment = analyzeSentiment(tone, rating, reviewText);
    const res = await submitReview(
      {
        tone,
        rating,
        reviewText,
        surprised,
        mindset,
        recommendTo,
        sentimentTag: sentiment.tag,
        sentimentScore: sentiment.score,
      },
      media
    );
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResult(sentiment);
    setSubmittedAt(new Date().toISOString());
  }, [tone, rating, reviewText, surprised, mindset, recommendTo, media, submitting]);

  const content = useMemo(() => {
    switch (step) {
      case 1:
        return <MoodMeter value={tone} onChange={(t) => setTone(t)} />;
      case 2:
        return <RatingSlider value={rating} onChange={setRating} />;
      case 3:
        return (
          <StoryStep
            surprised={surprised}
            mindset={mindset}
            recommendTo={recommendTo}
            media={media}
            onSurprised={setSurprised}
            onMindset={setMindset}
            onRecommendTo={setRecommendTo}
            onMedia={setMedia}
          />
        );
      case 4:
        return <WishlistStep onSubmitted={onFeatureAdded} />;
      default:
        return null;
    }
  }, [step, tone, rating, surprised, mindset, recommendTo, media, onFeatureAdded]);

  if (result && submittedAt) {
    return (
      <Celebration
        result={result}
        tone={tone!}
        rating={rating}
        quote={reviewText || result.summary}
        recommendTo={recommendTo}
        hasMedia={media.length > 0}
        submittedAt={submittedAt}
      />
    );
  }

  return (
    <section
      aria-label="Your voice journey"
      className="mt-6 rounded-2xl bg-[#09090B] bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] p-4 sm:p-8"
    >
      <div aria-live="polite" className="sr-only">
        Step {step} of 4: {stepMeta.title}
      </div>

      {/* progress comet */}
      <div className="mb-8 flex items-center gap-2" aria-hidden>
        {STEPS.map((s) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              s.id < step ? "bg-emerald-500" : s.id === step ? "animate-pulse bg-blue-500" : "bg-[#222]"
            }`}
          />
        ))}
        <span className="ml-2 font-mono text-xs text-faint">
          {step}/4
        </span>
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold text-white outline-none">
        {stepMeta.title}
      </h2>
      <div key={step} className="animate-step-in mt-6">
        {content}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-2 rounded-lg border border-[#222] px-4 py-2 text-sm font-medium text-faint transition-colors hover:border-[#3a3a48] hover:text-white disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back
        </button>
        {step < 4 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canContinue}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
          >
            Next <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            <Send className="h-4 w-4" aria-hidden />
            {submitting ? "Sending…" : "Send your voice"}
          </button>
        )}
      </div>

      {first && (
        <p className="mt-6 text-xs text-faint">
          Sharing as <span className="font-semibold text-[#8a8a9e]">{first}</span>
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 5: Write minimal placeholder stubs for the not-yet-built steps**

Create `src/components/feedback/story-step.tsx` (placeholder):

```tsx
"use client";

export function StoryStep(props: Record<string, unknown>) {
  return <div data-testid="story-step" />;
}
```

Create `src/components/feedback/wishlist-step.tsx` (placeholder):

```tsx
"use client";

export function WishlistStep({ onSubmitted }: { onSubmitted?: () => void }) {
  return <div data-testid="wishlist-step" />;
}
```

Create `src/components/feedback/celebration.tsx` (placeholder):

```tsx
"use client";

export function Celebration(props: Record<string, unknown>) {
  return <div data-testid="celebration" />;
}
```

Create `src/components/feedback/media-uploader.tsx` (placeholder — the journey's `import type { MediaItem }` needs this module to exist; Task 4 overwrites it):

```tsx
"use client";

import type { MediaKind } from "@/lib/feedback-model";

export type MediaItem = { file: File; kind: MediaKind; url: string };

export function MediaUploader(props: Record<string, unknown>) {
  return null;
}
```

- [ ] **Step 6: Run the journey test**

Run: `npx vitest run src/components/feedback/feedback-journey.test.tsx`
Expected: PASS (3 tests — mood gating, focus announcement, inline submit error; the celebration-path tests arrive appended in Task 6).

- [ ] **Step 7: Commit**

```bash
git add src/components/feedback/ src/app/globals.css src/components/feedback/feedback-journey.test.tsx
git commit -m "feat: your voice wizard shell — mood meter, rating slider, progress comet (celebration pending)"
```

---

## Task 4: Story Step — Media Uploader + Voice Input

**Files:**
- Create: `src/components/feedback/media-uploader.tsx`
- Create: `src/components/feedback/voice-input.tsx`
- Overwrite: `src/components/feedback/story-step.tsx` (replace placeholder)
- Test: `src/components/feedback/media-uploader.test.tsx`
- Test: `src/components/feedback/story-step.test.tsx`

- [ ] **Step 1: Write the failing media-uploader test**

Create `src/components/feedback/media-uploader.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MediaUploader } from "./media-uploader";

describe("MediaUploader", () => {
  it("previews a valid image and shows the moderation note", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediaUploader items={[]} onChange={onChange} />);
    await user.upload(
      screen.getByLabelText(/attach media/i),
      new File(["x"], "shot.png", { type: "image/png" })
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    const added = onChange.mock.calls[0][0] as { file: File; kind: string; url: string }[];
    expect(added[0].kind).toBe("image");
    expect(screen.getByText(/reviewed before it appears/i)).toBeInTheDocument();
  });

  it("rejects oversized files with an inline error", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediaUploader items={[]} onChange={onChange} />);
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/attach media/i), big);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/5MB or smaller/i)).toBeInTheDocument();
  });

  it("rejects unsupported types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediaUploader items={[]} onChange={onChange} />);
    await user.upload(screen.getByLabelText(/attach media/i), new File(["x"], "doc.pdf", { type: "application/pdf" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it("removes a preview and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const item = { file: new File(["x"], "shot.png", { type: "image/png" }), kind: "image" as const, url: "blob:mock-1" };
    render(<MediaUploader items={[item]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /remove shot\.png/i }));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
```

- [ ] **Step 2: Write the failing story-step test**

Create `src/components/feedback/story-step.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StoryStep } from "./story-step";

const base = {
  surprised: "",
  mindset: "",
  recommendTo: [] as string[],
  media: [] as { file: File; kind: string; url: string }[],
  onSurprised: vi.fn(),
  onMindset: vi.fn(),
  onRecommendTo: vi.fn(),
  onMedia: vi.fn(),
};

describe("StoryStep", () => {
  it("expands the surprise card and edits its text", async () => {
    const user = userEvent.setup();
    const props = { ...base, onSurprised: vi.fn() };
    render(<StoryStep {...props} />);
    await user.click(screen.getByRole("button", { name: /what surprised me/i }));
    const box = screen.getByLabelText(/what surprised me/i);
    await user.type(box, "the roadmap was clear");
    expect(props.onSurprised).toHaveBeenCalledWith("the roadmap was clear");
  });

  it("toggles persona chips", async () => {
    const user = userEvent.setup();
    const props = { ...base, onRecommendTo: vi.fn() };
    render(<StoryStep {...props} />);
    await user.click(screen.getByRole("button", { name: /^students$/i }));
    expect(props.onRecommendTo).toHaveBeenCalledWith(["students"]);
  });

  it("hides the voice input when SpeechRecognition is unsupported", () => {
    render(<StoryStep {...base} />);
    expect(screen.queryByRole("button", { name: /start voice input/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/components/feedback/media-uploader.test.tsx src/components/feedback/story-step.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the components**

Create `src/components/feedback/media-uploader.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { mediaKindFor, validateMedia, type MediaKind } from "@/lib/feedback-model";

export type MediaItem = { file: File; kind: MediaKind; url: string };

export function MediaUploader({
  items,
  onChange,
}: {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: MediaItem[] = [];
    for (const f of Array.from(files)) {
      const v = validateMedia(f);
      if (!v.ok) {
        setError(v.error);
        continue;
      }
      const kind = mediaKindFor(f)!;
      const url = URL.createObjectURL(f);
      urlsRef.current.push(url);
      next.push({ file: f, kind, url });
    }
    if (next.length) {
      setError(null);
      onChange([...items, ...next]);
    }
  };

  const remove = (url: string) => {
    URL.revokeObjectURL(url);
    onChange(items.filter((i) => i.url !== url));
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-[#333] bg-[#111118] px-4 py-6 text-center transition-colors hover:border-blue-500/50">
        <FileUp className="h-6 w-6 text-faint" aria-hidden />
        <span className="text-sm font-medium text-[#a1a1b5]">Attach a screenshot, clip, or voice note</span>
        <span className="font-mono text-xs text-faint">images ≤ 5MB · video/audio ≤ 25MB</span>
        {/* no accept list: userEvent's applyAccept silently drops files before validateMedia can show an error */}
        <input
          type="file"
          multiple
          aria-label="Attach media"
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.url} className="flex items-center gap-3 rounded-lg border border-[#222] bg-[#111118] p-3">
              {item.kind === "image" && (
                <img src={item.url} alt="" className="h-14 w-14 rounded object-cover" />
              )}
              {item.kind === "video" && (
                <video src={item.url} className="h-14 w-24 rounded object-cover" controls />
              )}
              {item.kind === "audio" && (
                <audio src={item.url} controls className="h-9 w-40" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{item.file.name}</p>
                <p className="font-mono text-xs text-faint">
                  {(item.file.size / 1024 / 1024).toFixed(1)}MB · {item.kind}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(item.url)}
                aria-label={`Remove ${item.file.name}`}
                className="rounded-md p-1.5 text-faint transition-colors hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-3 text-xs text-faint">
        Media is reviewed before it appears publicly — we keep everything private until then.
      </p>
    </div>
  );
}
```

Create `src/components/feedback/voice-input.tsx`:

```tsx
"use client";

import { Mic } from "lucide-react";
import { useRef, useState } from "react";

type SpeechRecognitionLike = {
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return (Ctor as (new () => SpeechRecognitionLike) | undefined) ?? null;
}

export function VoiceInput({ onResult, disabled }: { onResult: (text: string) => void; disabled?: boolean }) {
  const [supported] = useState(() => getSpeechRecognition() !== null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    recRef.current = rec;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      if (text.trim()) onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-label={listening ? "Stop voice input" : "Start voice input"}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        listening
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
          : "border-[#222] text-faint hover:border-[#3a3a48] hover:text-white"
      } disabled:opacity-40`}
    >
      <Mic className={`h-4 w-4 ${listening ? "animate-pulse" : ""}`} aria-hidden />
      {listening ? "Listening… tap to stop" : "Speak your story"}
    </button>
  );
}
```

Overwrite `src/components/feedback/story-step.tsx`:

```tsx
"use client";

import { Brain, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { PERSONAS } from "@/lib/feedback-model";
import { MediaUploader, type MediaItem } from "./media-uploader";
import { VoiceInput } from "./voice-input";

export function StoryStep({
  surprised,
  mindset,
  recommendTo,
  media,
  onSurprised,
  onMindset,
  onRecommendTo,
  onMedia,
}: {
  surprised: string;
  mindset: string;
  recommendTo: string[];
  media: MediaItem[];
  onSurprised: (v: string) => void;
  onMindset: (v: string) => void;
  onRecommendTo: (v: string[]) => void;
  onMedia: (v: MediaItem[]) => void;
}) {
  const [openCard, setOpenCard] = useState<"surprised" | "mindset" | null>(null);
  const [voiceTarget, setVoiceTarget] = useState<"surprised" | "mindset">("surprised");

  const toggleCard = (card: "surprised" | "mindset") =>
    setOpenCard((c) => (c === card ? null : card));

  const handleVoice = (text: string) => {
    if (voiceTarget === "surprised") onSurprised(`${surprised} ${text}`.trim());
    else onMindset(`${mindset} ${text}`.trim());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {(
          [
            { id: "surprised", icon: Sparkles, label: "What surprised me?", value: surprised, onChange: onSurprised },
            { id: "mindset", icon: Brain, label: "How did this change my mindset?", value: mindset, onChange: onMindset },
          ] as const
        ).map((card) => {
          const Icon = card.icon;
          const open = openCard === card.id;
          return (
            <div key={card.id} className="rounded-xl border border-[#222] bg-[#111118]">
              <button
                type="button"
                onClick={() => toggleCard(card.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <Icon className="h-5 w-5 text-blue-400" aria-hidden />
                <span className="flex-1 text-sm font-semibold text-white">{card.label}</span>
                <ChevronDown
                  className={`h-4 w-4 text-faint transition-transform ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>
              {open && (
                <div className="px-4 pb-4">
                  <textarea
                    aria-label={card.label}
                    value={card.value}
                    onChange={(e) => card.onChange(e.target.value)}
                    onFocus={() => setVoiceTarget(card.id)}
                    placeholder="Optional — a sentence or two is enough."
                    className="min-h-[84px] w-full resize-y rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder:text-faint focus:border-blue-500/60 focus:outline-none"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-white">Would I recommend this to…?</p>
        <div className="flex flex-wrap gap-2">
          {PERSONAS.map((p) => {
            const active = recommendTo.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onRecommendTo(active ? recommendTo.filter((r) => r !== p.id) : [...recommendTo, p.id])
                }
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-300"
                    : "border-[#2a2a35] text-faint hover:border-[#3a3a48] hover:text-white"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Show, don&apos;t just tell</p>
          <VoiceInput onResult={handleVoice} />
        </div>
        <MediaUploader items={media} onChange={onMedia} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/components/feedback/media-uploader.test.tsx src/components/feedback/story-step.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/feedback/media-uploader.tsx src/components/feedback/voice-input.tsx src/components/feedback/story-step.tsx src/components/feedback/media-uploader.test.tsx src/components/feedback/story-step.test.tsx
git commit -m "feat: your voice story step — expandable story cards, persona chips, media uploader, voice input"
```

---

## Task 5: Wishlist — Step 4 Form + Voting Wall

**Files:**
- Overwrite: `src/components/feedback/wishlist-step.tsx` (replace placeholder)
- Create: `src/components/feedback/wishlist-wall.tsx`
- Test: `src/components/feedback/wishlist-wall.test.tsx`

- [ ] **Step 1: Write the failing wall test**

Create `src/components/feedback/wishlist-wall.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { listFeatureRequests, toggleVote } from "@/lib/feedback-api";

vi.mock("@/lib/feedback-api", () => ({
  listFeatureRequests: vi.fn(),
  toggleVote: vi.fn(),
  submitFeatureRequest: vi.fn(),
}));

const rows = [
  { id: "f1", user_id: "u1", name: "Dark mode", description: "Save my eyes at night", use_case: "Study after 11pm", priority: "p1", status: "open", votes_count: 4, created_at: "2026-08-01" },
  { id: "f2", user_id: "u2", name: "PDF export", description: "Download plans", use_case: "Print for parents", priority: "p0", status: "planning", votes_count: 9, created_at: "2026-08-02" },
] as const;

import { WishlistWall } from "./wishlist-wall";

describe("WishlistWall", () => {
  it("renders rows sorted with vote counts", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([...rows] as never);
    render(<WishlistWall />);
    expect(await screen.findByText("Dark mode")).toBeInTheDocument();
    expect(screen.getByText("PDF export")).toBeInTheDocument();
  });

  it("filters by status chips", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([rows[0]] as never);
    const user = userEvent.setup();
    render(<WishlistWall />);
    await screen.findByText("Dark mode");
    await user.click(screen.getByRole("button", { name: /^open$/i }));
    await waitFor(() => expect(listFeatureRequests).toHaveBeenLastCalledWith("open"));
  });

  it("upvotes optimistically and keeps the new count", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([rows[1]] as never);
    vi.mocked(toggleVote).mockResolvedValue({ ok: true, voted: true, count: 10 });
    const user = userEvent.setup();
    render(<WishlistWall />);
    const row = await screen.findByText("PDF export");
    const button = row.closest("li")!.querySelector("button")!;
    await user.click(button);
    await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("reverts the count when the vote fails", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([rows[1]] as never);
    vi.mocked(toggleVote).mockResolvedValue({ ok: false, error: "signed out" });
    const user = userEvent.setup();
    render(<WishlistWall />);
    const row = await screen.findByText("PDF export");
    const button = row.closest("li")!.querySelector("button")!;
    await user.click(button);
    await waitFor(() => expect(screen.getByText("9")).toBeInTheDocument());
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/feedback/wishlist-wall.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the components**

Overwrite `src/components/feedback/wishlist-step.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Lightbulb, Send } from "lucide-react";
import { PRIORITIES, type PriorityId } from "@/lib/feedback-model";
import { submitFeatureRequest } from "@/lib/feedback-api";

export function WishlistStep({ onSubmitted }: { onSubmitted?: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [useCase, setUseCase] = useState("");
  const [priority, setPriority] = useState<PriorityId>("p1");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const res = await submitFeatureRequest({
      name: name.trim(),
      description: description.trim(),
      useCase: useCase.trim(),
      priority,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDone(true);
    setName("");
    setDescription("");
    setUseCase("");
    setPriority("p1");
    onSubmitted?.();
  };

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm text-emerald-200">
        Idea added — see it on the wall below and watch the votes roll in.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-[#a1a1b5]">
        <Lightbulb className="h-4 w-4 text-amber-300" aria-hidden />
        Optional — have an idea for what we should build next?
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Feature name"
        placeholder="Feature name — e.g. past-paper practice mode"
        className="w-full rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder:text-faint focus:border-blue-500/60 focus:outline-none"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Feature description"
          placeholder="What is it?"
          className="min-h-[72px] w-full resize-y rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder:text-faint focus:border-blue-500/60 focus:outline-none"
        />
        <textarea
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          aria-label="Use case"
          placeholder="Who needs it and why?"
          className="min-h-[72px] w-full resize-y rounded-lg border border-[#2a2a35] bg-[#0d0d12] px-3 py-2 text-sm text-white placeholder:text-faint focus:border-blue-500/60 focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-faint">Priority</span>
        {PRIORITIES.map((p) => {
          const active = priority === p.id;
          return (
            <button
              key={p.id}
              type="button"
              aria-pressed={active}
              onClick={() => setPriority(p.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                active
                  ? p.id === "p0"
                    ? "border-red-500/60 bg-red-500/10 text-red-300"
                    : p.id === "p1"
                      ? "border-amber-500/60 bg-amber-500/10 text-amber-300"
                      : "border-blue-500/60 bg-blue-500/10 text-blue-300"
                  : "border-[#2a2a35] text-faint hover:border-[#3a3a48] hover:text-white"
              }`}
            >
              {p.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={submit}
          disabled={!name.trim() || busy}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden />
          {busy ? "Adding…" : "Add to the wall"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
```

Create `src/components/feedback/wishlist-wall.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { listFeatureRequests, toggleVote, type FeatureRequest } from "@/lib/feedback-api";

type Filter = "all" | "open" | "planning" | "shipped";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "planning", label: "In Planning" },
  { id: "shipped", label: "Shipped" },
];

const PRIORITY_STYLES: Record<string, string> = {
  p0: "border-red-500/50 bg-red-500/10 text-red-300",
  p1: "border-amber-500/50 bg-amber-500/10 text-amber-300",
  p2: "border-blue-500/50 bg-blue-500/10 text-blue-300",
};

export function WishlistWall({ refreshKey = 0 }: { refreshKey?: number }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [rows, setRows] = useState<FeatureRequest[]>([]);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listFeatureRequests(filter);
    setRows(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const vote = async (id: string) => {
    const prev = voted[id] ?? false;
    setVoted((v) => ({ ...v, [id]: !prev }));
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, votes_count: r.votes_count + (prev ? -1 : 1) } : r))
    );
    const res = await toggleVote(id);
    if (!res.ok) {
      setVoted((v) => ({ ...v, [id]: prev }));
      setRows((rs) =>
        rs.map((r) => (r.id === id ? { ...r, votes_count: r.votes_count - (prev ? -1 : 1) } : r))
      );
    }
  };

  return (
    <section aria-label="Feature wishlist" className="rounded-2xl border border-[#222] bg-[#0d0d12] p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold text-white">Feature wishlist</h2>
        <span className="font-mono text-xs text-faint">vote on what we build next</span>
        <div className="ml-auto flex flex-wrap gap-2" role="group" aria-label="Roadmap filter">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                filter === f.id
                  ? "border-blue-500/60 bg-blue-500/10 text-blue-300"
                  : "border-[#2a2a35] text-faint hover:border-[#3a3a48] hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-faint">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading ideas…
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-sm text-faint">Nothing here yet — be the first to add an idea above.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start gap-4 rounded-xl border border-[#222] bg-[#111118] p-4">
              <button
                type="button"
                onClick={() => vote(row.id)}
                aria-pressed={voted[row.id] ?? false}
                aria-label={`Upvote ${row.name}`}
                className="flex shrink-0 flex-col items-center gap-0.5 rounded-lg border border-[#2a2a35] px-2.5 py-1.5 transition-colors hover:border-blue-500/50 aria-pressed:border-blue-500/60 aria-pressed:bg-blue-500/10"
              >
                <ArrowUp className={`h-4 w-4 ${voted[row.id] ? "text-blue-400" : "text-faint"}`} aria-hidden />
                <span className="text-sm font-bold tabular-nums text-white">{row.votes_count}</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{row.name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[row.priority]}`}>
                    {row.priority}
                  </span>
                  {row.status !== "open" && (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        row.status === "shipped"
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-violet-500/50 bg-violet-500/10 text-violet-300"
                      }`}
                    >
                      {row.status === "shipped" ? "Shipped" : "In planning"}
                    </span>
                  )}
                </div>
                {row.description && <p className="mt-1 text-sm text-[#a1a1b5]">{row.description}</p>}
                {row.use_case && <p className="mt-1 text-xs text-faint">Why: {row.use_case}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/components/feedback/wishlist-wall.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/feedback/wishlist-step.tsx src/components/feedback/wishlist-wall.tsx src/components/feedback/wishlist-wall.test.tsx
git commit -m "feat: your voice wishlist — step 4 form, roadmap filter wall, optimistic voting"
```

---

## Task 6: Celebration + Share Card

**Files:**
- Modify: `package.json` (add `canvas-confetti`, `html2canvas`)
- Overwrite: `src/components/feedback/celebration.tsx` (replace placeholder)
- Create: `src/components/feedback/share-story-card.tsx`
- Test: `src/components/feedback/share-story-card.test.tsx`

- [ ] **Step 1: Add dependencies**

```bash
npm install canvas-confetti html2canvas && npm install -D @types/canvas-confetti
```

Verify: `npm ls canvas-confetti html2canvas` lists both packages without errors.

- [ ] **Step 2: Write the failing share-card test**

Create `src/components/feedback/share-story-card.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const html2canvas = vi.hoisted(() => vi.fn(async () => ({ toDataURL: () => "data:image/png;base64,x" })));
const html2pdf = vi.hoisted(() => vi.fn(() => ({ set: vi.fn(() => ({ from: vi.fn(() => ({ save: vi.fn(async () => {}) })) })) })));
const anchorClick = vi.hoisted(() => vi.fn());

vi.mock("html2canvas", () => ({ default: html2canvas }));
vi.mock("html2pdf.js", () => ({ default: html2pdf }));

import { ShareStoryCard } from "./share-story-card";

const props = {
  name: "Hira Ahmed",
  tone: "loved" as const,
  rating: 9,
  quote: "The roadmap changed how I plan my week.",
  personas: ["students"],
  date: "2026-08-31",
};

describe("ShareStoryCard", () => {
  it("renders the card summary", () => {
    render(<ShareStoryCard {...props} />);
    expect(screen.getByText("Hira Ahmed")).toBeInTheDocument();
    expect(screen.getByText(/roadmap changed how i plan/i)).toBeInTheDocument();
    expect(screen.getByText("9/10")).toBeInTheDocument();
  });

  it("downloads a PNG via html2canvas", async () => {
    const user = userEvent.setup();
    // Only intercept <a> — React itself creates elements via document.createElement during render
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      ((tag: string, options?: ElementCreationOptions) =>
        tag === "a" ? ({ click: anchorClick } as unknown as HTMLElement) : realCreateElement(tag, options)) as typeof document.createElement
    );
    render(<ShareStoryCard {...props} />);
    await user.click(screen.getByRole("button", { name: /download png/i }));
    await vi.dynamicImportSettled();
    expect(html2canvas).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
  });

  it("downloads a PDF via html2pdf", async () => {
    const user = userEvent.setup();
    render(<ShareStoryCard {...props} />);
    await user.click(screen.getByRole("button", { name: /download pdf/i }));
    await vi.dynamicImportSettled();
    expect(html2pdf).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/feedback/share-story-card.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the components**

Create `src/components/feedback/share-story-card.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { CLOSINGS, type ToneId } from "@/lib/feedback-model";

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "story";
}

export function ShareStoryCard({
  name,
  tone,
  rating,
  quote,
  personas,
  date,
}: {
  name: string;
  tone: ToneId;
  rating: number;
  quote: string;
  personas: string[];
  date: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const downloadPng = async () => {
    const node = cardRef.current;
    if (!node) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(node, { backgroundColor: "#09090B", scale: 2 });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `your-voice-${slugify(name)}.png`;
    a.click();
  };

  const downloadPdf = async () => {
    const node = cardRef.current;
    if (!node) return;
    const { default: html2pdf } = await import("html2pdf.js");
    await html2pdf()
      .set({
        margin: 10,
        filename: `your-voice-${slugify(name)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: "#09090B" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(node)
      .save();
  };

  return (
    <div>
      <div
        ref={cardRef}
        className="mx-auto max-w-sm rounded-2xl border border-[#2a2a35] bg-[#09090B] p-6 text-white"
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#3B82F6]">Your Voice · aftermediate</p>
        <h3 className="mt-4 text-2xl font-extrabold">{name}</h3>
        <p className="mt-1 text-sm text-[#a1a1b5]">{new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
        <p className="mt-6 text-5xl font-black tabular-nums text-blue-400">{rating}<span className="text-xl text-faint">/10</span></p>
        <p className="mt-4 text-base italic leading-relaxed text-[#d8d8e2]">“{quote}”</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {personas.map((p) => (
            <span key={p} className="rounded-full border border-[#2a2a35] px-3 py-1 text-xs text-[#a1a1b5]">
              recommends for {p}
            </span>
          ))}
        </div>
        <p className="mt-6 border-t border-[#222] pt-4 text-xs text-[#7a7a90]">{CLOSINGS[tone]}</p>
      </div>

      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          onClick={downloadPng}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          <Download className="h-4 w-4" aria-hidden /> Download PNG
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 rounded-lg border border-[#2a2a35] px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-[#3a3a48]"
        >
          <Download className="h-4 w-4" aria-hidden /> Download PDF
        </button>
      </div>
    </div>
  );
}
```

Overwrite `src/components/feedback/celebration.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { CLOSINGS, type SentimentResult, type ToneId } from "@/lib/feedback-model";
import { useStudent } from "@/lib/store";
import { ShareStoryCard } from "./share-story-card";

const TAG_STYLES: Record<string, string> = {
  "highly-positive": "border-emerald-500/60 bg-emerald-500/10 text-emerald-300",
  positive: "border-blue-500/60 bg-blue-500/10 text-blue-300",
  constructive: "border-amber-500/60 bg-amber-500/10 text-amber-300",
  critical: "border-red-500/60 bg-red-500/10 text-red-300",
};

const TAG_LABELS: Record<string, string> = {
  "highly-positive": "Highly positive",
  positive: "Positive",
  constructive: "Constructive criticism",
  critical: "Critical feedback",
};

export function Celebration({
  result,
  tone,
  rating,
  quote,
  recommendTo,
  hasMedia,
  submittedAt,
  playConfetti = confetti,
}: {
  result: SentimentResult;
  tone: ToneId;
  rating: number;
  quote: string;
  recommendTo: string[];
  hasMedia: boolean;
  submittedAt: string;
  playConfetti?: (opts?: unknown) => void;
}) {
  const { profile } = useStudent();
  const firstName = profile.name.split(" ")[0] || "friend";

  useEffect(() => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    playConfetti({ particleCount: 120, spread: 75, origin: { y: 0.6 } });
  }, [playConfetti]);

  return (
    <section aria-label="Thank you" className="mt-6 rounded-2xl bg-[#09090B] p-4 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#3B82F6]">Your voice landed</p>
      <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
        Thank you, {firstName}.
      </h2>
      <p className="mt-2 max-w-lg text-muted">{CLOSINGS[tone]}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${TAG_STYLES[result.tag]}`}>
          {TAG_LABELS[result.tag]}
        </span>
        <span className="rounded-full border border-[#2a2a35] px-3 py-1 font-mono text-xs text-faint">
          {result.score}/100
        </span>
        <span className="font-mono text-xs text-faint">{rating}/10</span>
      </div>
      {hasMedia && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-200">
          Your media is in review — we&apos;ll check it before anything appears publicly.
        </p>
      )}

      <div className="mt-8">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-faint">Share your story</h3>
        <ShareStoryCard
          name={profile.name || "A student"}
          tone={tone}
          rating={rating}
          quote={quote}
          personas={recommendTo}
          date={submittedAt}
        />
      </div>

      <a
        href="#wishlist"
        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition-colors hover:text-blue-300"
      >
        Vote on the wishlist ↓
      </a>
    </section>
  );
}
```

- [ ] **Step 5: Append the full-journey integration tests**

Append to `src/components/feedback/feedback-journey.test.tsx` (after the existing `describe` block):

```tsx
describe("FeedbackJourney — full path", () => {
  it("walks through all steps and lands on the celebration with a personalized greeting", async () => {
    const user = userEvent.setup();
    submitReview.mockResolvedValue({ ok: true, id: "r1" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    const slider = screen.getByRole("slider", { name: /rating/i });
    await user.click(slider);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i })); // story (empty) → step 4
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getByText(/thank you, hira/i)).toBeInTheDocument());
    expect(confetti).toHaveBeenCalled();
    expect(submitReview).toHaveBeenCalledTimes(1);
  });

  it("shows sentiment badges and tone-matched closing on the celebration", async () => {
    const user = userEvent.setup();
    submitReview.mockResolvedValue({ ok: true, id: "r1" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /frustrated/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getByText(/we hear you/i)).toBeInTheDocument());
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it("shows a moderation note on the celebration when media was attached", async () => {
    const user = userEvent.setup();
    submitReview.mockResolvedValue({ ok: true, id: "r1" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    const input = screen.getByLabelText(/attach media/i);
    await user.upload(input, new File(["x"], "shot.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getByText(/media is in review/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 6: Run the full feedback test suite**

Run: `npx vitest run src/components/feedback/ src/lib/feedback-`
Expected: ALL PASS — including the 3 celebration-path journey tests appended in Step 5 (celebration is now real).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/components/feedback/celebration.tsx src/components/feedback/share-story-card.tsx src/components/feedback/share-story-card.test.tsx src/components/feedback/feedback-journey.test.tsx
git commit -m "feat: your voice celebration — confetti, sentiment badges, share card PNG + PDF"
```

---

## Task 7: Page Shell + Sidebar

**Files:**
- Create: `src/app/(app)/feedback/page.tsx`
- Modify: `src/components/sidebar.tsx`

- [ ] **Step 1: Create the page**

Create `src/app/(app)/feedback/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { FeedbackJourney } from "@/components/feedback/feedback-journey";
import { WishlistWall } from "@/components/feedback/wishlist-wall";

export default function FeedbackPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center gap-2">
        <Badge variant="violet">Your Voice</Badge>
        <span className="font-mono text-xs text-faint">review · reflect · shape what&apos;s next</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Your experience, <span className="text-violet">heard.</span>
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        Skip the boring form. Tell us how it felt, what surprised you, and what we should build next.
      </p>

      <FeedbackJourney onFeatureAdded={() => setRefreshKey((k) => k + 1)} />

      <div id="wishlist" className="mt-10 scroll-mt-6">
        <WishlistWall refreshKey={refreshKey} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the sidebar link**

In `src/components/sidebar.tsx`:

1. In the lucide-react import block (keep alphabetical order), insert `MessageSquareHeart,` directly after the `MessageSquareText,` line:

```tsx
  MessageSquareHeart,
  MessageSquareText,
```

2. Inside the `label: "Community"` group (currently just the Mentor Match link at `{ href: "/mentors", label: "Mentor Match", icon: Users },`), add directly after it:

```tsx
      { href: "/feedback", label: "Your Voice", icon: MessageSquareHeart },
```

- [ ] **Step 3: Verify with tsc + a smoke test**

Run: `npx tsc --noEmit`
Expected: clean (no errors).

Run: `npx vitest run src/components/feedback/ src/lib/feedback-`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/feedback/page.tsx" src/components/sidebar.tsx
git commit -m "feat: your voice page shell + sidebar link under community"
```

---

## Task 8: Full Gates + Final Review

**Files:** none new (verification only)

- [ ] **Step 1: Run all gates**

```bash
npx vitest run
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all tests pass (existing 692 + ~50 new), tsc clean, lint 0 errors (3 pre-existing warnings allowed in untouched files), build compiles with the new `/feedback` route.

- [ ] **Step 2: Fix anything the gates surface**

If lint flags unused imports or test-only exports, fix and re-run the failed gate.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "chore: your voice gates — full suite green"
```

- [ ] **Step 4: Final review**

Run a holistic review of the whole feature: every spec section (1–10) mapped to code, all 4 decisions honored (Guided Journey, real Supabase, rule-based sentiment, storage uploads), emoji discipline (no emoji in UI strings — icons + labels only), gates green.
