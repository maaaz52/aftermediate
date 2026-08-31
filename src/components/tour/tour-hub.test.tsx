// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TourProvider } from "./tour-provider";
import { TourHub } from "./tour-hub";
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
  mockUseStudent.mockReturnValue({ profile: { quizCompletedAt: null } });
});

afterEach(() => {
  cleanup();
  mocks.driver.mockImplementation(() => ({ destroy: mocks.destroy, drive: mocks.drive }));
});

it("renders the floating pill with dialog semantics", () => {
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  const pill = screen.getByRole("button", { name: /guided tour/i });
  expect(pill.getAttribute("aria-haspopup")).toBe("dialog");
  expect(pill.getAttribute("aria-expanded")).toBe("false");
});

it("opens and closes the hub panel from the pill", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.getByRole("dialog", { name: "Guided tours" })).toBeTruthy();
  expect(
    screen.getByRole("button", { name: /guided tour/i }).getAttribute("aria-expanded")
  ).toBe("true");

  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("lists every chapter with stop counts and Start state", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  for (const ch of chapters) {
    expect(screen.getByText(ch.name)).toBeTruthy();
    expect(screen.getByText(new RegExp(`${ch.steps.length} stops · ${ch.blurb}`))).toBeTruthy();
  }
  expect(screen.getAllByText("Start")).toHaveLength(chapters.length);
  expect(screen.getByText(`0 of ${chapters.length} chapters`)).toBeTruthy();
});

it("shows Resume for mid-chapter and Done for completed chapters", async () => {
  window.localStorage.setItem(
    "aftermediate:tour",
    JSON.stringify({
      promptDismissed: true,
      chapters: {
        pakistan: { completed: false, lastStep: 3 },
        "skills-ai": { completed: true, lastStep: 6 },
      },
    })
  );
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.getByText("Resume 3/7")).toBeTruthy();
  expect(screen.getByText("Done")).toBeTruthy();
  expect(screen.getByText(`1 of ${chapters.length} chapters`)).toBeTruthy();
});

it("closes the panel on Escape and returns focus to the pill", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  const pill = screen.getByRole("button", { name: /guided tour/i });
  await user.click(pill);
  expect(screen.getByRole("dialog")).toBeTruthy();
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(document.activeElement).toBe(pill);
});

it("closes the panel on outside click", async () => {
  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  expect(screen.getByRole("dialog")).toBeTruthy();

  const outside = document.createElement("div");
  document.body.appendChild(outside);
  await user.click(outside);
  expect(screen.queryByRole("dialog")).toBeNull();
  outside.remove();
});

it("resumes a mid-chapter tour from the saved step", async () => {
  window.localStorage.setItem(
    "aftermediate:tour",
    JSON.stringify({
      promptDismissed: true,
      chapters: { pakistan: { completed: false, lastStep: 3 } },
    })
  );
  const target = document.createElement("div");
  target.setAttribute("data-tour", "pakistan-scholarships");
  document.body.appendChild(target);

  const user = userEvent.setup();
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: /guided tour/i }));
  await user.click(screen.getByRole("button", { name: /education in pakistan/i }));

  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps![0].popover!.title).toBe(chapters[1].steps[3].title);
  expect(nav.router.push).toHaveBeenCalledWith("/pakistan/scholarships");
});

it("hides the pill while the Rahbar drawer is open", () => {
  render(
    <TourProvider>
      <TourHub />
    </TourProvider>
  );
  expect(screen.getByRole("button", { name: /guided tour/i })).toBeTruthy();

  act(() => {
    document.dispatchEvent(new CustomEvent("rahbar-open"));
  });
  expect(screen.queryByRole("button", { name: /guided tour/i })).toBeNull();

  act(() => {
    document.dispatchEvent(new CustomEvent("rahbar-closed"));
  });
  expect(screen.getByRole("button", { name: /guided tour/i })).toBeTruthy();
});
