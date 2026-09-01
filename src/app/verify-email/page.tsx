"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check, Loader2, Mail, RefreshCw } from "lucide-react";
import { Brand } from "@/components/brand";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { Illustration } from "@/components/pixel/illustrations";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInEmail } = useAuth();

  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [busy, setBusy] = React.useState(false);
  const [resending, setResending] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [verified, setVerified] = React.useState(false);
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown countdown for "resend code"
  React.useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Focus first empty box on mount
  React.useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    // Auto-submit when all 6 are filled
    if (next.every((d) => d)) submitCode(next.join(""));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function submitCode(code: string) {
    if (busy || code.length !== 6) return;
    setBusy(true);
    setError(null);

    // The password the user typed at signup. Sent to /api/otp/verify so the
    // account's password is set to it after the code is confirmed (this also
    // lets signup double as a reset for an already-registered email).
    let pending: { email?: string; password?: string } | null = null;
    try {
      pending = JSON.parse(sessionStorage.getItem("otp_pending") || "null");
    } catch {
      pending = null;
    }

    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password: pending?.password || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not verify that code.");
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }
      setVerified(true);
      sessionStorage.removeItem("otp_pending");

      if (pending?.password) {
        const r = await signInEmail(pending.email || email, pending.password);
        if (!r.error) {
          router.push("/onboard");
          return;
        }
      }
      router.push("/login");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not resend the code.");
        return;
      }
      setCooldown(30);
    } finally {
      setResending(false);
    }
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
              <span className={cn("h-2 w-2", verified ? "bg-emerald" : "animate-pulse bg-accent")} />
              {verified ? "// email verified" : "// enter your code"}
            </span>

            {verified ? (
              <>
                <div className="mt-8 flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center border-2 border-ink bg-emerald shadow-[3px_3px_0_0_var(--color-ink)]">
                    <Check className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl leading-[1.1] tracking-tight text-ink">
                      You&apos;re verified.
                    </h1>
                    <p className="mt-1 font-mono text-xs text-emerald">email confirmed · welcome in</p>
                  </div>
                </div>
                <p className="mt-6 text-sm leading-relaxed text-muted">
                  Your account is confirmed. Let&apos;s set up your roadmap — we&apos;re taking you to
                  onboarding now.
                </p>
                <PixelButton size="lg" className="mt-7 w-full" onClick={() => router.push("/onboard")}>
                  Start onboarding
                </PixelButton>
              </>
            ) : (
              <>
                <div className="mt-6 flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center border-2 border-ink bg-accent shadow-[3px_3px_0_0_var(--color-ink)]">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl leading-[1.1] tracking-tight text-ink">
                      Check your inbox.
                    </h1>
                    <p className="mt-1 font-mono text-xs text-muted">we just sent you a 6-digit code</p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-muted">
                  We emailed a code to <span className="font-semibold text-ink">{email || "your address"}</span>.
                  Enter it below to verify your account.
                </p>

                <div className="mt-6 flex justify-between gap-2">
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={1}
                      value={d}
                      disabled={busy}
                      onChange={(e) => handleDigitChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      aria-label={`Digit ${i + 1} of 6`}
                      className={cn(
                        "h-14 w-12 border-2 border-ink bg-surface text-center font-mono text-2xl font-bold text-ink shadow-[2px_2px_0_0_var(--color-line)] focus:border-accent focus:shadow-[2px_2px_0_0_var(--color-accent)] focus:outline-none",
                        error && "border-danger shadow-[2px_2px_0_0_var(--color-danger)]"
                      )}
                    />
                  ))}
                </div>

                {error && (
                  <div className="mt-4 border-2 border-danger bg-danger/5 px-4 py-3">
                    <p className="font-mono text-xs text-danger">✕ {error}</p>
                  </div>
                )}

                <PixelButton
                  size="lg"
                  className="mt-6 w-full"
                  disabled={busy}
                  onClick={() => submitCode(digits.join(""))}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Verify email
                </PixelButton>

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={resend}
                    disabled={resending || cooldown > 0}
                    className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", resending && "animate-spin")} />
                    {cooldown > 0
                      ? `resend code in ${cooldown}s`
                      : resending
                      ? "sending…"
                      : "resend code"}
                  </button>
                </div>
              </>
            )}
          </PixelCard>

          <p className="mt-8 text-center font-mono text-[11px] uppercase tracking-widest text-faint">
            no spam, ever · your roadmap stays yours
          </p>
        </div>
      </main>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense>
      <VerifyEmailForm />
    </React.Suspense>
  );
}