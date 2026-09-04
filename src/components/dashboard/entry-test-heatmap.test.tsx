// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EntryTestHeatmap } from "./entry-test-heatmap";
import * as store from "@/lib/store";

const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); });

function mockProfile(stream: string | null) {
  mockUseStudent.mockReturnValue({
    profile: { stream },
    update: vi.fn(),
    reset: vi.fn(),
    hydrated: true,
    hydrate: vi.fn(),
  });
}

it("renders the heatmap header", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/entry-test heatmap/i)).toBeTruthy();
});

it("shows test name for pre-medical", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/MDCAT/)).toBeTruthy();
});

it("shows test name for pre-engineering", () => {
  mockProfile("pre-engineering");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/ECAT/)).toBeTruthy();
});

it("renders legend labels", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText("Rarely")).toBeTruthy();
  expect(screen.getAllByText("Occasional").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Frequent").length).toBeGreaterThan(0);
});

it("renders section labels", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText("Biology")).toBeTruthy();
});

it("renders chapter cells as buttons", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  const cells = screen.getAllByRole("button");
  const cellTitles = cells.map((c) => c.getAttribute("title")).filter(Boolean);
  expect(cellTitles.length).toBeGreaterThan(0);
});

it("clicking a cell opens the detail panel", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  const cell = screen.getByTitle("Cell Biology — Biology");
  await userEvent.click(cell);
  expect(screen.getByText(/last 3 years/i)).toBeTruthy();
});

it("clicking the same cell closes the detail panel", async () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  const cell = screen.getByTitle("Cell Biology — Biology");
  await userEvent.click(cell);
  expect(screen.getByText(/last 3 years/i)).toBeTruthy();
  await userEvent.click(cell);
  expect(screen.queryByText(/last 3 years/i)).toBeNull();
});

it("shows all test tabs when stream is null", () => {
  mockProfile(null);
  render(<EntryTestHeatmap />);
  expect(screen.getByText("NET")).toBeTruthy();
  expect(screen.getByText("MDCAT")).toBeTruthy();
  expect(screen.getByText("ECAT")).toBeTruthy();
});

it("shows all test tabs for any stream", () => {
  mockProfile("icom");
  render(<EntryTestHeatmap />);
  expect(screen.getByText("NET")).toBeTruthy();
  expect(screen.getByText("MDCAT")).toBeTruthy();
  expect(screen.getByText("ECAT")).toBeTruthy();
});

it("renders the footer text", () => {
  mockProfile("pre-medical");
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/estimates, not guarantees/i)).toBeTruthy();
});
