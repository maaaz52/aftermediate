import universitiesJson from "@/data/pakistan-universities.json";
import { admissionCalendarFor, withConfirmedAdmissionDates, type ConfirmedAdmissionCalendarEvent } from "@/lib/admission-calendar";
import type { PakistanUniversity } from "@/lib/types";

type UniversityCatalogue = { universities: PakistanUniversity[] };

export type PersonalCalendarFollow = { entityType: "university" | "scholarship"; entityId: string };
export type PersonalCalendarDeadline = PersonalCalendarFollow & { label: string; dueDate: string; officialUrl: string };

export type PersonalCalendarEvent = {
  id: string;
  label: string;
  timing: string;
  detail: string;
  confidence: "confirmed" | "estimated";
  sourceUrl: string;
};

export type PersonalCalendarItem = {
  entityType: "university" | "scholarship";
  entityId: string;
  name: string;
  href: string;
  events: PersonalCalendarEvent[];
};

const universities = (universitiesJson as unknown as UniversityCatalogue).universities;

/** Builds a transparent calendar: official dates override useful, labelled planning estimates. */
export function personalApplicationCalendar(
  follows: PersonalCalendarFollow[],
  confirmed: Record<string, ConfirmedAdmissionCalendarEvent[]>,
  deadlines: PersonalCalendarDeadline[]
): PersonalCalendarItem[] {
  const deadlineByEntity = new Map<string, PersonalCalendarDeadline[]>();
  for (const deadline of deadlines) {
    const key = `${deadline.entityType}:${deadline.entityId}`;
    deadlineByEntity.set(key, [...(deadlineByEntity.get(key) ?? []), deadline]);
  }

  return follows.flatMap((follow): PersonalCalendarItem[] => {
    const key = `${follow.entityType}:${follow.entityId}`;
    const exactDeadlines = (deadlineByEntity.get(key) ?? []).map((deadline) => ({
      id: `deadline:${deadline.label}:${deadline.dueDate}`,
      label: deadline.label,
      timing: deadline.dueDate,
      detail: "Exact date reviewed from an official source.",
      confidence: "confirmed" as const,
      sourceUrl: deadline.officialUrl,
    }));

    if (follow.entityType === "university") {
      const university = universities.find((item) => item.id === follow.entityId);
      if (!university) return [];
      const calendar = withConfirmedAdmissionDates(admissionCalendarFor(university), confirmed[follow.entityId] ?? []);
      return [{
        entityType: follow.entityType,
        entityId: follow.entityId,
        name: university.name,
        href: `/pakistan/universities/${university.id}`,
        events: [...exactDeadlines, ...calendar.events.map((event) => ({
          id: event.id,
          label: event.label,
          timing: event.timing,
          detail: event.detail,
          confidence: event.confidence,
          sourceUrl: event.confidence === "confirmed" ? (confirmed[follow.entityId]?.find((item) => item.eventType === event.id)?.sourceUrl ?? calendar.sourceUrl) : calendar.sourceUrl,
        }))],
      }];
    }

    // Scholarship listings only enter this calendar when an exact, reviewed
    // deadline exists. We never invent a scholarship deadline window.
    if (exactDeadlines.length === 0) return [];
    return [{
      entityType: follow.entityType,
      entityId: follow.entityId,
      name: follow.entityId,
      href: "/dashboard",
      events: exactDeadlines,
    }];
  });
}
