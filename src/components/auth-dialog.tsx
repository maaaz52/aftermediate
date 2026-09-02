"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { useAuth } from "@/lib/auth";

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [googleBusy, setGoogleBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    if (mode === "signin") {
      const r = await signInEmail(email, password);
      if (r.error) setMessage({ type: "err", text: r.error });
      else onClose();
    } else {
      const r = await signUpEmail(email, password);
      if (r.error) setMessage({ type: "err", text: r.error });
      else if (r.needsConfirm) setMessage({ type: "ok", text: "Check your email to confirm your account." });
      else {
        onClose();
        router.push("/onboard");
      }
    }
    setBusy(false);
  }

  async function handleGoogleCredential(idToken: string) {
    setGoogleBusy(true);
    setMessage(null);
    const r = await signInGoogle(idToken);
    if (r.error) {
      setMessage({ type: "err", text: r.error });
      setGoogleBusy(false);
      return;
    }
    onClose();
    router.push("/onboard");
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-2xl animate-rise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight text-ink">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">Save your roadmap and sync across devices.</p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <Label>Email</Label>
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1" />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
          </div>
          {message && (
            <p className={message.type === "err" ? "text-sm text-danger" : "text-sm text-emerald"}>{message.text}</p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {mode === "signin" ? "Sign in" : "Sign up"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-faint">
          <div className="h-px flex-1 bg-line" /> or <div className="h-px flex-1 bg-line" />
        </div>

        <GoogleSignInButton
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}
          onCredential={handleGoogleCredential}
          onError={(error) => setMessage({ type: "err", text: error })}
        />
        {googleBusy && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            <span className="font-mono text-xs text-muted">connecting…</span>
          </div>
        )}

        <button
          className="mt-4 w-full text-center text-sm text-muted hover:text-ink"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(null); }}
        >
          {mode === "signin" ? "No account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
