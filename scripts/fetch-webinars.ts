/**
 * fetch-webinars.ts — Automated Webinar Data Fetcher
 *
 * ============================================================================
 * OVERVIEW
 * ============================================================================
 *
 * Fetches upcoming event/webinar listings from known Pakistani education
 * portals using cheerio-based HTML scraping, merges them with manually
 * curated entries (flagged `"manual": true` in webinars.json), deduplicates,
 * validates, and writes the combined result back to src/data/webinars.json.
 *
 * Run:          npx tsx scripts/fetch-webinars.ts
 * Dry-run:      npx tsx scripts/fetch-webinars.ts --dry-run
 *
 * ============================================================================
 * AUTOMATION (GitHub Action)
 * ============================================================================
 *
 * A scheduled GitHub Action runs this script weekly (Sunday midnight PKT).
 * See .github/workflows/fetch-webinars.yml for the workflow definition.
 * The action commits any changes to webinars.json and opens a PR.
 *
 * ============================================================================
 * SOURCE LIST
 * ============================================================================
 *
 *   1. British Council Pakistan  —  https://www.britishcouncil.pk/events
 *   2. HEC Pakistan              —  https://www.hec.gov.pk/events
 *   3. USEFP / Fulbright         —  https://usefp.org/events/
 *   4. DAAD Pakistan             —  https://www.daad.pk/en/events/
 *   5. P@SHA Pakistan            —  https://pasha.org.pk/events/
 *   6. IDP IELTS Pakistan        —  https://ielts.idp.com/pakistan/prepare
 *
 * All sources limited to free, publicly listed events relevant to Pakistani
 * high-school students exploring career paths.
 *
 * ============================================================================
 * RESILIENCE
 * ============================================================================
 *
 * - Each source fetch has a 15-second timeout.
 * - HTTP errors (403, 404, 5xx) are logged and skipped — never fatal.
 * - Parse failures (cheerio can't find expected selectors) log a warning
 *   and return zero results for that source.
 * - The existing file is ONLY overwritten if at least one source produced
 *   results OR --force-manual was passed.
 * - Manual entries always survive regeneration via `"manual": true`.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
const DATA_PATH = join(PROJECT_ROOT, "src", "data", "webinars.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Webinar {
  id: string;
  title: string;
  host: string;
  date: string;
  description: string;
  categories: string[];
  registerUrl: string;
  thumbnailUrl: string | null;
  manual?: boolean;
}

interface WebinarFile {
  dataYear: number;
  webinars: Webinar[];
}

interface ScrapedWebinar {
  title: string;
  host: string;
  date: string;
  description: string;
  categories: string[];
  registerUrl: string;
}

interface WebinarSource {
  name: string;
  url: string;
  scrape: (html: string) => Promise<ScrapedWebinar[]>;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Medical: ["medical", "mdcat", "dental", "pharmacy", "mbbs", "bds", "health"],
  Engineering: ["engineering", "net", "nust", "computing", "cs", "it", "programming"],
  Scholarships: ["scholarship", "financial aid", "grant", "funding", "fellowship", "hecs"],
  "Study Abroad": ["abroad", "study in", "international", "visa", "uk", "usa", "germany", "fulbright", "daad", "british council"],
  "Career Planning": ["career", "jobs", "profession", "guidance", "mentor", "pathway", "explore"],
  Technology: ["tech", "coding", "bootcamp", "ai", "data", "computer", "software", "digital"],
  Business: ["business", "finance", "acca", "accounting", "marketing", "entrepreneur", "management", "economics"],
  "Test Prep": ["ielts", "toefl", "sat", "gre", "gmat", "test prep", "preparation", "exam"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a deterministic ID from title + host */
