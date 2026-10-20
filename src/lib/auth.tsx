"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  const signInEmail = React.useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, [supabase]);

  const signUpEmail = React.useCallback(async (email: string, password: string, data?: SignUpData) => {
    // The server stores the password only in Supabase Auth, then emails a
    // single-use code that confirms the already-created pending account.
    const res = await fetch("/api/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: data?.name }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { error: json.error || "Could not start sign-up. Try again." };
    return { needsConfirm: true, email };
  }, []);

  const signInGoogle = React.useCallback(async (idToken: string) => {
    // Direct Google sign-in: Google (via GIS) already verified the ID token, so
    // Supabase only issues a session from it — no Supabase OAuth redirect page.
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: idToken,
    });
    return error ? { error: error.message } : {};
  }, [supabase]);

  const signOut = React.useCallback(async () => {
    await supabase.auth.signOut();
    // Never leave the previous student's local profile behind for the next
    // person on this device.
    try {
      window.localStorage.removeItem("aftermediate:profile");
      window.localStorage.removeItem("aftermediate:profile:updatedAt");
    } catch {
      /* ignore */
    }
    router.replace("/");
    router.refresh();
  }, [router, supabase]);

  const resetPassword = React.useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return error ? { error: error.message } : {};
  }, [supabase]);

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
    [session, loading, signInEmail, signUpEmail, signInGoogle, signOut, resetPassword]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
