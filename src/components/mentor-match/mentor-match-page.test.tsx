// @vitest-environment jsdom
import { it, expect, afterEach, vi } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MentorMatchPage } from "./mentor-match-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => cleanup());

it("renders the hero headline", () => {
  render(<MentorMatchPage />);
  expect(screen.getByText("Find your mentor")).toBeTruthy();
});

it("shows Furqan Afzal mentor card", () => {
  render(<MentorMatchPage />);
  expect(screen.getByText("Furqan Afzal")).toBeTruthy();
});

it("searching by name filters correctly", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/search/i), "Furqan");
  expect(screen.getByText("Furqan Afzal")).toBeTruthy();
});

it("empty state renders for no matches", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/search/i), "zzzzz");
  expect(screen.getByText(/no mentors match/i)).toBeTruthy();
});

it("mentor card has social buttons", () => {
  render(<MentorMatchPage />);
  const card = screen.getByText("Furqan Afzal").closest('[role="button"]') as HTMLElement;
  const socialLinks = within(card).getAllByRole("link");
  expect(socialLinks.length).toBeGreaterThan(0);
});

it("clicking the mentor card opens the detail modal", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Furqan Afzal"));
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("Furqan Afzal")).toBeTruthy();
});

it("closes the modal when clicking X", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Furqan Afzal"));
  expect(screen.getByRole("dialog")).toBeTruthy();
  await user.click(screen.getByLabelText("Close"));
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("Become a mentor button opens modal", async () => {
  render(<MentorMatchPage />);
  const user = userEvent.setup();
  await user.click(screen.getByText("Become a mentor"));
  expect(screen.getByText("Full name")).toBeTruthy();
  expect(screen.getByText("Submit application")).toBeTruthy();
});
