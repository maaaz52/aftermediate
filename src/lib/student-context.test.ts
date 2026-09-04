import { describe, expect, it } from "vitest";

import {
  buildStudentContext,
  formatStudentContext,
  sanitizeField,
  type ProfileRow,
} from "@/lib/student-context";

const marks = (obtained: number, total = 1100) => ({
  matricObtained: 0,
  matricTotal: 1100,
  fscObtained: obtained,
  fscTotal: total,
});

describe("buildStudentContext", () => {
  it("returns null for a row with nothing usable so an un-onboarded student gets no block", () => {
    expect(buildStudentContext({})).toBeNull();
    expect(buildStudentContext(null)).toBeNull();
    expect(buildStudentContext(undefined)).toBeNull();
  });

  it("treats quiz answers as the source of truth over the mirrored columns", () => {
    const ctx = buildStudentContext({
      city: "Karachi",
      budget: "25000",
      quiz: { city: "Lahore", budgetMonthly: 50000 },
    });

    expect(ctx).toMatchObject({ city: "Lahore", budgetMonthly: 50000 });
  });

  it("falls back to the mirrored city and budget columns when quiz omits them", () => {
    const ctx = buildStudentContext({ city: "Multan", budget: "40000", quiz: {} });

    expect(ctx).toMatchObject({ city: "Multan", budgetMonthly: 40000 });
  });

  it("drops a mirrored budget that is not a number instead of inventing one", () => {
    const ctx = buildStudentContext({ budget: "rich", quiz: null });

    expect(ctx?.budgetMonthly).toBeUndefined();
  });

  it("derives fscPct from the marksheet", () => {
    const ctx = buildStudentContext({ marks: marks(960, 1100) });

    expect(ctx?.fscPct).toBeCloseTo(87.3, 1);
  });

  it("ignores the seeded zero marksheet rather than reporting a real 0%", () => {
    // The store seeds fscObtained: 0, so a student who never entered marks
    // would otherwise be told their score is 0%.
    expect(buildStudentContext({ marks: marks(0) })).toBeNull();
  });

  it("keeps a percentage that genuinely rounds to zero", () => {
    const ctx = buildStudentContext({ marks: marks(3, 1100) });

    expect(ctx?.fscPct).toBe(0.3);
  });

  it("clamps a percentage above 100 when obtained exceeds total", () => {
    const ctx = buildStudentContext({ marks: marks(1200, 1100) });

    expect(ctx?.fscPct).toBe(100);
  });

  it("rejects a stream outside the quiz options", () => {
    expect(buildStudentContext({ stream: "pre-medical" })?.stream).toBe("pre-medical");
    expect(buildStudentContext({ stream: "law" })?.stream).toBeUndefined();
    expect(buildStudentContext({ stream: 42 })?.stream).toBeUndefined();
  });

  it("keeps only interests that match the quiz options", () => {
    const ctx = buildStudentContext({
      interests: ["Medicine & Healthcare", "Skydiving", { nested: true }],
    });

    expect(ctx?.interests).toEqual(["Medicine & Healthcare"]);
  });

  it("reads nothing beyond the seven columns it is allowed to see", () => {
    const allowed = ["name", "stream", "marks", "interests", "city", "budget", "quiz"];
    const snooping = new Set<string>();
    const row = new Proxy(
      { name: "Ayesha", stream: "ics" } as Record<string, unknown>,
      {
        get(target, prop: string) {
          if (!allowed.includes(prop)) {
            snooping.add(prop);
            throw new Error(`chat context read a column it has no business repeating: ${prop}`);
          }
          return target[prop];
        },
      }
    ) as ProfileRow;

    expect(buildStudentContext(row)).toMatchObject({ name: "Ayesha", stream: "ics" });
    expect([...snooping]).toEqual([]);
  });
});

describe("sanitizeField", () => {
  it("flattens newlines and control characters into single spaces", () => {
    expect(sanitizeField("ali\n\r\u0000 bash", 40)).toBe("ali bash");
  });

  it("caps the length so one field cannot carry an essay", () => {
    const out = sanitizeField("a".repeat(500), 40);

    expect(out).toHaveLength(40);
  });

  it("returns undefined for anything that is not a usable string", () => {
    expect(sanitizeField("   ", 40)).toBeUndefined();
    expect(sanitizeField(null, 40)).toBeUndefined();
    expect(sanitizeField({ evil: true }, 40)).toBeUndefined();
  });
});

describe("formatStudentContext", () => {
  it("renders an explicit 0% instead of dropping the line", () => {
    expect(formatStudentContext({ fscPct: 0 })).toContain("FSc: 0%");
  });

  it("omits a line entirely for a value the student never gave", () => {
    const out = formatStudentContext({ stream: "ics" });

    expect(out).toContain("Stream: ics");
    expect(out).not.toContain("FSc");
    expect(out).not.toContain("City");
    expect(out).not.toContain("undefined");
    expect(out).not.toContain("null");
  });

  it("groups the budget into thousands without a locale dependency", () => {
    expect(formatStudentContext({ budgetMonthly: 1250000 })).toContain("PKR 1,250,000");
  });

  it("returns an empty string when there is no context to inject", () => {
    expect(formatStudentContext(null)).toBe("");
  });

  it("prints no uuid when a full profile row goes through the pipeline", () => {
    const uuid = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
    const row: Record<string, unknown> = {
      id: uuid,
      name: "Ayesha",
      stream: "pre-medical",
      marks: marks(960, 1100),
      interests: ["Medicine & Healthcare"],
      city: "Lahore",
      budget: "50000",
      quiz: { budgetMonthly: 50000, dreamField: "molecular oncology" },
      avatar_style: "adventurer",
      avatar_seed: uuid,
      education: [{ id: uuid, degree: "FSc" }],
    };
    const out = formatStudentContext(buildStudentContext(row));

    expect(out).toContain("Ayesha");
    expect(out).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  });
});
