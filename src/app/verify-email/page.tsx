"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Mail } from "lucide-react";
import { Brand } from "@/components/brand";
import { PixelButton } from "@/components/ui/pixel-button";
import { PixelCard } from "@/components/ui/pixel-card";
import { Illustration } from "@/components/pixel/illustrations";
import { useAuth } from "@/lib/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (user) {
      // Give the success state a moment to show before redirecting.
      const t = setTimeout(() => router.push("/dashboard"), 2500);
      return () => clearTimeout(t);
    }
  }, [user, router]);

  return (
    <div className="grid-bg relative flex min-h-screen flex-col">
      <header className="mx-auto flex h-20 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/"><Brand /></Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
        >
          back to sign in
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
              <span className="h-2 w-2 animate-pulse bg-emerald" />
              {"// email verified"}
            </span>

            {loading ? (
              <div className="mt-8 flex items-center gap-3 border-2 border-ink bg-surface px-5 py-4 shadow-[4px_4px_0_0_var(--color-ink)]">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span className="font-mono text-sm text-ink">verifying your email…</span>
              </div>
            ) : user ? (
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
                  Your account is confirmed. Your roadmap is one click away — we&apos;re taking you
                  to your dashboard now.
                </p>

                <PixelButton
                  size="lg"
                  className="mt-7 w-full"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to dashboard <ArrowRight />
                </PixelButton>
              </>
            ) : (
              <>
                <div className="mt-8 flex items-center gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center border-2 border-ink bg-accent shadow-[3px_3px_0_0_var(--color-ink)]">
                    <Mail className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl leading-[1.1] tracking-tight text-ink">
                      Check your inbox.
                    </h1>
                    <p className="mt-1 font-mono text-xs text-muted">we just sent you a link</p>
                  </div>
                </div>

                <p className="mt-6 text-sm leading-relaxed text-muted">
                  Open the confirmation link we emailed you to verify your account. This page is
                  for after you click it.
                </p>

                <PixelButton
                  variant="secondary"
                  size="lg"
                  className="mt-7 w-full"
                  onClick={() => router.push("/login")}
                >
                  Back to sign in
                </PixelButton>
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