"use client";

import * as React from "react";
import { X, Loader2, Mail, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInEmail, signUpEmail, signInGoogle } = useAuth();
  const [mode, setMode] = React.useState<"signin" | "signup">("signin");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
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
      else onClose();
    }
    setBusy(false);
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

        <Button variant="secondary" className="w-full" onClick={signInGoogle}>
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </Button>

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
