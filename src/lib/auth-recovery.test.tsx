// @vitest-environment jsdom
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { AuthProvider, useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { recoveryStore } from "@/lib/supabase/recovery";
import ResetPasswordPage from "@/app/reset-password/page";
import ForgotPasswordPage from "@/app/forgot-password/page";

const mocks = vi.hoisted(() => ({
  replace: vi.fn(), push: vi.fn(), refresh: vi.fn(), client: null as unknown,
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("@supabase/ssr", () => ({ createBrowserClient: () => mocks.client }));

let callbacks: ((event: AuthChangeEvent, session: Session | null) => void)[];
let recover: boolean;
let auth: ReturnType<typeof makeAuth>;
const session = { user: { id: "student" } } as Session;
function makeAuth() {
  return {
    onAuthStateChange: vi.fn((fn: (event: AuthChangeEvent, session: Session | null) => void) => {
      callbacks.push(fn);
      return { data: { subscription: { unsubscribe: () => {
        callbacks = callbacks.filter((callback) => callback !== fn);
      } } } };
    }),
    initialize: vi.fn(async () => {
      // Match the SDK: initialization schedules the recovery event on a task.
      if (recover) setTimeout(() => callbacks.forEach((fn) => fn("PASSWORD_RECOVERY", session)), 0);
      return { error: null };
    }),
    getSession: vi.fn(async () => ({ data: { session: null as Session | null }, error: null })),
    exchangeCodeForSession: vi.fn(),
    updateUser: vi.fn<(data: { password: string }) => Promise<{ error: { message: string } | null }>>(async () => ({ error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    signInWithPassword: vi.fn(async () => ({ error: null })),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  callbacks = [];
  recover = true;
  recoveryStore.clear();
  auth = makeAuth();
  mocks.client = { auth };
  window.history.replaceState(null, "", "/");
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

function Probe() {
  const { recoveryStatus, signInEmail } = useAuth();
  return <button onClick={() => void signInEmail("student@example.com", "password")}>{recoveryStatus}</button>;
}

describe("password recovery callbacks", () => {
  it.each(["/?code=one-use", "/reset-password?code=one-use", "/#access_token=token&type=recovery"])(
    "handles %s without manually exchanging the code again", async (path) => {
      window.history.replaceState(null, "", path);
      render(<AuthProvider><Probe /></AuthProvider>);
      await screen.findByRole("button", { name: "ready" });
      expect(auth.initialize).toHaveBeenCalledTimes(1);
      expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
      if (path.startsWith("/reset-password")) expect(mocks.replace).not.toHaveBeenCalled();
      else expect(mocks.replace).toHaveBeenCalledWith("/reset-password");
    }
  );

  it("retains recovery completed before the reset page mounts", async () => {
    window.history.replaceState(null, "", "/?code=one-use");
    createClient();
    await waitFor(() => expect(recoveryStore.getSnapshot()).toBe("ready"));
    render(<AuthProvider><ResetPasswordPage /></AuthProvider>);
    expect(screen.getByLabelText("New password")).toBeTruthy();
    expect(auth.initialize).toHaveBeenCalledTimes(1);
  });

  it("does not restart initialization under React Strict Mode", async () => {
    window.history.replaceState(null, "", "/?code=one-use");
    render(<React.StrictMode><AuthProvider><Probe /></AuthProvider></React.StrictMode>);
    await screen.findByRole("button", { name: "ready" });
    expect(auth.initialize).toHaveBeenCalledTimes(1);
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("shows a retry when initialization rejects", async () => {
    auth.initialize.mockRejectedValue(new Error("Network error"));
    window.history.replaceState(null, "", "/reset-password?code=failed");
    render(<AuthProvider><ResetPasswordPage /></AuthProvider>);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it.each(["/?code=used", "/reset-password?code=missing-verifier", "/#error=access_denied&error_code=otp_expired"])(
    "shows a retry for invalid callback %s even with an existing session", async (path) => {
      recover = false;
      auth.getSession.mockResolvedValue({ data: { session }, error: null });
      window.history.replaceState(null, "", path);
      render(<AuthProvider><ResetPasswordPage /></AuthProvider>);
      expect(await screen.findByRole("alert")).toBeTruthy();
      expect(screen.getByRole("link", { name: "Request another link" }).getAttribute("href")).toBe("/forgot-password");
      expect(screen.queryByLabelText("New password")).toBeNull();
      if (path.startsWith("/?") || path.startsWith("/#")) expect(mocks.replace).toHaveBeenCalledWith("/reset-password");
    }
  );

  it("bounds verification when initialization hangs", async () => {
    vi.useFakeTimers();
    auth.initialize.mockReturnValue(new Promise(() => {}));
    window.history.replaceState(null, "", "/reset-password?code=stalled");
    render(<AuthProvider><ResetPasswordPage /></AuthProvider>);
    expect(screen.getByText("verifying reset link…")).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(15000));
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("keeps ordinary homepage visits and password sign-in unchanged", async () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    fireEvent.click(screen.getByRole("button", { name: "idle" }));
    await waitFor(() => expect(auth.signInWithPassword).toHaveBeenCalledWith({ email: "student@example.com", password: "password" }));
    expect(auth.initialize).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("shows a retry when the reset page is opened without a link", () => {
    window.history.replaceState(null, "", "/reset-password");
    render(<AuthProvider><ResetPasswordPage /></AuthProvider>);
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});

describe("password reset form", () => {
  async function openForm() {
    window.history.replaceState(null, "", "/reset-password?code=one-use");
    render(<AuthProvider><ResetPasswordPage /></AuthProvider>);
    await screen.findByLabelText("New password");
  }
  function fill(password: string, confirm: string) {
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: confirm } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
  }
  it("rejects mismatching passwords before calling Supabase", async () => {
    await openForm();
    fill("password1", "password2");
    expect(screen.getByText(/Passwords don't match/)).toBeTruthy();
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("shows update errors and keeps the form available", async () => {
    auth.updateUser.mockResolvedValue({ error: { message: "Choose a different password" } });
    await openForm();
    fill("password1", "password1");
    expect(await screen.findByText(/Choose a different password/)).toBeTruthy();
    expect(screen.getByLabelText("New password")).toBeTruthy();
  });
  it("updates the password, clears recovery, and redirects after success", async () => {
    await openForm();
    vi.useFakeTimers();
    fill("password1", "password1");
    await act(async () => {});
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "password1" });
    expect(screen.getByText("Password updated!")).toBeTruthy();
    expect(recoveryStore.getSnapshot()).toBe("idle");
    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
  });
  it("sends reset email through the shared function with the reset destination", async () => {
    render(<AuthProvider><ForgotPasswordPage /></AuthProvider>);
    fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "student@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("Check your email")).toBeTruthy();
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("student@example.com", {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  });
});
