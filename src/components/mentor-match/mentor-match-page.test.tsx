// @vitest-environment jsdom
import { it, expect, afterEach, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MentorMatchPage } from "./mentor-match-page";
import type { MentorProfile } from "./mentor-match-page";
import data from "@/data/mentors.json";

// Mock next/navigation for HeroSection
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

const mentors: MentorProfile[] = (data as { mentors: MentorProfile[] }).mentors;

function getNameElements(name: string) {
  return screen.getAllByText(name);
}

it("renders the hero headline 'Find your mentor'", () => {
  render(<MentorMatchPage />);
  expect(screen.getByText("Find your mentor")).toBeTruthy();
});

it("shows all 12 mentor cards by default", () => {
  render(<MentorMatchPage />);
  // All mentor names should be visible (each exactly once)
  mentors.forEach((m) => {
    const els = getNameElements(m.name);
    expect(els.length).toBeGreaterThanOrEqual(1);
  });
});

it("filtering by 'engineering' shows exactly 2 mentors", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  const engineeringBtn = screen.getByText("Engineering");
  await user.click(engineeringBtn);

  const engineeringMentors = mentors.filter((m) => m.field === "engineering");
  expect(engineeringMentors).toHaveLength(2);

  engineeringMentors.forEach((m) => {
    expect(getNameElements(m.name).length).toBeGreaterThanOrEqual(1);
  });

  // Non-engineering mentors should not be visible
  const nonEngineering = mentors.filter((m) => m.field !== "engineering");
  nonEngineering.forEach((m) => {
    expect(screen.queryByText(m.name)).toBeNull();
  });
});

it("filtering by 'medical' shows exactly 2 mentors", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Medical"));

  const medicalMentors = mentors.filter((m) => m.field === "medical");
  expect(medicalMentors).toHaveLength(2);

  medicalMentors.forEach((m) => {
    expect(getNameElements(m.name).length).toBeGreaterThanOrEqual(1);
  });
});

it("switching back to 'All' shows all 12", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  // First filter to engineering
  await user.click(screen.getByText("Engineering"));
  // Then switch back to All
  await user.click(screen.getByText("All"));

  mentors.forEach((m) => {
    expect(getNameElements(m.name).length).toBeGreaterThanOrEqual(1);
  });
});

it("searching by full name 'Ahmed Raza' filters to 1 result", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  const searchInput = screen.getByPlaceholderText("Search by name, institution, or topic...");
  await user.type(searchInput, "Ahmed Raza");

  expect(getNameElements("Ahmed Raza").length).toBeGreaterThanOrEqual(1);
  // Only Ahmed Raza should show
  const others = mentors.filter((m) => m.name !== "Ahmed Raza");
  others.forEach((m) => {
    expect(screen.queryByText(m.name)).toBeNull();
  });
});

it("searching by institution 'LUMS' filters to 2 results", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  const searchInput = screen.getByPlaceholderText("Search by name, institution, or topic...");
  await user.type(searchInput, "LUMS");

  const lumsMentors = mentors.filter((m) => m.institution === "LUMS");
  expect(lumsMentors).toHaveLength(2);

  lumsMentors.forEach((m) => {
    expect(getNameElements(m.name).length).toBeGreaterThanOrEqual(1);
  });
});

it("empty state renders when searching 'zzzzz'", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  const searchInput = screen.getByPlaceholderText("Search by name, institution, or topic...");
  await user.type(searchInput, "zzzzz");

  expect(screen.getByText("No mentors match this filter. Check back soon.")).toBeTruthy();
});

it("single-mentor card shows full-width social button", () => {
  render(<MentorMatchPage />);
  // Fatima Khan has only 1 social (whatsapp)
  const fatimaName = screen.getByText("Fatima Khan");
  // The card (role="button") is a parent containing the name
  const card = fatimaName.closest('[role="button"]') as HTMLElement;
  // Within that card, find the "Reach out on WhatsApp" link
  const socialLink = within(card).getByText("Reach out on WhatsApp");
  expect(socialLink).toBeTruthy();
  // The parent a tag of this link should have w-full class
  const socialParent = socialLink.closest("a")!;
  expect(socialParent.className).toContain("w-full");
});

it("card with 2 socials shows flex layout", () => {
  render(<MentorMatchPage />);
  // Ahmed Raza has 2 socials
  const ahmedName = screen.getByText("Ahmed Raza");
  const card = ahmedName.closest('[role="button"]') as HTMLElement;
  // Within that card, both socials should be rendered
  expect(within(card).getByText("Connect on Instagram")).toBeTruthy();
  expect(within(card).getByText("Join Discord")).toBeTruthy();
  // Social links should have flex-1 class (the a tags)
  const instaLink = within(card).getByText("Connect on Instagram").closest("a")!;
  expect(instaLink.className).toContain("flex-1");
});

it("clicking a mentor card opens the detail modal with the full profile", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Ahmed Raza"));

  const dialog = screen.getByRole("dialog");
  expect(dialog.getAttribute("aria-label")).toBe("Ahmed Raza profile");
  expect(within(dialog).getByText("Ahmed Raza")).toBeTruthy();
  expect(within(dialog).getByText("NED University · Software Engineering")).toBeTruthy();
  expect(within(dialog).getByText("Available this week")).toBeTruthy();
  expect(within(dialog).getByText(/Self-studied for NET/)).toBeTruthy();
  expect(within(dialog).getByRole("link", { name: "Connect on Instagram" })).toBeTruthy();
  expect(within(dialog).getByRole("link", { name: "Join Discord" })).toBeTruthy();
});

it("closes the modal when clicking the X button", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Ahmed Raza"));
  expect(screen.getByRole("dialog")).toBeTruthy();

  await user.click(screen.getByLabelText("Close"));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("closes the modal when clicking the backdrop", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Ahmed Raza"));
  const dialog = screen.getByRole("dialog");

  const backdrop = dialog.parentElement!.querySelector(".bg-black\\/40") as HTMLElement;
  await user.click(backdrop);
  expect(screen.queryByRole("dialog")).toBeNull();
});