"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Brand } from "@/components/brand";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { Illustration } from "@/components/pixel/illustrations";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

const inputClass =
  "mt-1.5 h-12 w-full border-2 border-ink bg-surface px-3.5 font-sans text-sm text-ink shadow-[3px_3px_0_0_var(--color-line)] transition-all placeholder:text-faint focus:border-accent focus:shadow-[3px_3px_0_0_var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

function Field({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="font-mono text-[11px] uppercase tracking-widest text-muted">
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
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</span>
        {hintHref ? (
          <Link href={hintHref} className="font-mono text-[11px] text-faint transition-colors hover:text-accent">
            forgot?
          </Link>
        ) : hint ? (
          <button type="button" className="font-mono text-[11px] text-faint transition-colors hover:text-accent">
            {hint}
          </button>
        ) : null}
      </div>
      <div className="relative mt-1.5">
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
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  React.useEffect(() => {
    if (user) router.push("/dashboard");
  }, [user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
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
      else if (r.needsConfirm)
        setMessage({
          type: "ok",
          text: "Check your email to confirm your account. Then come back and sign in.",
        });
      else router.push("/dashboard");
    }
    setBusy(false);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setMessage(null);
  }

  if (loading) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center px-4">
        <div className="flex items-center gap-3 border-2 border-ink bg-surface px-5 py-4 shadow-[4px_4px_0_0_var(--color-ink)]">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          <span className="font-mono text-sm text-ink">checking session…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid-bg relative flex min-h-screen flex-col">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/"><Brand /></Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back home
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-24 sm:px-6">
        <div className="relative w-full max-w-md">
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

          <PixelCard className="relative p-7 sm:p-9" shadow="ink">
            <span className="inline-flex items-center gap-2 border-2 border-ink bg-surface-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
              <span className="h-2 w-2 animate-pulse bg-accent" />
              {mode === "signin" ? "// welcome back" : "// start free"}
            </span>

            <h1 className="mt-6 font-display text-3xl leading-[1.1] tracking-tight text-ink sm:text-4xl">
              {mode === "signin" ? "Welcome back." : "Make your plan."}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {mode === "signin"
                ? "Your roadmap is waiting. Log in and pick up where you left off."
                : "Free forever for students. Build your post-FSc roadmap in minutes."}
            </p>

            <div className="mt-7 grid grid-cols-2 border-2 border-ink bg-surface-2 p-1 shadow-[3px_3px_0_0_var(--color-ink)]">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={cn(
                  "py-2.5 font-sans text-sm font-semibold transition-all",
                  mode === "signin" ? "bg-accent text-white" : "text-muted hover:text-ink"
                )}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={cn(
                  "py-2.5 font-sans text-sm font-semibold transition-all",
                  mode === "signup" ? "bg-accent text-white" : "text-muted hover:text-ink"
                )}
              >
                Sign up
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-5">
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
                    "border-2 px-4 py-3",
                    message.type === "err" ? "border-danger bg-danger/5" : "border-emerald bg-emerald/5"
                  )}
                >
                  <p className={cn("font-mono text-xs", message.type === "err" ? "text-danger" : "text-emerald")}>
                    {message.type === "err" ? "✕ " : "✓ "}
                    {message.text}
                  </p>
                </div>
              )}

              <PixelButton type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "signin" ? "Login" : "Create account"}
              </PixelButton>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-[2px] flex-1 bg-line" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-faint">or</span>
              <div className="h-[2px] flex-1 bg-line" />
            </div>

            <PixelButton variant="secondary" size="lg" className="w-full" onClick={signInGoogle}>
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </PixelButton>

            <button
              type="button"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              className="mt-6 block w-full text-center font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
            >
              {mode === "signin" ? "no account? sign up →" : "have an account? login →"}
            </button>
          </PixelCard>

          <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-faint">
            no spam, ever · your roadmap stays yours
          </p>
        </div>
      </main>
    </div>
  );
}