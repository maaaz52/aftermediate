// @vitest-environment jsdom
import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor, screen } from "@testing-library/react";

const auth = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("@/lib/auth", () => ({ useAuth: () => ({ user: auth.user }) }));

import { RahbarDrawer } from "./rahbar-drawer";

beforeEach(() => {
  cleanup();
  Element.prototype.scrollIntoView = vi.fn(); // jsdom lacks scrollIntoView
  window.localStorage.clear();
  auth.user = { id: "u1" };
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

it("restores the signed-in student's own thread", () => {
  window.localStorage.setItem(
    "aftermediate:rahbar-chat:u1",
    JSON.stringify([{ role: "user", content: "my own question" }])
  );
  window.localStorage.setItem(
    "aftermediate:rahbar-chat:u2",
    JSON.stringify([{ role: "user", content: "a sibling's private question" }])
  );

  render(<RahbarDrawer />);

  expect(screen.getByText("my own question")).toBeTruthy();
  expect(screen.queryByText("a sibling's private question")).toBeNull();
});

it("saves the thread under the signed-in user's key, not the shared one", async () => {
  render(<RahbarDrawer />);

  await waitFor(() =>
    expect(
      JSON.parse(window.localStorage.getItem("aftermediate:rahbar-chat:u1") ?? "[]")
    ).toHaveLength(1)
  );
  expect(window.localStorage.getItem("aftermediate:rahbar-chat")).toBeNull();
});

it("deletes the shared key a previous student left behind", async () => {
  window.localStorage.setItem(
    "aftermediate:rahbar-chat",
    JSON.stringify([{ role: "user", content: "someone else's transcript" }])
  );

  render(<RahbarDrawer />);

  await waitFor(() =>
    expect(window.localStorage.getItem("aftermediate:rahbar-chat")).toBeNull()
  );
  expect(screen.queryByText("someone else's transcript")).toBeNull();
});

it("still renders a greeting when nobody is signed in", () => {
  auth.user = null;

  render(<RahbarDrawer />);

  expect(screen.getByText(/I'm Rahbar/)).toBeTruthy();
  expect(window.localStorage.length).toBe(0);
});
