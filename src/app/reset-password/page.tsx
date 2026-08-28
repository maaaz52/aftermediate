"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Brand } from "@/components/brand";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { Illustration } from "@/components/pixel/illustrations";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 h-12 w-full border-2 border-ink bg-surface px-3.5 font-sans text-sm text-ink shadow-[3px_3px_0_0_var(--color-line)] transition-all placeholder:text-faint focus:border-accent focus:shadow-[3px_3px_0_0_var(--color-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50";

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div>
      <span className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</span>
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash.includes("type=recovery");
  });

  React.useEffect(() => {
    if (ready) return;
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [ready]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (password !== confirm) {
      setError("Passwords don't match.");
      setBusy(false);
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      setError(err.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 3000);
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
            <div className="border-2 border-ink bg-emerald p-2 shadow-[3px_3px_0_0_var(--color-ink)]">
              <Illustration name="grad" scale={2} />
            </div>
          </div>

          <PixelCard className="relative p-7 sm:p-9" shadow="ink">
            <span className="inline-flex items-center gap-2 border-2 border-ink bg-surface-2 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-muted shadow-[3px_3px_0_0_var(--color-ink)]">
              <span className="h-2 w-2 animate-pulse bg-accent" />
              {"// new password"}
            </span>

            <h1 className="mt-6 font-display text-3xl leading-[1.1] tracking-tight text-ink sm:text-4xl">
              Set new password.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Choose a strong password for your account.
            </p>

            {!ready && !done ? (
              <div className="mt-7 flex items-center gap-3 border-2 border-ink bg-surface px-5 py-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span className="font-mono text-sm text-ink">verifying reset link…</span>
              </div>
            ) : done ? (
              <div className="mt-7 border-2 border-emerald bg-emerald/5 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center border-2 border-ink bg-emerald shadow-[2px_2px_0_0_var(--color-ink)]">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-ink">Password updated!</p>
                    <p className="mt-1 text-xs text-muted">
                      Redirecting you to your dashboard…
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-7 space-y-5">
                <PasswordField
                  label="New password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  autoComplete="new-password"
                />

                {error && (
                  <div className="border-2 border-danger bg-danger/5 px-4 py-3">
                    <p className="font-mono text-xs text-danger">✕ {error}</p>
                  </div>
                )}

                <PixelButton type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Update password
                </PixelButton>
              </form>
            )}
          </PixelCard>
        </div>
      </main>
    </div>
  );
}
