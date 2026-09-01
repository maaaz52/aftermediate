# Grounded Chatbots — Design Spec & Decision Record

> **Status:** Implemented (decision record, written after the work shipped)
> **Date:** 2026-09-01
> **Commits:** `c2f45f4` → `6dafee8` (9 commits, main)

**Feature:** The seven chat personas (Rahbar, Ustaad, essay coach, CV writer, Safar, Hunar, Qalam) stop relying on whatever happens to be stuffed into their system prompts and instead answer from three sources the server controls: a scored knowledge base, the signed-in student's profile row, and a validated request contract.

## What the audit found

The original ask was "check if the bots are trained already, and if yes, on what." The answer: nothing is ML-trained and nothing was fine-tuned. "Trained on relevant data" had meant hand-authored knowledge bases — `abroad-chatbot-knowledge.ts` (11 topics) and `skills-chatbot-knowledge.ts` (19 topics) — but only Safar and Hunar had one, and both were inlined **whole** into every system prompt regardless of the question. The other five personas ran on prose alone, and Rahbar's prose was factually wrong about the product it described (a "7-section" quiz that has 5; a ten-page tour of a ~30-route site). No prompt ever saw the student's actual profile.

## Ambition: grounded answers only

Three options were on the table — fine-tuning, RAG, endpoint hardening. The decision: **grounding only**. No fine-tuning (the corpora are hand-authored and change weekly; a fine-tune would freeze them), no new chat UIs (all six client callers already speak the wire contract), no embeddings or vector DB (see below). The endpoint, which had been accepting any JSON from anyone including unauthenticated users, was hardened in the same pass.

## BM25 over embeddings

Retrieval is a dependency-free BM25 (`src/lib/knowledge.ts`, pure module: no AI SDK, no Supabase, no `next/*`). Chosen over embeddings because:

- **The corpus is tiny.** ~30 topics, a few hundred facts — it fits in memory and tokenizes once per process. BM25's known weakness (no semantic generalization) barely applies at a scale where an exhaustive scorer is already exhaustive.
- **The vocabulary is lexical.** PKR, IELTS, FBR, NUST, marksheet — users and facts share literal terms. Where they don't ("park cash" vs "blocked account"), the gap is closed by an explicit **ALIAS table** appended to the index at load time, which doubles as documented, reviewable curriculum.
- **Determinism is testable.** Every fact must be reachable by its own text, retrieval must be order-stable, and personas must never cross — all assertable in a unit test. An embedding pipeline (API round-trips, model drift, a vector store to run) would have replaced these guarantees with vibes.

A recall harness in `knowledge.test.ts` runs 24 realistic paraphrased questions; the suite gates at **≥22 of 24** and currently scores **24/24**. Off-domain questions return `covered: false` so the bot says "I don't cover that" instead of padding with the nearest-looking fact.

## Architecture

```
src/lib/chat-request.ts      wire contract: PERSONAS, ChatMessage, limits, parseChatRequest
src/lib/knowledge.ts         BM25 index + ALIAS + formatFacts (pure)
src/lib/student-context.ts   profiles row → sanitized prompt block (pure)
src/lib/chat-prompt.ts       PERSONA_PROMPTS + buildSystemPrompt seam
src/lib/chat-storage.ts      per-user localStorage keys, legacy keys deleted
src/data/site-pages.ts       the 31 pages Rahbar is allowed to name
src/app/api/chat/route.ts    auth → size → parse → validate → profile → retrieve → stream
```

Request order in the route is load-bearing: `auth.getUser()` first (it can refresh cookies, and HTTP cannot set cookies after streaming starts), then the declared Content-Length refusal (a 200 KB body is never read), then the **measured** body size (Content-Length is the client's word — a lying header test proves the second check is load-bearing), then `JSON.parse` → 400 not 500, then validation.

Validation contract: roles allowlisted to `user|assistant` (a smuggled `system` role is privilege escalation, and its test says so); the last turn must be the student's question; past 20 turns the **oldest are dropped, not rejected** — localStorage threads are unbounded, so a hard reject would brick a working drawer on the first post-deploy message; 12,000 chars/message and 30,000 total → 413; the parsed result carries exactly `{persona, messages}`, so a forged `student` field cannot ride along. `ChatMessage` is defined once in `chat-request.ts` and re-exported by `chat-storage.ts` so client and server cannot drift.

The student block is built server-side from the authenticated token's own profile row: seven named columns only, enums allowlisted against the quiz itself, numbers clamped, free text flattened to one line (a newline in a name cannot smuggle an instruction), rendered under a header naming its origin so the model treats our records as authoritative over chat claims. A failed profile read degrades to "no context," never to a broken chat. The service-role client is deliberately unused: it bypasses RLS, and RLS (`profiles_select_own`) is the actual boundary.

Rahbar's rot problem was fixed structurally: his site map is rendered from `SITE_PAGES` (31 entries, labels pinned equal to the sidebar's by importing the sidebar component into a test) and his quiz description interpolates `QUIZ_SECTIONS` count and ids. Tests also pin the stale claims **absent** (`7-section`, `entry test, money & budget`) and the whole prompt under 6,000 chars.

## Storage isolation (shipped in the same PR)

`localStorage` is per-browser, not per-person; on a shared family computer the old shared keys handed one sibling another's transcripts — which contain marks, budgets and essay drafts. Every chat key is now suffixed with the signed-in user's id, and the legacy shared keys are **deleted, never adopted**: their contents may belong to a different person on this machine. Students see their scroll reset once after this ships.

## Measured evidence

| Check | Result |
|---|---|
| Recall harness | 24/24 (gate: ≥22) |
| Full suite | 54 files, 882 tests, exit 0 |
| `tsc --noEmit` | clean |
| `next build` | exit 0; `/api/chat` dynamic (ƒ) |
| Rahbar prompt | 5,161 chars (5,610 with student block) vs 6,000 ceiling |
| KBs indexed | abroad 11 topics, skills 19 topics, every fact reachable by its own text |
| eslint | unchanged: 4 pre-existing errors in `tour-provider.tsx` |
| Mutation checks | each critical guard proven load-bearing (delete guard → exactly its test fails) |

## Deliberately out of scope

- **Fine-tuning / embeddings / vector DB** — see "BM25 over embeddings."
- **Usage quota** (`0001_chat_usage.sql` + fail-open `checkChatQuota`) — deferred by decision.
- **Model pinning** — `gemini-flash-latest` floats; pin a dated model via `GOOGLE_MODEL` before launch.
- **CI workflow** (`npm test` + `lint` on PR) — not yet committed; gating lint requires deciding on the 4 pre-existing `tour-provider` errors first.
- **`middleware.ts` → `proxy.ts`** codemod for this Next version.
- **Browser manual matrix** — profile isolation (A asks "what's my budget?", B in a second browser gets B's number; replay A's POST with an injected `student` field → still A's server-side value) and storage isolation (A chats, logs out, B logs in same browser → B's drawer empty, legacy key gone). Unverifiable in unit tests; still owed.
