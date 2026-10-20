"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteSearchResult } from "@/lib/site-search";

type SearchResponse = { results?: SiteSearchResult[] };

export function SiteSearch() {
  const router = useRouter();
  const inputId = React.useId();
  const listboxId = `${inputId}-results`;
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SiteSearchResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);

  React.useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      const clear = window.setTimeout(() => {
        setResults([]);
        setLoading(false);
      }, 0);
      return () => window.clearTimeout(clear);
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search request failed");
        const payload = (await response.json()) as SearchResponse;
        setResults(Array.isArray(payload.results) ? payload.results : []);
        setOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const choose = React.useCallback(
    (result: SiteSearchResult) => {
      setQuery("");
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      router.push(result.href);
    },
    [router]
  );

  const showResults = open && query.trim().length >= 2;

  return (
    <div className="relative w-64 xl:w-72">
      <Search
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
      />
      <input
        id={inputId}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setActiveIndex(-1);
          setOpen(true);
        }}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
          }
          if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
            event.preventDefault();
            choose(results[activeIndex]);
          }
        }}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showResults}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${inputId}-option-${activeIndex}` : undefined}
        placeholder="Search universities, pages…"
        className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-8 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            setOpen(false);
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:bg-surface-2 hover:text-ink"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showResults && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(28rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-xl"
        >
          {loading ? (
            <p className="px-3 py-3 font-mono text-xs text-faint">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">No matching university or page.</p>
          ) : (
            results.map((result, index) => (
              <button
                key={result.id}
                id={`${inputId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(result)}
                onMouseEnter={() => setActiveIndex(index)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  index === activeIndex ? "bg-saffron/10" : "hover:bg-surface-2"
                )}
              >
                <span className={cn(
                  "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md",
                  result.kind === "university" ? "bg-saffron/10 text-saffron" : "bg-info/10 text-info"
                )}>
                  {result.kind === "university" ? <GraduationCap className="h-4 w-4" /> : <Search className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">{result.label}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{result.detail}</span>
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
