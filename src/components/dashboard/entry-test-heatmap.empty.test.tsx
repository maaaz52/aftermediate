// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { EntryTestHeatmap } from "./entry-test-heatmap";
import * as store from "@/lib/store";

vi.mock("@/data/heatmap-mock.json", () => ({ default: {} }));

const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

it("shows empty state 3 when the test config is missing", () => {
  mockUseStudent.mockReturnValue({
    profile: { stream: "pre-medical" },
    update: vi.fn(), reset: vi.fn(), hydrated: true, hydrate: vi.fn(),
  });
  render(<EntryTestHeatmap />);
  expect(screen.getByText(/Heatmap data not available/i)).toBeTruthy();
});
