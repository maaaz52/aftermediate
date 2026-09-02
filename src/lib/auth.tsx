"use client";

import * as React from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export interface SignUpData {
  name?: string;
  stream?: string | null;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signUpEmail: (
    email: string,
    password: string,
    data?: SignUpData
  ) => Promise<{ error?: string; needsConfirm?: boolean; email?: string }>;
  signInGoogle: (idToken: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
}

const Ctx = React.createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = React.useMemo(() => createClient(), []);
  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  const signInEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  };

  const signUpEmail = async (email: string, password: string, data?: SignUpData) => {
    // Custom OTP flow: the server creates the (unconfirmed) user and emails a 6-digit code.
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: data?.name }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error || "Could not start sign-up. Try again." };
    return { needsConfirm: true, email };
  };

  const signInGoogle = async (idToken: string) => {
    // Direct Google sign-in: Google (via GIS) already verified the ID token, so
    // Supabase only issues a session from it — no Supabase OAuth redirect page.
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // Never leave the previous student's local profile behind for the next
    // person on this device.
    try {
      window.localStorage.removeItem("aftermediate:profile");
      window.localStorage.removeItem("aftermediate:profile:updatedAt");
    } catch {
      /* ignore */
    }
    // Force a full navigation to the public landing page so the session is
    // cleared and no protected UI or client state lingers. Works from any route.
    window.location.assign("/");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { error: error.message } : {};
  };

  const value = React.useMemo<AuthCtx>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      signInEmail,
      signUpEmail,
      signInGoogle,
      signOut,
      resetPassword,
    }),
    [session, loading]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
