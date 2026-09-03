// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoursePlayer } from "./course-player";

afterEach(cleanup);

describe("CoursePlayer", () => {
  it("does not mount the iframe until the user clicks Watch", () => {
    render(<CoursePlayer videoId="mU6anWqZJcc" title="HTML course" />);
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByText("Watch here")).toBeTruthy();
  });

  it("embeds a single video on the privacy-enhanced domain", async () => {
    const user = userEvent.setup();
    render(<CoursePlayer videoId="mU6anWqZJcc" title="HTML course" />);
    await user.click(screen.getByRole("button", { name: /watch here/i }));
    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/mU6anWqZJcc?rel=0&modestbranding=1"
    );
  });

  it("embeds a playlist as a videoseries", async () => {
    const user = userEvent.setup();
    render(<CoursePlayer playlistId="PLabc123" title="Playlist" />);
    await user.click(screen.getByRole("button", { name: /watch here/i }));
    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/videoseries?list=PLabc123&rel=0"
    );
  });

  it("lists episodes and plays the selected one", async () => {
    const user = userEvent.setup();
    render(
      <CoursePlayer
        title="Vibe coding"
        episodes={[
          { id: "p1", title: "Part 1", videoId: "AAA" },
          { id: "p2", title: "Part 2", videoId: "BBB" },
        ]}
      />
    );
    expect(screen.getByText("Part 1")).toBeTruthy();
    expect(screen.getByText("Part 2")).toBeTruthy();
    expect(document.querySelector("iframe")).toBeNull();

    await user.click(screen.getByText("Part 2"));
    const iframe = document.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toBe(
      "https://www.youtube-nocookie.com/embed/BBB?rel=0&modestbranding=1"
    );
  });

  it("toggles per-episode watched state", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <CoursePlayer
        title="Vibe coding"
        watched={["p1"]}
        onToggleWatched={onToggle}
        episodes={[
          { id: "p1", title: "Part 1", videoId: "AAA" },
          { id: "p2", title: "Part 2", videoId: "BBB" },
        ]}
      />
    );
    const marks = screen.getAllByText("Mark watched");
    await user.click(marks[0]); // the only unwatched episode (p2)
    expect(onToggle).toHaveBeenCalledWith("p2");
  });
});