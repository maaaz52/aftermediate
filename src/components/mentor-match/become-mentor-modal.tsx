"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FIELDS = [
  { value: "engineering", label: "Engineering" },
  { value: "medical", label: "Medical" },
  { value: "tech", label: "Tech" },
  { value: "business", label: "Business" },
  { value: "arts", label: "Arts" },
  { value: "civil-services", label: "Civil Services" },
];

export function BecomeMentorModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [submitted, setSubmitted] = React.useState(false);

  if (!open) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
        <div className="card-glass w-full max-w-md rounded-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
          <p className="text-3xl">🎉</p>
          <h2 className="mt-3 text-lg font-bold text-ink">Thanks for volunteering!</h2>
          <p className="mt-1 text-sm text-muted">
            We&apos;ll review your application and reach out within a few days.
          </p>
          <Button variant="default" className="mt-5 w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div
        className="card-glass w-full max-w-lg rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">Become a mentor</h2>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">
          Share your experience and help the next generation of students.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="mt-5 space-y-4"
        >
          <div>
            <label htmlFor="mentor-name" className="text-xs font-medium text-muted">Full name</label>
            <Input id="mentor-name" required placeholder="e.g. Ali Raza" className="mt-1" />
          </div>

          <div>
            <label htmlFor="mentor-email" className="text-xs font-medium text-muted">Email</label>
            <Input id="mentor-email" type="email" required placeholder="you@example.com" className="mt-1" />
          </div>

          <div>
            <label htmlFor="mentor-institution" className="text-xs font-medium text-muted">Institution</label>
            <Input id="mentor-institution" required placeholder="e.g. NUST" className="mt-1" />
          </div>

          <div>
            <label htmlFor="mentor-degree" className="text-xs font-medium text-muted">Degree / program</label>
            <Input id="mentor-degree" required placeholder="e.g. BS Computer Science" className="mt-1" />
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Field</label>
            <div className="mt-1 flex flex-wrap gap-2">
              {FIELDS.map((f) => (
                <label key={f.value} className="flex items-center gap-1.5">
                  <input type="radio" name="field" value={f.value} required className="accent-accent" />
                  <span className="text-sm text-ink">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="mentor-bio" className="text-xs font-medium text-muted">Short bio</label>
            <textarea
              id="mentor-bio"
              required
              rows={3}
              placeholder="Tell students about your journey..."
              className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div>
            <label htmlFor="mentor-topics" className="text-xs font-medium text-muted">Topics you can help with</label>
            <Input id="mentor-topics" required placeholder="e.g. MDCAT prep, NUST admission, scholarships" className="mt-1" />
          </div>

          <div>
            <label htmlFor="mentor-social" className="text-xs font-medium text-muted">Instagram / Discord / WhatsApp link</label>
            <Input id="mentor-social" type="url" required placeholder="https://..." className="mt-1" />
          </div>

          <Button type="submit" variant="default" className="w-full">
            Submit application
          </Button>
        </form>
      </div>
    </div>
  );
}
