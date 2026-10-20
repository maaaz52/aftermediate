"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { Illustration } from "@/components/pixel/illustrations";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const inputClass =
  "mt-0.5 h-9 w-full border-2 border-ink bg-surface px-3 font-sans text-sm text-ink shadow-[3px_3px_0_0_var(--color-line)] transition-all placeholder:text-faint focus:border-accent focus:shadow-[3px_3px_0_0_var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </label>
      <input {...props} className={cn(inputClass, className)} />
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  hint,
  hintHref,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  hint?: string;
  hintHref?: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</span>
        {hintHref ? (
          <Link href={hintHref} className="font-mono text-[10px] text-faint transition-colors hover:text-accent">
            forgot?
          </Link>
        ) : hint ? (
          <button type="button" className="font-mono text-[10px] text-faint transition-colors hover:text-accent">
            {hint}
          </button>
        ) : null}
      </div>
      <div className="relative mt-0.5">
        <input
          type={show ? "text" : "password"}
          required
          minLength={6}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          className={cn(inputClass, "pr-11")}
        />
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((v) => !v)}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 p-1.5 text-faint transition-colors hover:text-ink"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, signInEmail, signUpEmail, signInGoogle } = useAuth();
  const [mode, setMode] = React.useState<Mode>(() => {
    if (typeof window === "undefined") return "signin";
    return new URLSearchParams(window.location.search).get("mode") === "signup" ? "signup" : "signin";
  });
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [agreed, setAgreed] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [googleBusy, setGoogleBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("verified") === "1"
      ? { type: "ok", text: "Email verified. Sign in with your password to continue." }
      : null;
  });

  React.useEffect(() => {
    if (user) router.push(mode === "signup" ? "/onboard" : "/dashboard");
  }, [user, router, mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    if (!agreed) {
      setMessage({ type: "err", text: "Please accept the terms and privacy policy to continue." });
      setBusy(false);
      return;
    }
    if (mode === "signin") {
      const r = await signInEmail(email, password);
      if (r.error) setMessage({ type: "err", text: r.error });
      else router.push("/dashboard");
    } else {
      if (password !== confirm) {
        setMessage({ type: "err", text: "Passwords don't match. Double-check and try again." });
        setBusy(false);
        return;
      }
      const r = await signUpEmail(email, password, { name: name.trim() || undefined });
      if (r.error) setMessage({ type: "err", text: r.error });
      else if (r.needsConfirm) {
        router.push(`/verify-email?email=${encodeURIComponent(r.email || email)}`);
      } else router.push("/onboard");
    }
    setBusy(false);
  }

  const handleGoogleCredential = React.useCallback(async (idToken: string) => {
    setGoogleBusy(true);
    setMessage(null);
    if (!agreed) {
      setMessage({ type: "err", text: "Please accept the terms and privacy policy to continue." });
      setGoogleBusy(false);
      return;
    }
    const r = await signInGoogle(idToken);
    if (r.error) {
      setMessage({ type: "err", text: r.error });
      setGoogleBusy(false);
      return;
    }
    router.push("/onboard");
  }, [agreed, router, signInGoogle]);

  const handleGoogleError = React.useCallback((error: string) => {
    setMessage({ type: "err", text: error });
  }, []);

  function switchMode(m: Mode) {
    setMode(m);
    setMessage(null);
  }

  if (loading) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <div className="flex justify-center">
            <Skeleton className="h-10 w-40" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="mx-auto h-4 w-56" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid-bg relative flex min-h-screen flex-col">
      <header className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/"><Brand /></Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back home
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center overflow-y-auto px-4 py-2 sm:px-6 sm:py-3">
        <div className="relative w-full max-w-sm">
          <div className="absolute -top-9 -left-4 z-10 hidden animate-float sm:block">
            <div className="border-2 border-ink bg-emerald p-2 shadow-[3px_3px_0_0_var(--color-ink)]">
              <Illustration name="grad" scale={2} />
            </div>
          </div>
          <div className="absolute -top-10 -right-4 z-10 hidden animate-float sm:block" style={{ animationDelay: "900ms" }}>
            <div className="border-2 border-ink bg-accent p-2 shadow-[3px_3px_0_0_var(--color-ink)]">
              <Illustration name="rocket" scale={2} />
            </div>
          </div>

          <PixelCard className="relative p-3 sm:p-4" shadow="ink">
            <h1 className="font-display text-xl leading-[1.1] tracking-tight text-ink sm:text-2xl">
              {mode === "signin" ? "Welcome back." : "Make your plan."}
            </h1>
            <p className="mt-1 text-xs leading-snug text-muted">
              {mode === "signin"
                ? "Your roadmap is waiting. Log in and pick up where you left off."
                : "Free forever for students. Build your post-FSc roadmap in minutes."}
            </p>

            <div className="mt-3 grid grid-cols-2 border-2 border-ink bg-surface-2 p-1 shadow-[3px_3px_0_0_var(--color-ink)]">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={cn(
                  "py-1.5 font-sans text-sm font-semibold transition-all",
                  mode === "signin" ? "bg-accent text-white" : "text-muted hover:text-ink"
                )}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={cn(
                  "py-1.5 font-sans text-sm font-semibold transition-all",
                  mode === "signup" ? "bg-accent text-white" : "text-muted hover:text-ink"
                )}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={submit} className="mt-3 space-y-2.5">
              {mode === "signup" && (
                <>
                  <Field
                    label="Full name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ali Raza"
                  />
                </>
              )}

              <Field
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />

              <PasswordField
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                hintHref={mode === "signin" ? "/forgot-password" : undefined}
              />

              {mode === "signup" && (
                <PasswordField
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                />
              )}

              {message && (
                <div
                  className={cn(
                    "border-2 px-3 py-1.5",
                    message.type === "err" ? "border-danger bg-danger/5" : "border-emerald bg-emerald/5"
                  )}
                >
                  <p className={cn("font-mono text-xs", message.type === "err" ? "text-danger" : "text-emerald")}>
                    {message.type === "err" ? "✕ " : "✓ "}
                    {message.text}
                  </p>
                </div>
              )}

              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-accent"
                />
                <span className="text-[11px] leading-snug text-muted">
                  I agree to the{" "}
                  <Link href="/terms" className="font-medium text-accent underline underline-offset-2 hover:text-ink">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="font-medium text-accent underline underline-offset-2 hover:text-ink">
                    Privacy Policy
                  </Link>.
                </span>
              </label>

              <PixelButton type="submit" className="h-10 w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Login" : "Create account"}
              </PixelButton>
            </form>

            <div className="my-3 flex items-center gap-3">
              <div className="h-[2px] flex-1 bg-line" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-faint">or</span>
              <div className="h-[2px] flex-1 bg-line" />
            </div>

            <GoogleSignInButton
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
              onCredential={handleGoogleCredential}
              onError={handleGoogleError}
            />
            {googleBusy && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                <span className="font-mono text-xs text-muted">connecting…</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="mt-3 block w-full text-center font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
            >
              {mode === "signin" ? "no account? sign up →" : "have an account? login →"}
            </button>
          </PixelCard>

        </div>
      </main>
    </div>
  );
}
