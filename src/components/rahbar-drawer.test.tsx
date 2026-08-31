// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { RahbarDrawer } from "./rahbar-drawer";

beforeEach(() => {
  cleanup();
  Element.prototype.scrollIntoView = vi.fn(); // jsdom lacks scrollIntoView
  window.localStorage.removeItem("aftermediate:rahbar-chat");
});

afterEach(() => cleanup());

it("opens on the open-rahbar event and announces rahbar-open", async () => {
  const spy = vi.spyOn(document, "dispatchEvent");
  render(<RahbarDrawer />);

  document.dispatchEvent(new CustomEvent("open-rahbar"));

  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "rahbar-open" }))
  );
  expect(document.querySelector(".bg-ink\\/20")).toBeTruthy();
  spy.mockRestore();
});

it("closes on the close-rahbar event and announces rahbar-closed", async () => {
  const spy = vi.spyOn(document, "dispatchEvent");
  render(<RahbarDrawer />);
  document.dispatchEvent(new CustomEvent("open-rahbar"));
  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "rahbar-open" }))
  );

  document.dispatchEvent(new CustomEvent("close-rahbar"));

  await waitFor(() =>
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "rahbar-closed" }))
  );
  expect(document.querySelector(".bg-ink\\/20")).toBeNull();
  spy.mockRestore();
});
