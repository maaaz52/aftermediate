// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

const html2canvas = vi.hoisted(() => vi.fn(async () => ({ toDataURL: () => "data:image/png;base64,x" })));
const html2pdf = vi.hoisted(() => vi.fn(() => ({ set: vi.fn(() => ({ from: vi.fn(() => ({ save: vi.fn(async () => {}) })) })) })));
const anchorClick = vi.hoisted(() => vi.fn());

vi.mock("html2canvas", () => ({ default: html2canvas }));
vi.mock("html2pdf.js", () => ({ default: html2pdf }));

import { ShareStoryCard } from "./share-story-card";

const props = {
  name: "Hira Ahmed",
  tone: "loved" as const,
  rating: 9,
  quote: "The roadmap changed how I plan my week.",
  personas: ["students"],
  date: "2026-08-31",
};

describe("ShareStoryCard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the card summary", () => {
    render(<ShareStoryCard {...props} />);
    expect(screen.getByText("Hira Ahmed")).toBeInTheDocument();
    expect(screen.getByText(/roadmap changed how i plan/i)).toBeInTheDocument();
    expect(screen.getByText((_, el) => el?.textContent === "9/10")).toBeInTheDocument();
  });

  it("downloads a PNG via html2canvas", async () => {
    const user = userEvent.setup();
    // Only intercept <a> — React itself creates elements via document.createElement during render
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation(
      ((tag: string, options?: ElementCreationOptions) =>
        tag === "a" ? ({ click: anchorClick } as unknown as HTMLElement) : realCreateElement(tag, options)) as typeof document.createElement
    );
    render(<ShareStoryCard {...props} />);
    await user.click(screen.getByRole("button", { name: /download png/i }));
    await vi.dynamicImportSettled();
    expect(html2canvas).toHaveBeenCalled();
    expect(anchorClick).toHaveBeenCalled();
  });

  it("downloads a PDF via html2pdf", async () => {
    const user = userEvent.setup();
    render(<ShareStoryCard {...props} />);
    await user.click(screen.getByRole("button", { name: /download pdf/i }));
    await vi.dynamicImportSettled();
    expect(html2pdf).toHaveBeenCalled();
  });
});
