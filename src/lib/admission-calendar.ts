import type { PakistanUniversity } from "@/lib/types";

export type AdmissionCalendarConfidence = "confirmed" | "estimated";

export type AdmissionCalendarEvent = {
  id: "announcement" | "application" | "test" | "merit" | "fee" | "intake";
  label: string;
  timing: string;
  detail: string;
  confidence: AdmissionCalendarConfidence;
};

export type AdmissionCalendar = {
  cycle: string;
  sourceUrl: string;
  events: AdmissionCalendarEvent[];
};

type EventInput = Pick<AdmissionCalendarEvent, "id" | "label" | "timing" | "detail">;

function estimated(sourceUrl: string, events: EventInput[]): AdmissionCalendar {
  return {
    cycle: "Typical annual cycle",
    sourceUrl,
    events: events.map((event) => ({ ...event, confidence: "estimated" })),
  };
}

const GENERAL_CYCLE: EventInput[] = [
  { id: "announcement", label: "Admissions announced", timing: "Mar–May", detail: "The next intake and application portal are commonly announced in this window." },
  { id: "application", label: "Applications", timing: "May–Jul", detail: "Complete the online application and submit required documents." },
  { id: "test", label: "Entry test", timing: "Jun–Aug", detail: "University or central entry tests are commonly held during this period." },
  { id: "merit", label: "Merit / offers", timing: "Aug–Sep", detail: "Merit lists or admission offers are commonly released after testing." },
  { id: "fee", label: "Fee submission", timing: "Aug–Sep", detail: "Selected students usually receive a short fee-submission window." },
  { id: "intake", label: "Classes begin", timing: "Aug–Oct", detail: "Most undergraduate fall intakes begin in this period." },
];

const MEDICAL_CYCLE: EventInput[] = [
  { id: "announcement", label: "Admission policy announced", timing: "Jun–Jul", detail: "PM&DC, provincial authorities, NUMS, or colleges publish their cycle guidance." },
  { id: "application", label: "Test registration / applications", timing: "Jul–Aug", detail: "Register for MDCAT/NUMS or the relevant provincial process, then apply to colleges." },
  { id: "test", label: "MDCAT / NUMS test", timing: "Aug–Sep", detail: "The main medical entry test window usually falls here." },
  { id: "merit", label: "Merit lists", timing: "Sep–Nov", detail: "Provisional and final merit lists are commonly issued in this period." },
  { id: "fee", label: "Seat confirmation", timing: "Oct–Nov", detail: "Pay dues and confirm your offered seat by the stated deadline." },
  { id: "intake", label: "Classes begin", timing: "Nov–Jan", detail: "The MBBS/BDS academic intake commonly starts after the merit process." },
];

const NUST_CYCLE: EventInput[] = [
  { id: "announcement", label: "NET series announced", timing: "Nov–Dec", detail: "NUST commonly announces NET series and undergraduate admission information toward year-end." },
  { id: "application", label: "NET registration", timing: "Dec–Jun", detail: "Registration is normally available across multiple NET series." },
  { id: "test", label: "NET series", timing: "Dec–Apr", detail: "NET is usually held in several series before the final admission stage." },
  { id: "merit", label: "Merit lists", timing: "Jul–Aug", detail: "Merit lists are generally issued after the final NET series and application closure." },
  { id: "fee", label: "Fee submission", timing: "Jul–Aug", detail: "Successful applicants must accept their offer and pay within the stated window." },
  { id: "intake", label: "Fall intake", timing: "Aug–Sep", detail: "Undergraduate classes normally begin for the fall semester." },
];

const FAST_CYCLE: EventInput[] = [
  { id: "announcement", label: "Admissions announced", timing: "Apr–May", detail: "FAST-NUCES commonly publishes the undergraduate cycle in spring." },
  { id: "application", label: "Applications", timing: "May–Jun", detail: "Submit the online application and arrange the admission-test fee." },
  { id: "test", label: "NU admission test", timing: "Jul", detail: "The FAST admission test is usually held during July." },
  { id: "merit", label: "Merit / selection", timing: "Aug", detail: "Selected candidates are generally informed after the test and merit process." },
  { id: "fee", label: "Fee submission", timing: "Aug", detail: "Accept the offer and submit dues by the deadline in the admission portal." },
  { id: "intake", label: "Fall intake", timing: "Aug–Sep", detail: "The new undergraduate semester normally begins around this period." },
];

const LUMS_CYCLE: EventInput[] = [
  { id: "announcement", label: "Applications open", timing: "Oct–Nov", detail: "LUMS commonly opens its undergraduate application cycle in autumn." },
  { id: "application", label: "Application deadline", timing: "Jan–Feb", detail: "Submit the application, documents, and financial-aid materials by the published deadline." },
  { id: "test", label: "LCAT / SAT window", timing: "Jan–Feb", detail: "Use a valid SAT score or appear in LCAT when scheduled." },
  { id: "merit", label: "Admission decisions", timing: "Apr–May", detail: "Offers are normally released after holistic application review." },
  { id: "fee", label: "Offer acceptance", timing: "May–Jun", detail: "Accept the offer and meet the stated fee or financial-aid requirements." },
  { id: "intake", label: "Fall intake", timing: "Aug–Sep", detail: "The academic year normally begins in late summer." },
];

/**
 * Exact dates are deliberately not guessed. Until an official cycle announces
 * them, this returns a clearly labelled typical window based on the university
 * and admission route. Confirmed overrides can be added to the catalogue later.
 */
export function admissionCalendarFor(university: PakistanUniversity): AdmissionCalendar {
  if (university.id === "nust") return estimated(university.sourceUrls[0], NUST_CYCLE);
  if (university.id === "fast") return estimated(university.sourceUrls[0], FAST_CYCLE);
  if (university.id === "lums") return estimated(university.sourceUrls[0], LUMS_CYCLE);

  const isMedical = university.streams.includes("pre-medical") && /mdcat|mbbs|medical|nums/i.test(
    `${university.entryTest} ${university.name}`
  );
  return estimated(university.sourceUrls[0], isMedical ? MEDICAL_CYCLE : GENERAL_CYCLE);
}
