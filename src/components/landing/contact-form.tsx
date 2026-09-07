"use client";

import { useState } from "react";
import { submitContactMessage } from "@/lib/contact-api";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  if (submitted) {
    return (
      <div className="border-2 border-ink bg-surface p-6 shadow-[4px_4px_0_0_var(--color-ink)] text-center">
        <p className="text-lg font-bold text-ink">Thanks! We&apos;ll get back to you soon.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            setName("");
            setEmail("");
            setMessage("");
          }}
          className="mt-4 font-mono text-sm text-accent underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await submitContactMessage({ name, email, message });
        setBusy(false);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        setSubmitted(true);
      }}
      className="space-y-4 border-2 border-ink bg-surface p-6 shadow-[4px_4px_0_0_var(--color-ink)]"
    >
      <div>
        <label htmlFor="contact-name" className="mb-1 block font-mono text-xs uppercase tracking-widest text-faint">Name</label>
        <input
          id="contact-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full border-2 border-ink bg-background px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="mb-1 block font-mono text-xs uppercase tracking-widest text-faint">Email</label>
        <input
          id="contact-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border-2 border-ink bg-background px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
        />
      </div>
      <div>
        <label htmlFor="contact-msg" className="mb-1 block font-mono text-xs uppercase tracking-widest text-faint">Message</label>
        <textarea
          id="contact-msg"
          required
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your feedback or question..."
          className="w-full resize-none border-2 border-ink bg-background px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
        />
      </div>
      {error && (
        <p role="alert" className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full border-2 border-ink bg-accent py-3 font-sans text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:bg-accent-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
