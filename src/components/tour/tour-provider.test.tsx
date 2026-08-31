// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as React from "react";
import { TourProvider, useTour } from "./tour-provider";
import { chapters } from "@/lib/tour";
import * as store from "@/lib/store";
import type { Config, DriverHook, PopoverDOM } from "driver.js";

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

function seedTourTargets() {
  for (const name of [
    "dashboard-welcome",
    "sidebar-nav",
    "top-nav",
    "daily-sprint",
    "rahbar-button",
  ]) {
    const el = document.createElement("div");
    el.setAttribute("data-tour", name);
    document.body.appendChild(el);
  }
}

function Probe() {
  const t = useTour();
  return (
    <div>
      <span data-testid="running">{String(t.running)}</span>
      <span data-testid="chapter">{t.activeChapter ?? "none"}</span>
      <span data-testid="hub">{String(t.hubOpen)}</span>
      <span data-testid="prompt">{String(t.promptVisible)}</span>
      <span data-testid="completed">{String(t.completedCount)}</span>
      <button type="button" data-testid="start" onClick={() => t.startChapter("getting-around")}>
        start
      </button>
      <button
        type="button"
        data-testid="resume"
        onClick={() => t.startChapter("getting-around", 2)}
      >
        resume
      </button>
      <button type="button" data-testid="exit" onClick={() => t.exitTour()}>
        exit
      </button>
    </div>
  );
}

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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  mocks.driver.mockImplementation(() => ({ destroy: mocks.destroy, drive: mocks.drive }));
});

// driver.js hooks are typed (element, step, opts) — none of the provider's
// callbacks use those arguments, so fire them with dummy values.
function callHook(hook: DriverHook | undefined): void {
  if (hook) {
    hook(undefined, undefined as never, {} as never);
  }
}

// ── Starting & driving steps ──

it("starts a chapter at step 0 and drives the first step", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );

  await user.click(screen.getByTestId("start"));

  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps![0].element).toBe(chapters[0].steps[0].target);
  expect(config.steps![0].popover!.title).toBe(chapters[0].steps[0].title);
  expect(config.steps![0].popover!.nextBtnText).toBe("Next");
  expect(mocks.drive).toHaveBeenCalled();
  expect(screen.getByTestId("chapter").textContent).toBe("getting-around");
});

it("advances steps through the driver next callback", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  const firstConfig = mocks.driver.mock.calls[0][0];
  await act(async () => callHook(firstConfig.onNextClick));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(2));

  const secondConfig = mocks.driver.mock.calls[1][0];
  expect(secondConfig.steps![0].popover!.title).toBe(chapters[0].steps[1].title);
  expect(secondConfig.steps![0].popover!.showButtons).toEqual(["previous", "next"]);
  expect(mocks.destroy).toHaveBeenCalled();
});

it("marks the chapter complete after the final step and persists it", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  const stepCount = chapters[0].steps.length;
  for (let i = 0; i < stepCount; i += 1) {
    const config = mocks.driver.mock.calls[mocks.driver.mock.calls.length - 1][0];
    await act(async () => callHook(config.onNextClick));
    if (i < stepCount - 1) {
      await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(i + 2));
    } else {
      await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
    }
  }

  expect(screen.getByTestId("completed").textContent).toBe("1");
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.chapters["getting-around"].completed).toBe(true);
});

// ── Exit & resume ──

it("exiting mid-chapter saves the resume point", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  await act(async () => callHook(mocks.driver.mock.calls[0][0].onNextClick));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(2));
  await act(async () => callHook(mocks.driver.mock.calls[1][0].onNextClick));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(3));

  await user.click(screen.getByTestId("exit"));

  expect(screen.getByTestId("running").textContent).toBe("false");
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.chapters["getting-around"].lastStep).toBe(2);
  expect(saved.chapters["getting-around"].completed).toBe(false);
});

it("resumes a chapter from a saved step", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("resume"));

  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  const config = mocks.driver.mock.calls[0][0];
  expect(config.steps![0].popover!.title).toBe(chapters[0].steps[2].title);
});

it("exits and saves when the user navigates away mid-tour", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  const view = render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());
  await act(async () => callHook(mocks.driver.mock.calls[0][0].onNextClick));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(2));

  nav.pathname = "/merit";
  view.rerender(
    <TourProvider>
      <Probe />
    </TourProvider>
  );

  await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.chapters["getting-around"].lastStep).toBe(1);
});

// ── onEnter side effects ──

it("dispatches open-rahbar when the drawer step activates", async () => {
  const drawer = document.createElement("div");
  drawer.setAttribute("data-tour", "rahbar-drawer");
  document.body.appendChild(drawer);
  const spy = vi.spyOn(document, "dispatchEvent");

  function RahbarProbe() {
    const t = useTour();
    return <button type="button" onClick={() => t.startChapter("skills-ai", 4)}>go</button>;
  }
  const user = userEvent.setup();
  render(
    <TourProvider>
      <RahbarProbe />
    </TourProvider>
  );
  await user.click(screen.getByRole("button", { name: "go" }));

  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "open-rahbar" }))
  );
  spy.mockRestore();
});

