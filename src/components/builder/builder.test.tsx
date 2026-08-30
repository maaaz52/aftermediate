// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import html2pdf from "html2pdf.js";
import { afterEach, expect, it, vi } from "vitest";
import { Builder } from "./builder";

// html2pdf.js can't run under jsdom — the PDF tests drive the mock chain
// (html2pdf → set → from → save) and assert on the captured options.
vi.mock("html2pdf.js", () => ({ default: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

// ── Rendering ───────────────────────────────────────────────────────────

it("renders with mock data — Hira Ahmed shows in the identity tab input", () => {
  render(<Builder />);
  const name = screen.getByLabelText(/full name/i) as HTMLInputElement;
  expect(name.value).toBe("Hira Ahmed");
});

it("switching tabs reveals each tab's content", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("tab", { name: "Experience" }));
  expect(screen.getByLabelText(/what have you actually done/i)).toBeTruthy();

  await user.click(screen.getByRole("tab", { name: "Projects" }));
  expect(screen.getByRole("button", { name: /add project/i })).toBeTruthy();

  await user.click(screen.getByRole("tab", { name: "Skills" }));
  expect(screen.getByRole("button", { name: "Remove Microsoft Office" })).toBeTruthy();

  await user.click(screen.getByRole("tab", { name: "Identity" }));
  expect((screen.getByLabelText(/full name/i) as HTMLInputElement).value).toBe("Hira Ahmed");
});

it("renders the sticky toolbar with template selector and action buttons", () => {
  render(<Builder />);
  expect(screen.getByRole("button", { name: "Academic" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Silicon" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Glass" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Download Clean PDF" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Get Live Web Link" })).toBeTruthy();
});

// ── Identity tab ────────────────────────────────────────────────────────

it("typing in the name input updates resume state", async () => {
  render(<Builder />);
  const user = userEvent.setup();
  const name = screen.getByLabelText(/full name/i);
  await user.clear(name);
  await user.type(name, "Ali Khan");
  expect((name as HTMLInputElement).value).toBe("Ali Khan");
});

it("target role input updates resume state and offers example datalist", async () => {
  render(<Builder />);
  const user = userEvent.setup();
  const role = screen.getByLabelText(/target role/i);
  expect(role.getAttribute("list")).toBe("builder-target-roles");

  await user.clear(role);
  await user.type(role, "Web Developer");
  expect((role as HTMLInputElement).value).toBe("Web Developer");

  const datalist = document.getElementById("builder-target-roles");
  expect(datalist?.querySelectorAll("option").length).toBe(3);
});

// ── Experience tab ──────────────────────────────────────────────────────

it("AI Polish turns raw notes into 3 polished bullets after the 600ms animation", async () => {
  const user = userEvent.setup();
  render(<Builder />);

  await user.click(screen.getByRole("tab", { name: "Experience" }));
  const notes = screen.getByLabelText(/what have you actually done/i);
  await user.clear(notes);
  await user.type(notes, "organised a school sports day for 200 students");

  await user.click(screen.getByRole("button", { name: "AI Polish" }));

  await waitFor(
    () => {
      const bullets = screen.getAllByLabelText(/polished bullet/i);
      expect(bullets).toHaveLength(3);
      // Single clause in → the engine pads to 3 bullets with its fillers
      expect((bullets[0] as HTMLTextAreaElement).value).toContain("Coordinated");
      expect((bullets[1] as HTMLTextAreaElement).value).toContain("project management");
      expect((bullets[2] as HTMLTextAreaElement).value).toContain("extracurricular activities");
    },
    { timeout: 3000 }
  );
});

it("polish button is disabled and shows 'Polishing…' while the animation runs", async () => {
  const user = userEvent.setup();
  render(<Builder />);

  await user.click(screen.getByRole("tab", { name: "Experience" }));
  await user.click(screen.getByRole("button", { name: "AI Polish" }));

  const button = screen.getByRole("button", { name: "Polishing…" });
  expect((button as HTMLButtonElement).disabled).toBe(true);

  // Once the animation completes, the button returns to its normal state
  await waitFor(
    () => {
      expect(screen.getByRole("button", { name: "AI Polish" })).toBeTruthy();
    },
    { timeout: 3000 }
  );
});

// ── Projects tab ────────────────────────────────────────────────────────

it("adds and removes project entries", async () => {
  render(<Builder />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Projects" }));

  expect(screen.getAllByLabelText(/^project title/i)).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: /add project/i }));
  expect(screen.getAllByLabelText(/^project title/i)).toHaveLength(3);

  const removeButtons = screen.getAllByRole("button", { name: /^remove project/i });
  await user.click(removeButtons[2]);
  expect(screen.getAllByLabelText(/^project title/i)).toHaveLength(2);
});

