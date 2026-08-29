import { describe, expect, it } from "vitest";
import json from "./skills-books.json";

const GENRES = ["design", "development", "business", "freelancing", "writing", "marketing", "data", "mindset"] as const;
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

interface Book {
  id: string;
  title: string;
  author: string;
  genre: (typeof GENRES)[number];
  level: (typeof LEVELS)[number];
  rating: number;
  pages: number;
  year: number;
  free: boolean;
  url: string;
  summary: string;
  whyRead: string;
}

const books = json as unknown as Book[];

describe("skills-books.json", () => {
  it("has at least 30 books with unique ids", () => {
    expect(books.length).toBeGreaterThanOrEqual(30);
    const ids = books.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every book has a valid genre and level", () => {
    for (const b of books) {
      expect(GENRES, b.id).toContain(b.genre);
      expect(LEVELS, b.id).toContain(b.level);
    }
  });

  it("every book has a valid rating, page count, year, and free flag", () => {
    for (const b of books) {
      expect(b.rating, b.id).toBeGreaterThanOrEqual(0);
      expect(b.rating, b.id).toBeLessThanOrEqual(5);
      expect(b.pages, b.id).toBeGreaterThanOrEqual(50);
      expect(b.pages, b.id).toBeLessThanOrEqual(1500);
      expect(b.year, b.id).toBeGreaterThanOrEqual(1980);
      expect(typeof b.free, b.id).toBe("boolean");
    }
  });

  it("every book has non-empty text fields and an https url", () => {
    for (const b of books) {
      expect(b.title.length, b.id).toBeGreaterThan(3);
      expect(b.author.length, b.id).toBeGreaterThan(2);
      expect(b.url.startsWith("https://"), `${b.id}:${b.url}`).toBe(true);
      expect(b.summary.length, b.id).toBeGreaterThan(40);
      expect(b.whyRead.length, b.id).toBeGreaterThan(20);
    }
  });

  it("every genre has at least 3 books", () => {
    for (const g of GENRES) {
      expect(books.filter((b) => b.genre === g).length, g).toBeGreaterThanOrEqual(3);
    }
  });

  it("has at least 8 free books", () => {
    expect(books.filter((b) => b.free).length).toBeGreaterThanOrEqual(8);
  });
});
