// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntryTestHeatmap } from "./entry-test-heatmap";
import * as store from "@/lib/store";

// ── Mock useStudent ──
const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

function mockProfile(stream: string | null) {
  mockUseStudent.mockReturnValue({
    profile: { stream },
    update: vi.fn(),
    reset: vi.fn(),
    hydrated: true,
    hydrate: vi.fn(),
  });
}

// ── Card header ──

it("renders the card header with FineAggregate typography", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText("ENTRY-TEST HEATMAP")).toBeTruthy();
});

// ── Test info label ──

it("shows MDCAT label for pre-medical stream", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/MDCAT —/)).toBeTruthy();
});

it("shows ECAT label for pre-engineering stream", () => {
  mockProfile("pre-engineering");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/ECAT —/)).toBeTruthy();
});

it("shows ECAT label for ics stream", () => {
  mockProfile("ics");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/ECAT —/)).toBeTruthy();
});

// ── Sections start collapsed ──

it("sections start collapsed (no chapter rows visible)", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  // Section headers are visible
  expect(screen.getByText("Biology")).toBeTruthy();
  // But no chapter rows should be visible initially (search for a chapter name)
  expect(screen.queryByText("Cell Biology")).toBeNull();
});

// ── Click section to expand chapters ──

it("clicking a section header reveals its chapter rows", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  const biologyHeader = screen.getByText("Biology");
  await userEvent.click(biologyHeader);
  expect(screen.getByText("Cell Biology")).toBeTruthy();
});

// ── Click chapter opens detail panel ──

it("clicking a chapter opens the detail panel", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  // Expand biology section
  await userEvent.click(screen.getByText("Biology"));
  // Click a chapter
  await userEvent.click(screen.getByText("Cell Biology"));
  // Detail panel shows counts
  expect(screen.getByText(/appearances/i)).toBeTruthy();
});

// ── Chapter click toggles panel off ──

it("clicking the same chapter closes the detail panel", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  await userEvent.click(screen.getByText("Biology"));
  await userEvent.click(screen.getByText("Cell Biology"));
  expect(screen.getByText(/appearances/i)).toBeTruthy();
  // Click again to close — the open panel also shows the chapter name,
  // so target the chapter row (first match in DOM order)
  await userEvent.click(screen.getAllByText("Cell Biology")[0]);
  expect(screen.queryByText(/appearances/i)).toBeNull();
});

// ── Empty state: no stream ──

it("shows empty state when stream is null", () => {
  mockProfile(null);
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/set your stream/i)).toBeTruthy();
});

// ── Empty state: no test for stream ──

it("shows empty state for icom stream", () => {
  mockProfile("icom");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/don't have entry-test data/i)).toBeTruthy();
});

it("shows empty state for alevel stream", () => {
  mockProfile("alevel");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/don't have entry-test data/i)).toBeTruthy();
});

// ── Footer ──

it("renders the footer text", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/Illustrative sample/i)).toBeTruthy();
  expect(screen.getByText(/estimates, not guarantees/i)).toBeTruthy();
});
