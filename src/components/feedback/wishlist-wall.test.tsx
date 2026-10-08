// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { listFeatureRequests, listReplies, toggleVote } from "@/lib/feedback-api";

vi.mock("@/lib/feedback-api", () => ({
  listFeatureRequests: vi.fn(),
  listReplies: vi.fn(),
  toggleVote: vi.fn(),
  submitFeatureRequest: vi.fn(),
  submitReply: vi.fn(),
}));

const rows = [
  { id: "f1", user_id: "u1", name: "Dark mode", author_name: "Hira Ahmed", description: "Save my eyes at night", use_case: "Study after 11pm", priority: "p1", status: "open", votes_count: 4, created_at: "2026-08-01" },
  { id: "f2", user_id: "u2", name: "PDF export", author_name: "Ali Raza", description: "Download plans", use_case: "Print for parents", priority: "p0", status: "planning", votes_count: 9, created_at: "2026-08-02" },
] as const;

beforeEach(() => {
  vi.mocked(listReplies).mockResolvedValue([]);
});

import { WishlistWall } from "./wishlist-wall";

vi.mock("@/lib/store", () => ({
  useStudent: () => ({
    profile: { name: "Hira Ahmed" },
    update: vi.fn(),
    reset: vi.fn(),
    hydrated: true,
    hydrate: vi.fn(),
  }),
}));

describe("WishlistWall", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders rows sorted with vote counts", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([...rows] as never);
    render(<WishlistWall />);
    expect(await screen.findByText("Dark mode")).toBeInTheDocument();
    expect(screen.getByText("PDF export")).toBeInTheDocument();
  });

  it("filters by status chips", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([rows[0]] as never);
    const user = userEvent.setup();
    render(<WishlistWall />);
    await screen.findByText("Dark mode");
    await user.click(screen.getByRole("button", { name: /^open$/i }));
    await waitFor(() => expect(listFeatureRequests).toHaveBeenLastCalledWith("open"));
  });

  it("upvotes optimistically and keeps the new count", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([rows[1]] as never);
    vi.mocked(toggleVote).mockResolvedValue({ ok: true, voted: true, count: 10 });
    const user = userEvent.setup();
    render(<WishlistWall />);
    const row = await screen.findByText("PDF export");
    const button = row.closest("li")!.querySelector("button")!;
    await user.click(button);
    await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("reverts the count when the vote fails", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([rows[1]] as never);
    vi.mocked(toggleVote).mockResolvedValue({ ok: false, error: "signed out" });
    const user = userEvent.setup();
    render(<WishlistWall />);
    const row = await screen.findByText("PDF export");
    const button = row.closest("li")!.querySelector("button")!;
    await user.click(button);
    await waitFor(() => expect(screen.getByText("9")).toBeInTheDocument());
    expect(button).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the author name with every suggestion", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([...rows] as never);
    render(<WishlistWall />);
    expect(await screen.findByText("Hira Ahmed")).toBeInTheDocument();
    expect(screen.getByText("Ali Raza")).toBeInTheDocument();
  });

  it("opens a reply thread from the Reply button", async () => {
    vi.mocked(listFeatureRequests).mockResolvedValue([rows[0]] as never);
    const user = userEvent.setup();
    render(<WishlistWall />);
    await screen.findByText("Dark mode");
    await user.click(screen.getByRole("button", { name: /^reply$/i }));
    expect(screen.getByLabelText("Your reply")).toBeInTheDocument();
  });
});
