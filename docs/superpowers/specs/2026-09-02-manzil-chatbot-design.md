# Manzil A.I — Grounding the Study-in-Pakistan Bot

> **Status:** Approved, not yet implemented
> **Date:** 2026-09-02
> **Depends on:** `2026-09-01-grounded-chat-design.md` (BM25 retrieval, persona contract, student context)

**Feature:** Manzil (منزل), the eighth persona, answers questions about Pakistani
institutes, admissions, merit, entry tests and scholarships — grounded in the same
BM25 pipeline Safar and Hunar already use. Its frontend shipped first as a design
preview with canned replies; this spec covers replacing those with real retrieval.

## Why this one is different

Safar's and Hunar's corpora were hand-authored because nothing structured existed
to derive them from. Manzil's subject matter is already in the repo, powering the
explorer pages:

| Source | Records | Carries `sourceUrl` |
|---|---|---|
| `pakistan-universities.json` | 12 | 12/12 |
| `pakistan-scholarships.json` | 24 | 24/24 |
| `entry-tests.json` | 13 | 13/13 |

Every record already carries the URL a `KnowledgeFact` needs to cite. Hand-authoring
a parallel prose corpus would duplicate 49 records and guarantee drift: a fee corrected
on the Universities page would leave Manzil quoting the old number, with no test to
catch it. So the corpus is **derived from the JSON, plus a hand-authored guidance
layer** for the judgment questions the data cannot answer.

## Corpus architecture

`src/data/pakistan-chatbot-knowledge.ts` exports a `KnowledgeBase` — the shape
`knowledge.ts` already consumes — assembled from two halves.

### Derived half

Pure functions map each JSON record to facts, `source` taken from the record's own
`sourceUrl`. Topic granularity: **one topic per university (12), one per entry test
(13), scholarships grouped by their existing `category` field (5).** Per-university
topics make the recall harness precise — a NUST question can assert
`expectTopicId: "uni-nust"` rather than a catch-all bucket.

**The load-bearing rule: every derived fact must name its own subject.** BM25 scores
individual facts; `topicId` is metadata that does not participate in matching. A fee
fact reading "tuition is PKR X per semester" is unreachable by any realistic query.
It must read "NUST (National University of Sciences & Technology), Islamabad, charges…".

Identifying terms — `short`, `city`, `bestFields`, `conductingBody` — are folded into
fact text at derivation time. This is also why the 30 derived topics need **no hand-written
`ALIAS` rows**: the vocabulary a student would use is already in the data. Only the four
authored topics get ALIAS entries.

### Authored half

Four topics, written as prose facts in the style of `abroad-chatbot-knowledge.ts`:

- `choosing-where-to-apply` — public vs private trade-offs, whether a fee is worth it,
  shortlisting realistically, hostel and city considerations for out-of-town students.
- `merit-strategy` — how aggregate weighting works, reading closing-merit trends, and
  what to do after missing merit: retake, second-tier options, gap year.
- `scholarship-strategy` — winning one rather than listing it: document prep, timing
  against admission cycles, common rejection reasons, stacking rules.
- `admission-safety` — checking HEC recognition before paying anyone, unrecognized
  institutes, admission-agent scams, degree attestation. Mirrors Safar's `scams-safety`.

## Wiring

Four edits, in this order:

1. `src/lib/chat-request.ts` — add `"manzil"` to `PERSONAS`.
2. `src/lib/chat-prompt.ts` — add `PERSONA_PROMPTS.manzil`.
3. `src/lib/knowledge.ts` — `KNOWLEDGE_BASES.manzil` plus four ALIAS rows.
4. `src/components/pakistan/manzil-assistant.tsx` — replace `mockReply` with the
   `fetch("/api/chat")` streaming reader Safar uses; delete `MOCK_REPLIES`.

`PERSONA_PROMPTS` is a total `Record<Persona, string>`, so step 1 fails to compile
until step 2 lands. The type system enforces the order; no step can be silently skipped.

Nothing in `/api/chat` changes. The route is persona-agnostic — auth, size limits,
validation, profile lookup and retrieval already run for every persona.

## Boundaries

Four bots now overlap on the same student. Manzil's prompt draws the lines:

- **Ustaad** teaches test *content* and concepts; Manzil covers test *logistics* —
  pattern, fee, eligibility, how to apply. "Explain projectile motion" goes to Ustaad.
- **Rahbar** navigates the site; Manzil answers about the world.
- **Safar** owns anything abroad. Manzil declines rather than guessing.

Pinned by tests asserting off-domain questions return `covered: false` instead of a
padded near-miss.

## Staleness — the primary risk

`dataYear` is 2026 and the JSON is deliberately imprecise where reality is: scholarship
deadlines read "Cycle-based (announced by HEC each year)", MDCAT's fee reads "Announced
per cycle (PKR 9,000 local centres in the 2025 cycle)".

**Derivation must not manufacture precision the source does not have.** A bot inventing
a concrete deadline for a student's scholarship application is the worst failure this
feature can produce — it is the one error that costs a student a year. Derived facts
carry their data year, and the prompt requires dating every claim and pointing at the
official `sourceUrl` for anything time-sensitive.

## Testing

**`src/data/pakistan-chatbot-knowledge.test.ts`** (new)
- Every JSON record yields at least one fact — no university silently dropped.
- Every fact carries an `https://` source.
- Every derived fact names its subject: a university's fact contains its `short` name,
  a test's fact contains its `short`, a scholarship's contains a distinctive term of
  its `name`. This is the rule retrieval depends on, so it is asserted, not assumed.
- No fact exceeds a length ceiling (retrieved facts enter every prompt).
- Fact text carries no invented date where the source field is cycle-based.

**`src/lib/knowledge.test.ts`** (extend)
- Add ~20 Pakistani paraphrase cases to `HARNESS`, each with an `expectTopicId`.
  The existing gate asserts `misses.length <= HARNESS.length - 22`; it must be
  re-expressed as a proportion (≥90%) so a longer harness does not accidentally
  loosen it — a real hazard, since adding 20 passing cases to a fixed-22 gate would
  permit 22 failures where it previously permitted 2.
- Off-domain cases: an abroad/visa question to `manzil` returns `covered: false`.
- The ALIAS test already asserts every key is a real topic id; the four new rows
  must satisfy it.

**`src/lib/chat-prompt.test.ts`** (extend)
- A prompt-size ceiling for Manzil, as Rahbar has.
- Boundary language present: the prompt names Ustaad/Safar as the referral targets.

## Deliberately out of scope

- **No new UI.** The page and component shipped and were approved on 2026-09-01.
- **No live scraping** of HEC or university sites. The JSON stays hand-maintained;
  deriving from it is what keeps bot and pages in sync.
- **No admin editor** for the corpus.
- **No embeddings.** The reasoning in the prior spec holds and the corpus is still tiny.
- **Usage quota and model pinning** remain deferred, as recorded in the prior spec.

## Known baseline

`builder.test.tsx` > "AI Polish turns raw notes into 3 polished bullets" fails at HEAD,
and the suite's failure count varies run to run under default parallelism. Verify with
`npx vitest run --no-file-parallelism` and compare against that baseline rather than
expecting green.
