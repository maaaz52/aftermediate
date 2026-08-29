import { describe, expect, it } from "vitest";
import json from "./skills-platforms.json";

const KINDS = ["marketplace", "showcase", "agency"] as const;

interface Platform {
  id: string;
  name: string;
  kind: (typeof KINDS)[number];
  fee: number;
  competition: number;
  newcomerFriendly: number;
  payoutMethods: string[];
  minWithdrawalUsd: number;
  avgEarningsNote: string;
  niches: string[];
  pros: string[];
  cons: string[];
  tips: string[];
  url: string;
  pkrFriendly: boolean;
}

const platforms = json as unknown as Platform[];

describe("skills-platforms.json", () => {
  it("has exactly 12 platforms with unique ids", () => {
    expect(platforms.length).toBe(12);
    const ids = platforms.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every platform has a valid kind, fee, competition, and newcomer-friendliness", () => {
    for (const p of platforms) {
      expect(KINDS, p.id).toContain(p.kind);
      expect(p.fee, p.id).toBeGreaterThanOrEqual(0);
      expect(p.fee, p.id).toBeLessThanOrEqual(100);
      expect(p.competition, p.id).toBeGreaterThanOrEqual(1);
      expect(p.competition, p.id).toBeLessThanOrEqual(5);
      expect(p.newcomerFriendly, p.id).toBeGreaterThanOrEqual(1);
      expect(p.newcomerFriendly, p.id).toBeLessThanOrEqual(5);
    }
  });

  it("every platform has payout info and Pakistan payout compatibility", () => {
    for (const p of platforms) {
      expect(p.payoutMethods.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.minWithdrawalUsd, p.id).toBeGreaterThanOrEqual(0);
      expect(p.avgEarningsNote.length, p.id).toBeGreaterThan(20);
      expect(typeof p.pkrFriendly, p.id).toBe("boolean");
    }
  });

  it("every platform has niches, pros, cons, tips, and an https url", () => {
    for (const p of platforms) {
      expect(p.niches.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.pros.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.cons.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.tips.length, p.id).toBeGreaterThanOrEqual(2);
      expect(p.url.startsWith("https://"), `${p.id}:${p.url}`).toBe(true);
    }
  });

  it("has at least 4 Pakistan-friendly platforms, 8 marketplaces, and 2 showcases", () => {
    expect(platforms.filter((p) => p.pkrFriendly).length).toBeGreaterThanOrEqual(4);
    expect(platforms.filter((p) => p.kind === "marketplace").length).toBeGreaterThanOrEqual(8);
    expect(platforms.filter((p) => p.kind === "showcase").length).toBeGreaterThanOrEqual(2);
  });
});
