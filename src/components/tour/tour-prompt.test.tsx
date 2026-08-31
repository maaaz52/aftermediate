// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TourProvider } from "./tour-provider";
import { TourPrompt } from "./tour-prompt";
import { chapters } from "@/lib/tour";
import * as store from "@/lib/store";
import type { Config } from "driver.js";

const mockUseStudent = vi.fn();
vi.spyOn(store, "useStudent").mockImplementation(() => mockUseStudent());

const mocks = vi.hoisted(() => {
  const destroy = vi.fn();
  const drive = vi.fn();
  const driver = vi.fn((_config: Config) => ({ destroy, drive }));
  return { destroy, drive, driver };
});
vi.mock("driver.js", () => ({ driver: mocks.driver }));

const nav = vi.hoisted(() => {
  const push = vi.fn();
  return { pathname: "/dashboard", router: { push } };
});
vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useRouter: () => nav.router,
}));

beforeEach(() => {
  cleanup();
  document.querySelectorAll("[data-tour]").forEach((el) => el.remove());
  window.localStorage.clear();
  vi.clearAllMocks();
  nav.pathname = "/dashboard";
  mockUseStudent.mockReturnValue({
    profile: { quizCompletedAt: "2026-08-31T00:00:00.000Z" },
  });
});

afterEach(() => cleanup());

it("stays hidden before onboarding is complete", () => {
  mockUseStudent.mockReturnValue({ profile: { quizCompletedAt: null } });
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  expect(screen.queryByText("New here?")).toBeNull();
});

it("appears on the dashboard after onboarding", () => {
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  expect(screen.getByText("New here?")).toBeTruthy();
});

it("hides permanently when dismissed", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /maybe later/i }));
  expect(screen.queryByText("New here?")).toBeNull();
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.promptDismissed).toBe(true);
});

it("starts chapter one from the prompt", async () => {
  const welcome = document.createElement("div");
  welcome.setAttribute("data-tour", "dashboard-welcome");
  document.body.appendChild(welcome);

  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourPrompt />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /start tour/i }));

  expect(screen.queryByText("New here?")).toBeNull();
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps![0].popover!.title).toBe(chapters[0].steps[0].title);
  welcome.remove();
});
