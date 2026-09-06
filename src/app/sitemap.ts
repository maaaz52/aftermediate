import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import pakistanUniversities from "@/data/pakistan-universities.json";
import entryTests from "@/data/entry-tests.json";
import pakistanScholarships from "@/data/pakistan-scholarships.json";
import abroadCountries from "@/data/abroad-countries.json";
import abroadScholarships from "@/data/abroad-scholarships.json";
import abroadTests from "@/data/abroad-tests.json";

const page = (path: string): MetadataRoute.Sitemap[number] => ({ url: `${SITE_URL}${path}` });

/**
 * Public, indexable routes. Auth pages, logged-in tools (chat, calculators,
 * exam runners), lecture players and other app-only screens are excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    "/",
    "/terms",
    "/privacy",
    "/cookies",
    "/disclaimer",
    "/data-deletion",
    "/refund-policy",
    "/community-policy",
  ];

  const uniData = pakistanUniversities as unknown as { universities: { id: string }[] };
  const testData = entryTests as unknown as { tests: { id: string }[] };
  const pkSchol = pakistanScholarships as unknown as { scholarships: { id: string }[] };
  const countryData = abroadCountries as unknown as { countries: { id: string }[] };
  const abSchol = abroadScholarships as unknown as { scholarships: { id: string }[] };
  const abTestData = abroadTests as unknown as { tests: { id: string }[] };

  return [
    ...staticPages.map(page),
    page("/pakistan/universities"),
    ...uniData.universities.map((u) => page(`/pakistan/universities/${u.id}`)),
    page("/pakistan/entry-tests"),
    ...testData.tests.map((t) => page(`/pakistan/entry-tests/${t.id}`)),
    page("/pakistan/scholarships"),
    ...pkSchol.scholarships.map((s) => page(`/pakistan/scholarships/${s.id}`)),
    page("/abroad/countries"),
    ...countryData.countries.map((c) => page(`/abroad/countries/${c.id}`)),
    page("/abroad/scholarships"),
    ...abSchol.scholarships.map((s) => page(`/abroad/scholarships/${s.id}`)),
    page("/abroad/test-prep"),
    ...abTestData.tests.map((t) => page(`/abroad/test-prep/${t.id}`)),
    page("/abroad/ivy-league"),
    page("/skills/books"),
    page("/skills/courses"),
    page("/skills/clients"),
    page("/skills/platforms"),
    page("/college-essays"),
    page("/mentors"),
  ];
}