// ── Prompt gating ──

it("shows the prompt only when onboarding is done, on the dashboard, and not dismissed", () => {
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("true");

  cleanup();
  nav.pathname = "/merit";
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("false");

  cleanup();
  nav.pathname = "/dashboard";
  mockUseStudent.mockReturnValue({ profile: { quizCompletedAt: null } });
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("false");

  cleanup();
  mockUseStudent.mockReturnValue({
    profile: { quizCompletedAt: "2026-08-31T00:00:00.000Z" },
  });
  window.localStorage.setItem(
    "aftermediate:tour",
    JSON.stringify({ promptDismissed: true, chapters: {} })
  );
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("false");
});

it("survives malformed localStorage", () => {
  window.localStorage.setItem("aftermediate:tour", "{oops");
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  expect(screen.getByTestId("prompt").textContent).toBe("true");
});

// ── Failure handling ──

it("fails gracefully when the driver cannot be created", async () => {
  seedTourTargets();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  mocks.driver.mockImplementation(() => {
    throw new Error("boom");
  });
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));

  await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

// ── Popover decoration & lifecycle regressions ──

it("decorates the popover DOM on render (aria, kicker, counter, progress, exit)", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  const config = mocks.driver.mock.calls[0][0];
  const wrapper = document.createElement("div");
  const title = document.createElement("h4");
  const footer = document.createElement("footer");
  const footerButtons = document.createElement("span");
  wrapper.appendChild(title);
  wrapper.appendChild(footer);
  footer.appendChild(footerButtons);
  const fakePopover = { wrapper, title, footer, footerButtons } as unknown as PopoverDOM;

  await act(async () => {
    config.onPopoverRender!(fakePopover, {} as never);
  });

  expect(wrapper.getAttribute("aria-modal")).toBe("true");
  expect(wrapper.getAttribute("role")).toBe("dialog");
  expect(wrapper.querySelector(".tour-kicker")?.textContent).toBe(chapters[0].name);
  expect(wrapper.querySelector(".tour-counter")?.textContent).toBe("1/5");
  expect(wrapper.querySelector<HTMLElement>(".tour-progress span")?.style.width).toContain("20%");
  expect(footerButtons.querySelector(".tour-exit-btn")).not.toBeNull();

  footerButtons.querySelector<HTMLButtonElement>(".tour-exit-btn")!.click();
  await waitFor(() => expect(screen.getByTestId("running").textContent).toBe("false"));
});

it("exits and saves when the user destroys the driver", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  await act(async () => {
    callHook(mocks.driver.mock.calls[0][0].onDestroyed);
  });

  expect(screen.getByTestId("running").textContent).toBe("false");
  const saved = JSON.parse(window.localStorage.getItem("aftermediate:tour")!);
  expect(saved.chapters["getting-around"].lastStep).toBe(0);
  expect(saved.chapters["getting-around"].completed).toBe(false);
});

it("skips a step whose target never appears and renders the next one", async () => {
  // Seed targets for steps 1-4 only; step 0's target never appears.
  for (const name of ["sidebar-nav", "top-nav", "daily-sprint", "rahbar-button"]) {
    const el = document.createElement("div");
    el.setAttribute("data-tour", name);
    document.body.appendChild(el);
  }
  vi.useFakeTimers();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  // Note: no userEvent here — under fake timers @testing-library/react's
  // asyncWrapper drains microtasks with a setTimeout(0) that never fires.
  act(() => {
    screen.getByTestId("start").click();
  });
  await act(async () => {
    vi.advanceTimersByTime(5600);
  });

  expect(mocks.driver).toHaveBeenCalled();
  expect(mocks.driver.mock.calls[0][0].steps![0].popover!.title).toBe(chapters[0].steps[1].title);
  vi.useRealTimers();
});

it("exits the tour on Escape and reopens the hub", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  await user.keyboard("{Escape}");

  expect(screen.getByTestId("running").textContent).toBe("false");
  expect(screen.getByTestId("hub").textContent).toBe("true");
});

it("navigates steps with arrow keys", async () => {
  seedTourTargets();
  const user = userEvent.setup();
  render(
    <TourProvider>
      <Probe />
    </TourProvider>
  );
  await user.click(screen.getByTestId("start"));
  await waitFor(() => expect(mocks.driver).toHaveBeenCalled());

  await user.keyboard("{ArrowRight}");
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(2));
  expect(mocks.driver.mock.calls[1][0].steps![0].popover!.title).toBe(chapters[0].steps[1].title);

  await user.keyboard("{ArrowLeft}");
  await waitFor(() => expect(mocks.driver).toHaveBeenCalledTimes(3));
  expect(mocks.driver.mock.calls[2][0].steps![0].popover!.title).toBe(chapters[0].steps[0].title);
});
