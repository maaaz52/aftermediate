import abroadScholarships from "@/data/abroad-scholarships.json";
import pakistanScholarships from "@/data/pakistan-scholarships.json";
import universities from "@/data/pakistan-universities.json";
import type { FollowEntityType } from "@/lib/source-follow";

export type ChecklistTask = { id: string; title: string; detail: string };

type UniversityCatalogue = { universities: { id: string; admissionSteps: { title: string; detail: string }[] }[] };
type ScholarshipCatalogue = { scholarships: { id: string; documentsRequired?: string[]; howToApply?: string[] }[] };

function genericTasks(): ChecklistTask[] {
  return [
    { id: "official-source", title: "Read the official source", detail: "Confirm the current cycle, eligibility, and dates before acting." },
    { id: "eligibility", title: "Check your eligibility", detail: "Compare your profile, marks, and documents against the official requirements." },
  ];
}

export function applicationChecklist(type: FollowEntityType, id: string): ChecklistTask[] {
  if (type === "university") {
    const university = (universities as unknown as UniversityCatalogue).universities.find((item) => item.id === id);
    if (!university) return genericTasks();
    return university.admissionSteps.map((step, index) => ({ id: `admission-${index + 1}`, title: step.title, detail: step.detail }));
  }

  const scholarship = [
    ...(pakistanScholarships as unknown as ScholarshipCatalogue).scholarships,
    ...(abroadScholarships as unknown as ScholarshipCatalogue).scholarships,
  ].find((item) => item.id === id);
  if (!scholarship) return genericTasks();
  const documents = (scholarship.documentsRequired ?? []).map((document, index) => ({
    id: `document-${index + 1}`,
    title: `Prepare: ${document}`,
    detail: "Keep a clear, current copy ready for the application.",
  }));
  const actions = (scholarship.howToApply ?? []).map((step, index) => ({
    id: `application-${index + 1}`,
    title: step,
    detail: "Complete this on the official application route.",
  }));
  return [...documents, ...actions].slice(0, 12).length > 0 ? [...documents, ...actions].slice(0, 12) : genericTasks();
}

export function validCompletedTaskIds(type: FollowEntityType, id: string, value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 50 || value.some((item) => typeof item !== "string" || item.length > 120)) return null;
  const allowed = new Set(applicationChecklist(type, id).map((task) => task.id));
  const unique = [...new Set(value as string[])];
  return unique.every((taskId) => allowed.has(taskId)) ? unique : null;
}

