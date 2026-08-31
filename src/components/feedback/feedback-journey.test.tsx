// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

afterEach(() => {
  cleanup();
});

vi.mock("@/lib/store", () => ({
  useStudent: () => ({ profile: { name: "Hira Ahmed" }, update: vi.fn(), reset: vi.fn(), hydrated: true, hydrate: vi.fn() }),
}));

const submitReview = vi.hoisted(() => vi.fn());
const confetti = vi.hoisted(() => vi.fn());

vi.mock("@/lib/feedback-api", () => ({
  submitReview,
  toggleVote: vi.fn(),
  listFeatureRequests: vi.fn(),
  submitFeatureRequest: vi.fn(),
}));
vi.mock("canvas-confetti", () => ({ default: confetti }));

import { FeedbackJourney } from "./feedback-journey";

describe("FeedbackJourney", () => {
  it("renders step 1 and blocks Next until a mood is chosen", async () => {
    const user = userEvent.setup();
    render(<FeedbackJourney />);
    const next = screen.getByRole("button", { name: /next/i });
    expect(next).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    expect(next).toBeEnabled();
  });

  it("announces step changes and moves focus to the heading", async () => {
    const user = userEvent.setup();
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 2 })).toHaveFocus());
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(/rate/i);
  });

  it("surfaces submit errors inline instead of crashing", async () => {
    const user = userEvent.setup();
    submitReview.mockResolvedValue({ ok: false, error: "quota exceeded" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getByText(/quota exceeded/i)).toBeInTheDocument());
    expect(screen.queryByText(/thank you/i)).not.toBeInTheDocument();
  });
});

describe("FeedbackJourney — full path", () => {
  it("walks through all steps and lands on the celebration with a personalized greeting", async () => {
    const user = userEvent.setup();
    submitReview.mockClear();
    submitReview.mockResolvedValue({ ok: true, id: "r1" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    const slider = screen.getByRole("slider", { name: /rating/i });
    await user.click(slider);
    await user.keyboard("{ArrowRight}{ArrowRight}");
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i })); // story (empty) → step 4
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getByText(/thank you, hira/i)).toBeInTheDocument());
    expect(confetti).toHaveBeenCalled();
    expect(submitReview).toHaveBeenCalledTimes(1);
  });

  it("shows sentiment badges and tone-matched closing on the celebration", async () => {
    const user = userEvent.setup();
    submitReview.mockClear();
    submitReview.mockResolvedValue({ ok: true, id: "r1" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /frustrated/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getAllByText(/we hear you/i).length).toBeGreaterThan(0));
    expect(screen.getByText(/critical/i)).toBeInTheDocument();
  });

  it("shows a moderation note on the celebration when media was attached", async () => {
    const user = userEvent.setup();
    submitReview.mockClear();
    submitReview.mockResolvedValue({ ok: true, id: "r1" });
    render(<FeedbackJourney />);
    await user.click(screen.getByRole("button", { name: /loved it/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    const input = screen.getByLabelText(/attach media/i);
    await user.upload(input, new File(["x"], "shot.png", { type: "image/png" }));
    await user.click(screen.getByRole("button", { name: /next/i }));
    await user.click(screen.getByRole("button", { name: /send your voice/i }));
    await waitFor(() => expect(screen.getByText(/media is in review/i)).toBeInTheDocument());
  });
});
