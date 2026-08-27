import type {
  AbroadCountry,
  AbroadRegion,
  AbroadScholarship,
  AbroadScholarshipCategory,
  AbroadTest,
  AbroadTestKind,
  CityTier,
} from "./types";

export interface CountryFilterOptions {
  query?: string;
  region?: AbroadRegion | "all";
}

export function filterCountries(
  list: AbroadCountry[],
  opts: CountryFilterOptions = {}
): AbroadCountry[] {
  const q = opts.query?.trim().toLowerCase() ?? "";
  const region = opts.region ?? "all";
  return list.filter((c) => {
    if (region !== "all" && c.region !== region) return false;
    if (q) {
      const haystack = [c.name, c.capital, ...c.topFields].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/** Total monthly living cost for a country+tier (PKR/month). */
export function monthlyLivingTotal(c: AbroadCountry, tier: CityTier): number {
  const m = c.living[tier === "big" ? "bigCity" : "smallCity"];
  return m.rent + m.food + m.transport + m.utilities + m.misc;
}

export function sortCountries(
  list: AbroadCountry[],
  by: "cheapest" | "name" = "cheapest"
): AbroadCountry[] {
  const sorted = [...list];
  if (by === "name") return sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted.sort((a, b) => {
    const aCost = monthlyLivingTotal(a, "big") + (a.tuition.ug.min + a.tuition.ug.max) / 2;
    const bCost = monthlyLivingTotal(b, "big") + (b.tuition.ug.min + b.tuition.ug.max) / 2;
    return aCost - bCost;
  });
}

/** Returns known countries in the requested id order, skipping unknown ids and duplicates. */
export function compareCountries(list: AbroadCountry[], ids: string[]): AbroadCountry[] {
  const byId = new Map(list.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const out: AbroadCountry[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    const c = byId.get(id);
    if (c) {
      out.push(c);
      seen.add(id);
    }
  }
  return out;
}

export interface AbroadScholarshipFilterOptions {
  category?: AbroadScholarshipCategory | "all";
  country?: string; // AbroadCountry id; "all" default
  level?: AbroadScholarship["level"] | "all";
  query?: string;
}

export function filterAbroadScholarships(
  list: AbroadScholarship[],
  opts: AbroadScholarshipFilterOptions = {}
): AbroadScholarship[] {
  const category = opts.category ?? "all";
  const country = opts.country ?? "all";
  const level = opts.level ?? "all";
  const q = opts.query?.trim().toLowerCase() ?? "";
  return list.filter((s) => {
    if (category !== "all" && s.category !== category) return false;
    if (country !== "all" && !s.countries.includes(country) && !s.countries.includes("multiple")) {
      return false;
    }
    if (level !== "all" && s.level !== level && s.level !== "multiple") return false;
    if (q) {
      const haystack = [s.name, s.funder, s.coverageDetail, ...s.eligibility].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export interface AbroadTestFilterOptions {
  kind?: AbroadTestKind | "all";
  country?: string; // AbroadCountry id; "all" default
  query?: string;
}

export function filterAbroadTests(
  list: AbroadTest[],
  opts: AbroadTestFilterOptions = {}
): AbroadTest[] {
  const kind = opts.kind ?? "all";
  const country = opts.country ?? "all";
  const q = opts.query?.trim().toLowerCase() ?? "";
  return list.filter((t) => {
    if (kind !== "all" && t.kind !== kind) return false;
    if (country !== "all" && !t.countries.includes(country)) return false;
    if (q) {
      const haystack = [t.name, t.short].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function testsForCountry(list: AbroadTest[], countryId: string): AbroadTest[] {
  return list.filter((t) => t.countries.includes(countryId));
}

/** Cheapest overall country (bigCity living + UG tuition midpoint). Precondition: `list` is non-empty. */
export function cheapestCountry(list: AbroadCountry[]): AbroadCountry {
  if (list.length === 0) throw new Error("cheapestCountry: list must be non-empty");
  return sortCountries(list, "cheapest")[0];
}

/** Country with the longest post-study work window in months. Precondition: `list` is non-empty. */
export function mostGenerousPostStudyWork(list: AbroadCountry[]): AbroadCountry {
  if (list.length === 0) throw new Error("mostGenerousPostStudyWork: list must be non-empty");
  return [...list].sort((a, b) => b.postStudyWorkMonths - a.postStudyWorkMonths)[0];
}

/** Country with the lowest student visa fee. Precondition: `list` is non-empty. */
export function lowestVisaFeeCountry(list: AbroadCountry[]): AbroadCountry {
  if (list.length === 0) throw new Error("lowestVisaFeeCountry: list must be non-empty");
  return [...list].sort((a, b) => a.visa.feePkr - b.visa.feePkr)[0];
}
