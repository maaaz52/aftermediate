"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="border-2 border-ink bg-surface p-6 shadow-[4px_4px_0_0_var(--color-ink)] text-center">
        <p className="text-lg font-bold text-ink">Thanks! We&apos;ll get back to you soon.</p>
        <button
          onClick={() => setSubmitted(false)}
          className="mt-4 font-mono text-sm text-accent underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
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
          placeholder="Your feedback or question..."
          className="w-full resize-none border-2 border-ink bg-background px-4 py-2.5 text-sm text-ink outline-none placeholder:text-faint focus:border-accent"
        />
      </div>
      <div>
        <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-faint">Rate your experience</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <label key={star} className="cursor-pointer text-2xl text-faint transition-colors hover:text-amber checked:text-amber">
              <input type="radio" name="rating" value={star} className="sr-only" />
              ★
            </label>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="w-full border-2 border-ink bg-accent py-3 font-sans text-sm font-semibold text-white shadow-[3px_3px_0_0_var(--color-ink)] transition-all hover:bg-accent-soft active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        Send message
      </button>
    </form>
  );
}
