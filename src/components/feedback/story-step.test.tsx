// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { StoryStep } from "./story-step";
import type { MediaItem } from "./media-uploader";

const base = {
  surprised: "",
  mindset: "",
  recommendTo: [] as string[],
  media: [] as MediaItem[],
  onSurprised: vi.fn(),
  onMindset: vi.fn(),
  onRecommendTo: vi.fn(),
  onMedia: vi.fn(),
};

describe("StoryStep", () => {
  afterEach(() => cleanup());

  it("expands the surprise card and edits its text", async () => {
    const user = userEvent.setup();
    const props = { ...base, onSurprised: vi.fn() };
    render(<StoryStep {...props} />);
    await user.click(screen.getByRole("button", { name: /what surprised me/i }));
    const box = screen.getByLabelText(/what surprised me/i);
    fireEvent.change(box, { target: { value: "the roadmap was clear" } });
    expect(props.onSurprised).toHaveBeenCalledWith("the roadmap was clear");
  });

  it("toggles persona chips", async () => {
    const user = userEvent.setup();
    const props = { ...base, onRecommendTo: vi.fn() };
    render(<StoryStep {...props} />);
    await user.click(screen.getByRole("button", { name: /^students$/i }));
    expect(props.onRecommendTo).toHaveBeenCalledWith(["students"]);
  });

  it("hides the voice input when SpeechRecognition is unsupported", () => {
    render(<StoryStep {...base} />);
    expect(screen.queryByRole("button", { name: /start voice input/i })).not.toBeInTheDocument();
  });
});
