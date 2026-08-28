"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { Brand } from "@/components/brand";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { Illustration } from "@/components/pixel/illustrations";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-1.5 h-12 w-full border-2 border-ink bg-surface px-3.5 font-sans text-sm text-ink shadow-[3px_3px_0_0_var(--color-line)] transition-all placeholder:text-faint focus:border-accent focus:shadow-[3px_3px_0_0_var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setBusy(false);
  }

  return (
    <div className="grid-bg relative flex min-h-screen flex-col">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/"><Brand /></Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> back to sign in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 pb-24 sm:px-6">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-9 -left-4 z-10 hidden animate-float sm:block">
            <div className="border-2 border-ink bg-accent p-2 shadow-[3px_3px_0_0_var(--color-ink)]">
              <Illustration name="compass" scale={2} />
            </div>
          </div>

          <PixelCard className="relative p-7 sm:p-9" shadow="ink">
            <span className="inline-flex items-center gap-2 border-2 border-ink bg-surface-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
              <span className="h-2 w-2 animate-pulse bg-accent" />
              {"// password reset"}
            </span>

            <h1 className="mt-6 font-display text-3xl leading-[1.1] tracking-tight text-ink sm:text-4xl">
              Forgot your password?
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {sent ? (
              <div className="mt-7 border-2 border-emerald bg-emerald/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center border-2 border-ink bg-emerald shadow-[2px_2px_0_0_var(--color-ink)]">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-ink">Check your email</p>
                    <p className="mt-1 text-xs text-muted">
                      We sent a password reset link to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="mt-5 block w-full border-2 border-ink bg-surface py-3 text-center font-sans text-sm font-semibold text-ink shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:bg-surface-2 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-7 space-y-5">
                <div>
                  <label className="font-mono text-[11px] uppercase tracking-widest text-muted">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                  />
                </div>

                {error && (
                  <div className="border-2 border-danger bg-danger/5 px-4 py-3">
                    <p className="font-mono text-xs text-danger">✕ {error}</p>
                  </div>
                )}

                <PixelButton type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Send reset link
                </PixelButton>
              </form>
            )}

            <Link
              href="/login"
              className="mt-6 block w-full text-center font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent"
            >
              ← remember your password? sign in
            </Link>
          </PixelCard>
        </div>
      </main>
    </div>
  );
}
