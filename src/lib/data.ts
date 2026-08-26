import type {
  AbroadDestination,
  Course,
  Major,
  RealityCheck,
  Scholarship,
  University,
} from "./types";

import mdcat from "@/data/mdcat.json";
import universities from "@/data/universities.json";
import jobs from "@/data/jobs.json";
import industry from "@/data/industry.json";
import abroad from "@/data/abroad.json";
import scholarships from "@/data/scholarships.json";
import courses from "@/data/courses.json";
import realitychecks from "@/data/realitychecks.json";
import majorsHealth from "@/data/majors-health.json";
import majorsTech from "@/data/majors-tech.json";

export const data = {
  mdcat,
  jobs,
  industry,
  abroad,
  realities: realitychecks as unknown as RealityCheck[],
  scholarships: scholarships as unknown as Scholarship[],
  courses: courses as unknown as Course[],
  universities: universities as unknown as University[],
  majors: [...majorsHealth, ...majorsTech] as unknown as Major[],
  destinations: (abroad as unknown as { destinations: AbroadDestination[] }).destinations,
};

export function getMajorsByStream(stream: string): Major[] {
  return data.majors.filter((m) => m.streams.includes(stream as Major["streams"][number]));
}

export function getMajor(id: string): Major | undefined {
  return data.majors.find((m) => m.id === id);
}

export function getUniversitiesForStream(stream: string): University[] {
  return data.universities.filter((u) => u.streams.includes(stream as University["streams"][number]));
}

export function getRealityCheck(id: string): RealityCheck | undefined {
  return data.realities.find((r) => r.id === id);
}

export function getCourses(ids: string[]): Course[] {
  return data.courses.filter((c) => ids.includes(c.id));
}