it("adds and removes certificates", async () => {
  render(<Builder />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Projects" }));

  expect(screen.getAllByLabelText(/^certificate \d/i)).toHaveLength(2);

  await user.click(screen.getByRole("button", { name: /add certificate/i }));
  expect(screen.getAllByLabelText(/^certificate \d/i)).toHaveLength(3);

  await user.click(screen.getAllByRole("button", { name: /^remove certificate/i })[2]);
  expect(screen.getAllByLabelText(/^certificate \d/i)).toHaveLength(2);
});

// ── Skills tab ──────────────────────────────────────────────────────────

it("shows role-based skill suggestions and clicking one selects it", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  const role = screen.getByLabelText(/target role/i);
  await user.clear(role);
  await user.type(role, "Web Developer");

  await user.click(screen.getByRole("tab", { name: "Skills" }));
  const search = screen.getByLabelText(/search tech skills/i);
  await user.type(search, "H");

  const htmlSuggestion = screen.getByRole("button", { name: "HTML" });
  expect(htmlSuggestion).toBeTruthy();
  await user.click(htmlSuggestion);

  expect(screen.getByRole("button", { name: "Remove HTML" })).toBeTruthy();
});

it("toggles a tech skill pill off and on via suggestions", async () => {
  render(<Builder />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("tab", { name: "Skills" }));

  // Existing pill present → clicking removes it
  expect(screen.getByRole("button", { name: "Remove Microsoft Office" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Remove Microsoft Office" }));
  expect(screen.queryByRole("button", { name: "Remove Microsoft Office" })).toBeNull();

  // Re-add a curated skill through the suggestion dropdown
  const search = screen.getByLabelText(/search tech skills/i);
  await user.type(search, "Ex");
  await user.click(screen.getByRole("button", { name: "Excel" }));

  expect(screen.getByRole("button", { name: "Remove Excel" })).toBeTruthy();
});

// ── Toolbar ─────────────────────────────────────────────────────────────

it("switching templates updates the active selection", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  const academic = screen.getByRole("button", { name: "Academic" });
  expect(academic.getAttribute("aria-pressed")).toBe("true");

  await user.click(screen.getByRole("button", { name: "Silicon" }));
  expect(academic.getAttribute("aria-pressed")).toBe("false");
  expect(screen.getByRole("button", { name: "Silicon" }).getAttribute("aria-pressed")).toBe("true");
});

// ── Canvas preview (Task 3) ────────────────────────────────────────────

it("canvas renders the mock resume — name, first bullet and a skill pill", () => {
  render(<Builder />);
  const canvas = screen.getByRole("region", { name: "Resume preview" });
  expect(within(canvas).getByText(/hira ahmed/i)).toBeTruthy();
  expect(within(canvas).getByText(/Coordinated logistics for school sports day/i)).toBeTruthy();
  expect(within(canvas).getByText("Microsoft Office")).toBeTruthy();
});

it("typing a new name in the identity tab updates the canvas in real time", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  const name = screen.getByLabelText(/full name/i);
  await user.clear(name);
  await user.type(name, "Ali Khan");

  const canvas = screen.getByRole("region", { name: "Resume preview" });
  await waitFor(() => {
    expect(within(canvas).getByText(/ali khan/i)).toBeTruthy();
  });
});

it("template switcher updates the canvas data-template attribute", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Silicon" }));
  await waitFor(() => {
    expect(
      screen.getByRole("region", { name: "Resume preview" }).getAttribute("data-template")
    ).toBe("silicon");
  });

  await user.click(screen.getByRole("button", { name: "Glass" }));
  await waitFor(() => {
    expect(
      screen.getByRole("region", { name: "Resume preview" }).getAttribute("data-template")
    ).toBe("glass");
  });
});

// ── ATS panel (Task 3) ─────────────────────────────────────────────────

it("ATS gauge starts at 77 for the mock resume in startup mode", () => {
  render(<Builder />);
  const gauge = screen.getByRole("progressbar", { name: "ATS impact score" });
  expect(gauge.getAttribute("aria-valuenow")).toBe("77");
  expect(gauge.getAttribute("aria-valuemin")).toBe("0");
  expect(gauge.getAttribute("aria-valuemax")).toBe("100");
});

it("switching to University Admissions reweights the gauge to 83", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  const universityButton = screen.getByRole("button", { name: /University Admissions Officer/ });
  await user.click(universityButton);

  await waitFor(() => {
    const gauge = screen.getByRole("progressbar", { name: "ATS impact score" });
    expect(gauge.getAttribute("aria-valuenow")).toBe("83");
  });
  expect(universityButton.getAttribute("aria-pressed")).toBe("true");
});

