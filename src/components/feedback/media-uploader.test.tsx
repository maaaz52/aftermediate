// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MediaUploader } from "./media-uploader";

describe("MediaUploader", () => {
  afterEach(() => cleanup());

  it("previews a valid image and shows the moderation note", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediaUploader items={[]} onChange={onChange} />);
    await user.upload(
      screen.getByLabelText(/attach media/i),
      new File(["x"], "shot.png", { type: "image/png" })
    );
    expect(onChange).toHaveBeenCalledTimes(1);
    const added = onChange.mock.calls[0][0] as { file: File; kind: string; url: string }[];
    expect(added[0].kind).toBe("image");
    expect(screen.getByText(/reviewed before it appears/i)).toBeInTheDocument();
  });

  it("rejects oversized files with an inline error", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediaUploader items={[]} onChange={onChange} />);
    const big = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/attach media/i), big);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/5MB or smaller/i)).toBeInTheDocument();
  });

  it("rejects unsupported types", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediaUploader items={[]} onChange={onChange} />);
    await user.upload(screen.getByLabelText(/attach media/i), new File(["x"], "doc.pdf", { type: "application/pdf" }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it("removes a preview, revokes its object URL, and calls onChange", async () => {
    const user = userEvent.setup();
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const onChange = vi.fn();
    const item = { file: new File(["x"], "shot.png", { type: "image/png" }), kind: "image" as const, url: "blob:mock-1" };
    render(<MediaUploader items={[item]} onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: /remove shot\.png/i }));
    expect(onChange).toHaveBeenCalledWith([]);
    expect(revoke).toHaveBeenCalledWith("blob:mock-1");
    revoke.mockRestore();
  });

  it("shows error for mixed batch but keeps valid files", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MediaUploader items={[]} onChange={onChange} />);
    const valid = new File(["x"], "a.png", { type: "image/png" });
    const invalid = new File([new ArrayBuffer(6 * 1024 * 1024)], "big.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/attach media/i), [valid, invalid]);
    expect(onChange).toHaveBeenCalledTimes(1);
    const added = onChange.mock.calls[0][0] as { file: File; kind: string; url: string }[];
    expect(added).toHaveLength(1);
    expect(added[0].file.name).toBe("a.png");
    expect(screen.getByText(/5MB or smaller/i)).toBeInTheDocument();
  });
});
