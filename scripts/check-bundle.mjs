/**
 * Bundle budget check. Run after `next build`:
 *
 *   node scripts/check-bundle.mjs
 *
 * Budget (as of 2026-09, next 16 / Turbopack):
 *   - Total static JS in .next/static/chunks: 8MB
 *   - Single chunk: 1.6MB (the shared Next/React framework runtime is ~1.27MB)
 *
 * Raise the budget only with a documented reason; lower it as dead weight is
 * removed. A failing budget is meant to catch an accidental 1MB+ dependency
 * being added, not to block legitimate growth.
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const CHUNKS_DIR = ".next/static/chunks";
const TOTAL_BUDGET_KB = 8 * 1024; // 8MB
const LARGEST_BUDGET_KB = 1.6 * 1024; // 1.6MB per chunk

const files = readdirSync(CHUNKS_DIR).filter((f) => f.endsWith(".js"));
let total = 0;
const large = [];
for (const f of files) {
  const size = statSync(join(CHUNKS_DIR, f)).size;
  total += size;
  if (size > 300 * 1024) large.push({ f, kb: Math.round(size / 1024) });
}
large.sort((a, b) => b.kb - a.kb);

const totalMb = (total / 1048576).toFixed(1);
console.log(`Static JS total: ${totalMb}MB across ${files.length} chunks`);
for (const l of large.slice(0, 8)) console.log(`  ${l.kb}KB ${l.f}`);

let failed = false;
if (total > TOTAL_BUDGET_KB * 1024) {
  console.error(`FAIL: total static JS ${totalMb}MB exceeds ${TOTAL_BUDGET_KB / 1024}MB budget.`);
  failed = true;
}
if (large.length > 0 && large[0].kb > LARGEST_BUDGET_KB) {
  console.error(`FAIL: largest chunk ${large[0].kb}KB exceeds ${LARGEST_BUDGET_KB}KB budget.`);
  failed = true;
}
if (failed) process.exit(1);
console.log(`Within budget (total ${TOTAL_BUDGET_KB / 1024}MB, largest ${LARGEST_BUDGET_KB}KB).`);