it("gauge drops when a bullet is weakened to a weak-verb opener", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("tab", { name: "Experience" }));
  const bullet = screen.getAllByLabelText(/polished bullet/i)[0];
  await user.clear(bullet);
  await user.type(bullet, "was responsible for the sports day");

  await waitFor(() => {
    const gauge = screen.getByRole("progressbar", { name: "ATS impact score" });
    expect(Number(gauge.getAttribute("aria-valuenow"))).toBeLessThan(77);
  });
});

it("1-click auto-fix adds the missing keyword pill to the canvas skills", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  const fixButton = screen.getByRole("button", { name: "Auto-Fix: Add keyword pill" });
  await user.click(fixButton);

  const canvas = screen.getByRole("region", { name: "Resume preview" });
  await waitFor(() => {
    expect(within(canvas).getByText("Research")).toBeTruthy();
  });
});

it("hovering a bullet reveals the rewrite action and rewrites it in place", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  // Weaken bullet 0 first so the engine actually has something to rewrite
  await user.click(screen.getByRole("tab", { name: "Experience" }));
  const bullet = screen.getAllByLabelText(/polished bullet/i)[0];
  await user.clear(bullet);
  await user.type(bullet, "was responsible for the sports day");

  const canvas = screen.getByRole("region", { name: "Resume preview" });
  const bulletText = within(canvas).getByText(/was responsible for/i);
  await user.hover(bulletText);

  const group = bulletText.closest("div");
  expect(group).not.toBeNull();
  const rewriteButton = within(group as HTMLElement).getByRole("button", {
    name: "Rewrite with AI",
  });
  await user.click(rewriteButton);

  await waitFor(() => {
    expect(within(canvas).queryByText(/was responsible for/i)).toBeNull();
    expect(within(canvas).getByText(/owned the sports day/i)).toBeTruthy();
  });
});

// ── Share modal (Task 3) ───────────────────────────────────────────────

it("Get Live Web Link opens the dialog with the slugged URL and Escape closes it", async () => {
  render(<Builder />);
  const user = userEvent.setup();

  await user.click(screen.getByRole("button", { name: "Get Live Web Link" }));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText(/aftermediate\.site\/builder\/view\/hira-ahmed/)).toBeTruthy();

  await user.keyboard("{Escape}");
  await waitFor(() => {
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

it("Copy Link writes the mock URL to the clipboard and confirms", async () => {
  const user = userEvent.setup();
  const writeText = vi.fn();
  // userEvent.setup() installs its own clipboard stub — redefine navigator.clipboard
  // AFTER setup() so the component's writeText call lands on our mock.
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  render(<Builder />);

  await user.click(screen.getByRole("button", { name: "Get Live Web Link" }));
  await user.click(screen.getByRole("button", { name: "Copy Link" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Copied!" })).toBeTruthy();
  });
  expect(writeText).toHaveBeenCalledWith("aftermediate.site/builder/view/hira-ahmed");
});

// ── PDF download (Task 4) ──────────────────────────────────────────────

it("Download Clean PDF calls html2pdf with the resume element and a slug filename", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  const from = vi.fn((el: Element) => {
    // Capture runs while the invert class is applied to the paper node
    expect(el.classList.contains("pdf-invert")).toBe(true);
    return { save };
  });
  let capturedOptions: unknown;
  const set = vi.fn((options: unknown) => {
    capturedOptions = options;
    return { from };
  });
  vi.mocked(html2pdf).mockReturnValue({ set } as never);

  const user = userEvent.setup();
  render(<Builder />);
  const canvas = screen.getByRole("region", { name: "Resume preview" });

  await user.click(screen.getByRole("button", { name: "Download Clean PDF" }));

  expect(html2pdf).toHaveBeenCalledTimes(1);
  expect(from).toHaveBeenCalledWith(canvas);

  const options = capturedOptions as {
    filename: string;
    html2canvas: { ignoreElements: (el: Element) => boolean };
  };
  expect(options.filename).toBe("hira-ahmed-resume.pdf");

  // ignoreElements excludes the hover-to-rewrite overlay from the capture
  expect(typeof options.html2canvas.ignoreElements).toBe("function");
  const overlay = document.createElement("div");
  overlay.classList.add("resume-overlay");
  expect(options.html2canvas.ignoreElements(overlay)).toBe(true);
  expect(options.html2canvas.ignoreElements(document.createElement("div"))).toBe(false);

  // save() resolved immediately, so the finally already removed the class
  await waitFor(() => {
    expect(canvas.classList.contains("pdf-invert")).toBe(false);
  });
});
