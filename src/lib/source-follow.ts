import universitiesJson from "@/data/pakistan-universities.json";
import pakistanScholarshipsJson from "@/data/pakistan-scholarships.json";
import abroadScholarshipsJson from "@/data/abroad-scholarships.json";
import type { AbroadScholarship, PakistanScholarship, PakistanUniversity } from "@/lib/types";

export const FOLLOW_ENTITY_TYPES = ["university", "scholarship"] as const;
export type FollowEntityType = (typeof FOLLOW_ENTITY_TYPES)[number];

type UniversityCatalogue = { universities: PakistanUniversity[] };
type PakistanScholarshipCatalogue = { scholarships: PakistanScholarship[] };
type AbroadScholarshipCatalogue = { scholarships: AbroadScholarship[] };

export type FollowEntityDetail = {
  name: string;
  href: string;
  kindLabel: "University" | "Scholarship";
};

const universityIds = new Set(
  (universitiesJson as unknown as UniversityCatalogue).universities.map((university) => university.id)
);
const scholarshipIds = new Set([
  ...(pakistanScholarshipsJson as unknown as PakistanScholarshipCatalogue).scholarships.map((scholarship) => scholarship.id),
  ...(abroadScholarshipsJson as unknown as AbroadScholarshipCatalogue).scholarships.map((scholarship) => scholarship.id),
]);

export function isFollowEntityType(value: unknown): value is FollowEntityType {
  return typeof value === "string" && (FOLLOW_ENTITY_TYPES as readonly string[]).includes(value);
}

/** Only known catalogue entries can be followed. This keeps the follows table useful for future alerts. */
export function isFollowableEntity(type: FollowEntityType, id: unknown): id is string {
  if (typeof id !== "string" || id.length === 0 || id.length > 120) return false;
  return type === "university" ? universityIds.has(id) : scholarshipIds.has(id);
}

export function followEntityDetail(type: FollowEntityType, id: string): FollowEntityDetail | null {
  if (type === "university") {
    const university = (universitiesJson as unknown as UniversityCatalogue).universities.find((item) => item.id === id);
    return university ? { name: university.name, href: `/pakistan/universities/${id}`, kindLabel: "University" } : null;
  }
  const pakistanScholarship = (pakistanScholarshipsJson as unknown as PakistanScholarshipCatalogue).scholarships.find((item) => item.id === id);
  if (pakistanScholarship) return { name: pakistanScholarship.name, href: `/pakistan/scholarships/${id}`, kindLabel: "Scholarship" };
  const abroadScholarship = (abroadScholarshipsJson as unknown as AbroadScholarshipCatalogue).scholarships.find((item) => item.id === id);
  return abroadScholarship ? { name: abroadScholarship.name, href: `/abroad/scholarships/${id}`, kindLabel: "Scholarship" } : null;
}