function makeId(title: string, host: string): string {
  const seed = `${title}-${host}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
  const hash = createHash("md5").update(seed).digest("hex").slice(0, 6);
  return `${seed}-${hash}`;
}

/** Infer categories from title + description text */
function inferCategories(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const matched: string[] = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(cat);
    }
  }
  return matched.length > 0 ? matched : ["Career Planning"];
}

/** Parse a date string into ISO 8601 with PKT timezone. Returns null if unparseable. */
function parseDate(raw: string): string | null {
  if (!raw) return null;

  // Try direct ISO parsing
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    // If no timezone info was provided, assume PKT
    if (!raw.includes("+") && !raw.includes("Z") && !raw.includes("T")) {
      return d.toISOString().replace(/\.\d{3}Z$/, "+05:00");
    }
    // If it has timezone, keep original — otherwise assume PKT
    if (raw.includes("+") || raw.includes("Z")) return raw;
    return d.toISOString().replace(/\.\d{3}Z$/, "+05:00");
  }

  // Try "DD Month YYYY" patterns (common on Pakistani event pages)
  const dayMonthYear = raw.match(/(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i);
  if (dayMonthYear) {
    const timeMatch = raw.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    const hours = timeMatch
      ? parseInt(timeMatch[1]) + (timeMatch[3]?.toLowerCase() === "pm" && parseInt(timeMatch[1]) !== 12 ? 12 : 0)
      : 14; // default 2pm PKT
    const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;
    const month = [
      "january", "february", "march", "april", "may", "june",
      "july", "august", "september", "october", "november", "december",
    ].indexOf(dayMonthYear[2].toLowerCase());
    const dateObj = new Date(parseInt(dayMonthYear[3]), month, parseInt(dayMonthYear[1]), hours, minutes);
    if (!isNaN(dateObj.getTime())) {
      return `${dateObj.toISOString().slice(0, 19)}+05:00`;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Source: British Council Pakistan
// ---------------------------------------------------------------------------

async function scrapeBritishCouncil(html: string): Promise<ScrapedWebinar[]> {
  const $ = cheerio.load(html);
  const results: ScrapedWebinar[] = [];

  // Try event card pattern
  $(".event-card, .events-listing-item, article.event, .node--event").each((_i, el) => {
    const title = $(el).find("h2 a, h3 a, .event-title a, .field--title a").first().text().trim();
    if (!title) return;

    const href = $(el).find("a").first().attr("href") || "";
    const registerUrl = href.startsWith("http") ? href : `https://www.britishcouncil.pk${href}`;
    const dateText = $(el).find(".event-date, .date, time, .field--date").first().text().trim();
    const desc = $(el).find("p, .description, .field--body").first().text().trim().slice(0, 300);

    const date = parseDate(dateText);
    if (!date) return;

    results.push({
      title,
      host: "British Council Pakistan",
      date,
      description: desc || `Event organised by British Council Pakistan: ${title}`,
      categories: inferCategories(title, desc),
      registerUrl: registerUrl || "https://www.britishcouncil.pk/events",
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Source: HEC Pakistan
// ---------------------------------------------------------------------------

async function scrapeHEC(html: string): Promise<ScrapedWebinar[]> {
  const $ = cheerio.load(html);
  const results: ScrapedWebinar[] = [];

  $(".event-item, .events-item, tr.event, .views-row").each((_i, el) => {
    const title = $(el).find("h2 a, h3 a, .title a, a").first().text().trim();
    if (!title || title.length < 5) return;

    const href = $(el).find("a").first().attr("href") || "";
    const registerUrl = href.startsWith("http") ? href : `https://www.hec.gov.pk${href}`;
    const dateText = $(el).find(".date, time, .event-date, span.date").first().text().trim();
    const desc = $(el).find("p, .description, .body").first().text().trim().slice(0, 300);

    const date = parseDate(dateText);
    if (!date) return;

    results.push({
      title,
      host: "Higher Education Commission (HEC) Pakistan",
      date,
      description: desc || `HEC Pakistan event: ${title}`,
      categories: inferCategories(title, desc),
      registerUrl: registerUrl || "https://www.hec.gov.pk/events",
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Source: USEFP / Fulbright
// ---------------------------------------------------------------------------

async function scrapeUSEFP(html: string): Promise<ScrapedWebinar[]> {
  const $ = cheerio.load(html);
  const results: ScrapedWebinar[] = [];

  $(".event, .event-item, .views-row, .node-event, .card-event").each((_i, el) => {
    const title = $(el).find("h2 a, h3 a, .title a, .event-title").first().text().trim();
    if (!title || title.length < 5) return;

    const href = $(el).find("a").first().attr("href") || "";
    const registerUrl = href.startsWith("http") ? href : `https://usefp.org${href}`;
    const dateText = $(el).find(".date, time, .event-date, .field-date").first().text().trim();
    const desc = $(el).find("p, .description, .body, .field-body").first().text().trim().slice(0, 300);

    const date = parseDate(dateText);
    if (!date) return;

    results.push({
      title,
      host: "USEFP (United States Educational Foundation in Pakistan)",
      date,
      description: desc || `Fulbright / USEFP information session: ${title}`,
      categories: inferCategories(title, desc),
      registerUrl: registerUrl || "https://usefp.org/events/",
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Source: DAAD Pakistan
// ---------------------------------------------------------------------------

async function scrapeDAAD(html: string): Promise<ScrapedWebinar[]> {
  const $ = cheerio.load(html);
  const results: ScrapedWebinar[] = [];

  $(".event, .event-item, .views-row, .node-event, article.event").each((_i, el) => {
    const title = $(el).find("h2 a, h3 a, .title a, .event-title, a").first().text().trim();
    if (!title || title.length < 5) return;

    const href = $(el).find("a").first().attr("href") || "";
    const registerUrl = href.startsWith("http") ? href : `https://www.daad.pk${href}`;
    const dateText = $(el).find(".date, time, .event-date, .field-date").first().text().trim();
    const desc = $(el).find("p, .description, .body").first().text().trim().slice(0, 300);

    const date = parseDate(dateText);
    if (!date) return;

    results.push({
      title,
      host: "DAAD Pakistan",
      date,
      description: desc || `DAAD Pakistan information event: ${title}`,
      categories: inferCategories(title, desc),
      registerUrl: registerUrl || "https://www.daad.pk/en/events/",
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Source: P@SHA Pakistan
// ---------------------------------------------------------------------------

async function scrapePasha(html: string): Promise<ScrapedWebinar[]> {
  const $ = cheerio.load(html);
  const results: ScrapedWebinar[] = [];

  $(".event, .event-item, .views-row, .tribe-events-list-event, article").each((_i, el) => {
    const title = $(el).find("h2 a, h3 a, .title a, .event-title, a.tribe-event-url").first().text().trim();
    if (!title || title.length < 5) return;

    const href = $(el).find("a").first().attr("href") || "";
    const registerUrl = href.startsWith("http") ? href : `https://pasha.org.pk${href}`;
    const dateText = $(el).find(".date, time, .event-date, .tribe-event-date, .tribe-events-event-date").first().text().trim();
    const desc = $(el).find("p, .description, .tribe-events-event-description").first().text().trim().slice(0, 300);

    const date = parseDate(dateText);
    if (!date) return;

    results.push({
      title,
      host: "P@SHA Pakistan",
      date,
      description: desc || `P@SHA Pakistan event: ${title}`,
      categories: inferCategories(title, desc),
      registerUrl: registerUrl || "https://pasha.org.pk/events/",
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Source: IDP IELTS Pakistan
// ---------------------------------------------------------------------------

async function scrapeIDPIELTS(html: string): Promise<ScrapedWebinar[]> {
  const $ = cheerio.load(html);
  const results: ScrapedWebinar[] = [];

  $(".event, .event-card, .webinar-card, .card").each((_i, el) => {
    const title = $(el).find("h2 a, h3 a, h4 a, .title a, .card-title, a").first().text().trim();
    if (!title || title.length < 5) return;

    const href = $(el).find("a").first().attr("href") || "";
    const registerUrl = href.startsWith("http") ? href : `https://ielts.idp.com${href}`;
    const dateText = $(el).find(".date, time, .event-date, .date-time").first().text().trim();
    const desc = $(el).find("p, .description, .card-text").first().text().trim().slice(0, 300);

    const date = parseDate(dateText);
    if (!date) return;

    results.push({
      title,
      host: "IDP Education Pakistan",
      date,
      description: desc || `IDP IELTS preparation event: ${title}`,
      categories: inferCategories(title, desc),
      registerUrl: registerUrl || "https://ielts.idp.com/pakistan/prepare",
    });
  });

  return results;
}

// ---------------------------------------------------------------------------
// Source definitions
// ---------------------------------------------------------------------------

const SOURCES: WebinarSource[] = [
  { name: "British Council", url: "https://www.britishcouncil.pk/events", scrape: scrapeBritishCouncil },
  { name: "HEC Pakistan", url: "https://www.hec.gov.pk/events", scrape: scrapeHEC },
  { name: "USEFP / Fulbright", url: "https://usefp.org/events/", scrape: scrapeUSEFP },
  { name: "DAAD Pakistan", url: "https://www.daad.pk/en/events/", scrape: scrapeDAAD },
  { name: "P@SHA Pakistan", url: "https://pasha.org.pk/events/", scrape: scrapePasha },
  { name: "IDP IELTS Pakistan", url: "https://ielts.idp.com/pakistan/prepare", scrape: scrapeIDPIELTS },
];

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

interface FetchResult {
  source: string;
  count: number;
  error?: string;
}

async function fetchAllSources(): Promise<{ results: ScrapedWebinar[]; logs: FetchResult[] }> {
  const allResults: ScrapedWebinar[] = [];
  const logs: FetchResult[] = [];

  for (const source of SOURCES) {
    process.stdout.write(`  Fetching ${source.name}... `);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const response = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; AftermediateBot/1.0; +https://aftermediate.com/bot)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-PK,en;q=0.9,ur;q=0.8",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (!response.ok) {
        process.stdout.write(`HTTP ${response.status} — skipped\n`);
        logs.push({ source: source.name, count: 0, error: `HTTP ${response.status}` });
        continue;
      }

      const html = await response.text();
      if (!html || html.length < 100) {
        process.stdout.write(`empty body — skipped\n`);
        logs.push({ source: source.name, count: 0, error: "empty body" });
        continue;
      }

      const scraped = await source.scrape(html);
      process.stdout.write(`${scraped.length} webinars\n`);
      allResults.push(...scraped);
      logs.push({ source: source.name, count: scraped.length });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      process.stdout.write(`error — ${message}\n`);
      logs.push({ source: source.name, count: 0, error: message });
    }
  }

  return { results: allResults, logs };
}

function validateScraped(webinars: ScrapedWebinar[]): ScrapedWebinar[] {
  return webinars.filter((w) => {
    const issues: string[] = [];
    if (!w.title || w.title.length < 3) issues.push("title");
    if (!w.host || w.host.length < 3) issues.push("host");
    if (!w.date || !parseDate(w.date)) issues.push("date");
    if (!w.registerUrl) issues.push("registerUrl");
    if (w.categories.length === 0) issues.push("categories");

    if (issues.length > 0) {
      console.warn(`  ⚠  Dropped "${w.title.slice(0, 50)}": missing ${issues.join(", ")}`);
      return false;
    }
    return true;
  });
}

function deduplicate(webinars: Webinar[]): Webinar[] {
  const seen = new Set<string>();
  return webinars.filter((w) => {
    const key = `${w.title.toLowerCase().slice(0, 60)}|${w.date.slice(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function convertToOutput(scraped: ScrapedWebinar[]): Webinar[] {
  return scraped.map((s) => ({
    id: makeId(s.title, s.host),
    title: s.title,
    host: s.host,
    date: s.date,
    description: s.description.slice(0, 300),
    categories: [...new Set(s.categories)].slice(0, 4),
    registerUrl: s.registerUrl,
    thumbnailUrl: null,
  }));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  console.log("=".repeat(60));
  console.log("  Webinar Data Fetcher");
  console.log(`  Sources:  ${SOURCES.length}`);
  console.log(`  Dry run:  ${dryRun ? "yes" : "no"}`);
  console.log("=".repeat(60));
  console.log();

  // 1. Load existing data (to preserve manual entries)
  let existingFile: WebinarFile | null = null;
  try {
    if (existsSync(DATA_PATH)) {
      const raw = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as WebinarFile;
      existingFile = raw;
      const manualCount = raw.webinars.filter((w) => w.manual === true).length;
      console.log(`  Loaded existing file: ${raw.webinars.length} entries (${manualCount} manual)`);
    } else {
      console.log(`  No existing file found — will create new`);
    }
  } catch (err) {
    console.warn(`  ⚠  Could not read existing file: ${err}`);
  }
  console.log();

  // 2. Fetch all sources
  console.log("  Fetching sources...");
  const { results: scrapedAll, logs } = await fetchAllSources();
  console.log();

  // 3. Print fetch summary
  console.log("  Fetch summary:");
  for (const l of logs) {
    const icon = l.error ? "✗" : "✓";
    const detail = l.error ?? `${l.count} fetched`;
    console.log(`    ${icon} ${l.source}: ${detail}`);
  }
  const totalFetched = scrapedAll.length;
  console.log(`    ───────────────────────────`);
  console.log(`    Total fetched: ${totalFetched}`);
  console.log();

  // 4. Validate scraped entries
  const validScraped = validateScraped(scrapedAll);
  const droppedCount = totalFetched - validScraped.length;
  if (droppedCount > 0) {
    console.log(`  Validation: ${droppedCount} entries dropped`);
  }
  console.log();

  // 5. Convert to output format
  const autoEntries = convertToOutput(validScraped);
  const hasFreshData = autoEntries.length > 0;

  // 6. Preserve manual entries from existing file
  const manualEntries: Webinar[] = (existingFile?.webinars ?? []).filter((w) => w.manual === true);
  if (manualEntries.length > 0) {
    console.log(`  Preserving ${manualEntries.length} manual entries`);
  }

  // 7. Merge — three scenarios:
  //    a) Fresh data available → merge manual + new auto entries
  //    b) No fresh data, but existing file exists → keep existing file as-is (fallback)
  //    c) No data at all → cannot write
  let merged: Webinar[];
  if (hasFreshData) {
    merged = deduplicate([...manualEntries, ...autoEntries]);
    console.log(`  Merged: ${merged.length} entries (${manualEntries.length} manual, ${autoEntries.length} auto)`);
  } else if (existingFile) {
    merged = existingFile.webinars;
    console.log(`  No fresh data — keeping existing ${existingFile.webinars.length} entries as-is`);
  } else {
    console.log("\n  ⚠  No data fetched and no existing file — skipping write.");
    process.exit(1);
  }

  // 8. Sort by date (ascending)
  merged.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 9. Check if we should write
  const output: WebinarFile = {
    dataYear: new Date().getFullYear(),
    webinars: merged,
  };

  if (dryRun) {
    console.log("\n  [DRY RUN] Would write:");
    console.log(`    Path:    ${DATA_PATH}`);
    console.log(`    Entries: ${output.webinars.length}`);
    console.log(`    Year:    ${output.dataYear}`);
    console.log();
    console.log(`  First 3 entries:`);
    for (const w of output.webinars.slice(0, 3)) {
      console.log(`    - ${w.date.slice(0, 10)}  ${w.title.slice(0, 60)}`);
    }
    console.log();
    console.log("  Done (dry run — no files written).");
    return;
  }

  // 10. Write
  writeFileSync(DATA_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(`\n  Written: ${DATA_PATH}`);
  console.log(`  Entries: ${output.webinars.length}`);

  // 11. Summary
  const upcoming = output.webinars.filter((w) => new Date(w.date).getTime() > Date.now()).length;
  const past = output.webinars.length - upcoming;
  console.log(`  Upcoming: ${upcoming}  |  Past: ${past}`);
  console.log();
  console.log("  Done.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});