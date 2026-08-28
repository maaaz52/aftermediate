"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import wJson from "@/data/webinars.json";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface Webinar {
  id: string;
  title: string;
  host: string;
  date: string; // ISO 8601
  description: string;
  categories: string[];
  registerUrl: string;
  thumbnailUrl: string | null;
}

const data = wJson as unknown as { dataYear: number; webinars: Webinar[] };

const CATEGORIES = [
  "All",
  "Medical",
  "Engineering",
  "Scholarships",
  "Study Abroad",
  "Career Planning",
  "Technology",
  "Business",
  "Test Prep",
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWebinarDate(iso: string): string {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Karachi",
    timeZoneName: "short",
  };
  return d.toLocaleDateString("en-PK", opts);
}

function isUpcoming(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

const categoryBadgeVariant = (
  cat: string,
): "saffron" | "emerald" | "info" | "violet" | "danger" | "muted" => {
  const map: Record<string, "saffron" | "emerald" | "info" | "violet" | "danger" | "muted"> = {
    Medical: "danger",
    Engineering: "saffron",
    Scholarships: "emerald",
    "Study Abroad": "info",
    "Career Planning": "violet",
    Technology: "info",
    Business: "saffron",
    "Test Prep": "muted",
  };
  return map[cat] ?? "muted";
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WebinarsPage() {
  const [filter, setFilter] = React.useState<string>("All");

  const items = data.webinars.filter(
    (w) => filter === "All" || w.categories.includes(filter),
  );

  const sorted = [...items].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Webinars</Badge>
        <span className="font-mono text-xs text-faint">free · curated · live & recorded</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Career Webinars
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Upcoming and recently recorded sessions from universities, scholarship
        bodies, and career experts — curated for Pakistani students.
      </p>

      {/* Category filter chips */}
      <div
        className="animate-reveal mt-8 flex flex-wrap gap-2"
        style={{ animationDelay: "60ms" }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            aria-pressed={filter === cat}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              filter === cat
                ? "border-saffron/40 bg-saffron/10 text-saffron"
                : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div
        className="animate-reveal mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        style={{ animationDelay: "120ms" }}
      >
        {sorted.map((w) => {
          const upcoming = isUpcoming(w.date);
          return (
            <div
              key={w.id}
              className={cn(
                "card-glass rounded-2xl p-5 transition-all",
                !upcoming && "opacity-70",
              )}
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-ink">{w.title}</h3>
                <Badge variant={upcoming ? "emerald" : "muted"}>
                  {upcoming ? "Upcoming" : "Recorded"}
                </Badge>
              </div>

              {/* Host */}
              <p className="mt-1 text-xs text-faint">{w.host}</p>

              {/* Date */}
              <p className="mt-2 text-xs text-muted">
                <span className="font-mono">{formatWebinarDate(w.date)}</span>
              </p>

              {/* Categories */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.categories.map((cat) => (
                  <Badge key={cat} variant={categoryBadgeVariant(cat)}>
                    {cat}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
                {w.description}
              </p>

              {/* Action */}
              <div className="mt-4">
                <a
                  href={w.registerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
                    upcoming
                      ? "text-saffron hover:underline"
                      : "text-muted hover:text-ink hover:underline",
                  )}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {upcoming ? "Register free" : "Watch recording"}
                </a>
              </div>
            </div>
          );
        })}

        {sorted.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-faint">
            No webinars found for this category.
          </p>
        )}
      </div>
    </div>
  );
}