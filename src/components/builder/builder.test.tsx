// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { Builder } from "./builder";

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
