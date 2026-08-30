import { describe, it, expect } from "vitest";
import {
  computeHeatmap,
  getStreamTest,
  getTier,
  getTrend,
  type HeatmapTestConfig,
} from "./heatmap-model";

// ── Test fixture ──
const simpleConfig: HeatmapTestConfig = {
  id: "test",
  name: "Test Exam",
  shortName: "TE",
  totalQuestionsPerYear: 100,
  years: ["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"],
  sections: [
    {
      id: "physics",
      name: "Physics",
      totalQuestions: 50,
      chapters: [
        { id: "p1", name: "Motion & Force", appearances3yr: 18, appearances5yr: 32, appearances10yr: 60, trend: "up" },
        { id: "p2", name: "Optics", appearances3yr: 2, appearances5yr: 8, appearances10yr: 25, trend: "down" },
        { id: "p3", name: "Waves", appearances3yr: 8, appearances5yr: 18, appearances10yr: 40, trend: "stable" },
      ],
    },
  ],
};

// ── getStreamTest ──

it("getStreamTest: pre-medical maps to mdcat", () => {
  expect(getStreamTest("pre-medical")).toBe("mdcat");
});

it("getStreamTest: pre-engineering maps to ecat", () => {
  expect(getStreamTest("pre-engineering")).toBe("ecat");
});

it("getStreamTest: ics maps to ecat", () => {
  expect(getStreamTest("ics")).toBe("ecat");
});

it("getStreamTest: icom maps to null", () => {
  expect(getStreamTest("icom")).toBeNull();
});

it("getStreamTest: alevel maps to null", () => {
  expect(getStreamTest("alevel")).toBeNull();
});

it("getStreamTest: null stream maps to null", () => {
  expect(getStreamTest(null)).toBeNull();
});

// ── getTier ──

it("getTier: below 0.03 is danger", () => {
  expect(getTier(0)).toBe("danger");
  expect(getTier(0.02)).toBe("danger");
  expect(getTier(0.02999)).toBe("danger");
});

it("getTier: 0.03 to 0.09 is amber", () => {
  expect(getTier(0.03)).toBe("amber");
  expect(getTier(0.05)).toBe("amber");
  expect(getTier(0.09)).toBe("amber");
});

it("getTier: above 0.09 is emerald", () => {
  expect(getTier(0.091)).toBe("emerald");
  expect(getTier(0.15)).toBe("emerald");
  expect(getTier(1)).toBe("emerald");
});

// ── getTrend ──

it("getTrend: recent > 1.2× older is up", () => {
  expect(getTrend(10, 5)).toBe("up");
  expect(getTrend(6, 4.9)).toBe("up");
  expect(getTrend(12, 9)).toBe("up");
});

it("getTrend: recent < 0.8× older is down", () => {
  expect(getTrend(4, 6)).toBe("down");
  expect(getTrend(3, 5)).toBe("down");
  expect(getTrend(5.9, 8)).toBe("down");
});

it("getTrend: within 0.8–1.2× is stable", () => {
  expect(getTrend(5, 5)).toBe("stable");
  expect(getTrend(6, 5.5)).toBe("stable");
  expect(getTrend(8, 10)).toBe("stable");
});

// ── computeHeatmap ──

it("computeHeatmap returns correct section and chapter structure", () => {
  const result = computeHeatmap(simpleConfig);
  expect(result.sections).toHaveLength(1);
  expect(result.sections[0].chapters).toHaveLength(3);
  expect(result.testName).toBe("Test Exam");
  expect(result.testYears).toEqual(["2017","2018","2019","2020","2021","2022","2023","2024","2025","2026"]);
});

it("computeHeatmap: chapter with high recent appearances gets high probability", () => {
  const result = computeHeatmap(simpleConfig);
  const motion = result.sections[0].chapters.find((c) => c.id === "p1")!;
  // weighted = 18×3 + 32×2 + 60×1 = 54 + 64 + 60 = 178
  // section weighted = (18+2+8)×3 + (32+8+18)×2 + (60+25+40)×1 + smoothing
  // = 28×3 + 58×2 + 125×1 + 3×1 = 84 + 116 + 125 + 3 = 328
  // prob = (178+1)/(328) ≈ 0.546
  expect(motion.probability).toBeGreaterThan(0.5);
  expect(motion.probability).toBeLessThan(0.6);
  expect(motion.tier).toBe("emerald");
  expect(motion.trend).toBe("up");
});

it("computeHeatmap: chapter with low recent appearances gets low probability", () => {
  const result = computeHeatmap(simpleConfig);
  const optics = result.sections[0].chapters.find((c) => c.id === "p2")!;
  // weighted = 2×3 + 8×2 + 25×1 = 6 + 16 + 25 = 47
  // prob = (47+1)/(328) ≈ 0.146
  expect(optics.probability).toBeGreaterThan(0.1);
  expect(optics.probability).toBeLessThan(0.2);
  expect(optics.tier).toBe("emerald");
});

it("computeHeatmap: smoothing prevents zero probabilities", () => {
  const zeroConfig: HeatmapTestConfig = {
    ...simpleConfig,
    sections: [{
      ...simpleConfig.sections[0],
      chapters: [
        { id: "p-zero", name: "Zero Chapter", appearances3yr: 0, appearances5yr: 0, appearances10yr: 0, trend: "stable" },
        { id: "p-nonzero", name: "Non-Zero Chapter", appearances3yr: 5, appearances5yr: 10, appearances10yr: 20, trend: "stable" },
      ],
    }],
  };
  const result = computeHeatmap(zeroConfig);
  const zero = result.sections[0].chapters.find((c) => c.id === "p-zero")!;
  expect(zero.probability).toBeGreaterThan(0);
  expect(zero.tier).toBe("danger");
});

it("computeHeatmap: custom smoothing parameter works", () => {
  const zeroConfig: HeatmapTestConfig = {
    ...simpleConfig,
    sections: [{
      ...simpleConfig.sections[0],
      chapters: [
        { id: "p-zero", name: "Zero Chapter", appearances3yr: 0, appearances5yr: 0, appearances10yr: 0, trend: "stable" },
      ],
    }],
  };
  const result = computeHeatmap(zeroConfig, { smoothing: 5 });
  const zero = result.sections[0].chapters.find((c) => c.id === "p-zero")!;
  expect(zero.probability).toBeGreaterThan(0);
});

it("computeHeatmap: returned chapter includes appearances counts", () => {
  const result = computeHeatmap(simpleConfig);
  const waves = result.sections[0].chapters.find((c) => c.id === "p3")!;
  expect(waves.appearances3yr).toBe(8);
  expect(waves.appearances5yr).toBe(18);
  expect(waves.appearances10yr).toBe(40);
});
