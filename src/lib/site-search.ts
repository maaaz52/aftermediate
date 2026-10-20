import pakistanUniversitiesJson from "@/data/pakistan-universities.json";
import { SITE_PAGES } from "@/data/site-pages";
import type { PakistanUniversity } from "@/lib/types";

export type SiteSearchResult = {
  id: string;
  label: string;
  detail: string;
  href: string;
  kind: "university" | "page";
};

type RankedResult = SiteSearchResult & { searchText: string };

const universities = (pakistanUniversitiesJson as { universities: PakistanUniversity[] }).universities;

const INDEX: RankedResult[] = [
  ...universities.map((university) => ({
    id: `university:${university.id}`,
    label: university.name,
    detail: `${university.short} · ${university.city}`,
    href: `/pakistan/universities/${university.id}`,
    kind: "university" as const,
    searchText: [
      university.name,
      university.short,
      university.city,
      university.entryTest,
      ...university.bestFields.map((field) => field.field),
    ]
      .join(" ")
      .toLocaleLowerCase(),
  })),
  ...SITE_PAGES.map((page) => ({
    id: `page:${page.href}`,
    label: page.label,
    detail: page.purpose,
    href: page.href,
    kind: "page" as const,
    searchText: `${page.label} ${page.purpose}`.toLocaleLowerCase(),
  })),
];

function score(result: RankedResult, query: string) {
  const label = result.label.toLocaleLowerCase();
  const detail = result.detail.toLocaleLowerCase();
  if (result.kind === "university" && detail.split(/\W+/).includes(query)) return 0;
  if (label.startsWith(query)) return 1;
  if (label.split(/\s+/).some((word) => word.startsWith(query))) return 2;
  return result.searchText.includes(query) ? 3 : Number.POSITIVE_INFINITY;
}

/** Returns a compact, deterministic list for the global navigation combobox. */
export function searchSite(query: string, limit = 8): SiteSearchResult[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (normalized.length < 2) return [];

  return INDEX
    .map((result) => ({ result, score: score(result, normalized) }))
    .filter(({ score: resultScore }) => Number.isFinite(resultScore))
    .sort((a, b) => a.score - b.score || a.result.label.localeCompare(b.result.label))
    .slice(0, limit)
    .map(({ result }) => ({
      id: result.id,
      label: result.label,
      detail: result.detail,
      href: result.href,
      kind: result.kind,
    }));
}
