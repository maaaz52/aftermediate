"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { ChevronDown, Compass, LogOut, X } from "lucide-react";
import { groups } from "@/components/sidebar";
import { useAuth } from "@/lib/auth";
import { useTour } from "@/components/tour/tour-provider";
import { chapters } from "@/lib/tour";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { user, signOut } = useAuth();
  const tour = useTour();
  const pathname = usePathname();

  // Close on route change
  const prevPath = React.useRef(pathname);
  React.useEffect(() => {
    if (prevPath.current !== pathname) {
      onClose();
      prevPath.current = pathname;
    }
  }, [pathname, onClose]);

  // Lock body scroll when open
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  if (!open) return null;

  const allHrefs = groups.flatMap((g) => g.links.map((l) => l.href));
  const norm = (s: string) => s.replace(/\/+$/, "") || "/";
  const matches = (href: string) => {
    const p = norm(pathname);
    const h = norm(href);
    return p === h || p.startsWith(h + "/");
  };
  const isActive = (href: string) => {
    if (!matches(href)) return false;
    return !allHrefs.some(
      (other) => other !== href && norm(other).length > norm(href).length && matches(other)
    );
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="absolute inset-y-0 left-0 flex w-full flex-col bg-surface">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Link href={user ? "/dashboard" : "/"} onClick={onClose} className="text-lg font-bold text-ink">
            aftermediate
          </Link>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-muted hover:text-ink min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-5 pb-6 pt-4">
          {groups.map((group) => {
            const key = group.label ?? "core";
            const isOpen = group.label ? expanded[group.label] !== false : true;

            return (
              <div key={key} className={group.label ? "mt-5" : ""}>
                {group.label ? (
                  <button
                    type="button"
                    onClick={() => toggle(group.label!)}
                    className="flex w-full items-center justify-between pb-2 font-mono text-[10px] uppercase tracking-widest text-faint"
                  >
                    {group.label}
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 shrink-0 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                ) : null}

                <div
                  className={cn(
                    "grid transition-[grid-template-rows] duration-200 ease-in-out",
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-0.5 pb-1">
                      {group.links.map((l) => {
                        const active = isActive(l.href);
                        return (
                          <Link
                            key={l.href}
                            href={l.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors min-h-11",
                              active
                                ? "bg-saffron/10 text-saffron"
                                : "text-muted hover:text-ink hover:bg-surface-2"
                            )}
                          >
                            <l.icon className="h-4 w-4 shrink-0" />
                            {l.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Guided tour */}
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-faint">
              Guided tour
            </p>
            <div className="space-y-1">
              {chapters.map((ch) => {
                const progress = tour.state.chapters[ch.id];
                const completed = progress?.completed ?? false;
                const lastStep = progress?.lastStep ?? 0;
                const fromStep = completed ? 0 : lastStep;
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => {
                      tour.startChapter(ch.id, fromStep);
                      onClose();
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-3 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink min-h-11"
                  >
                    <span className="flex items-center gap-3">
                      <Compass className="h-4 w-4 shrink-0" />
                      {ch.name}
                    </span>
                    {completed ? (
                      <span className="font-mono text-xs text-emerald">Done</span>
                    ) : lastStep > 0 ? (
                      <span className="font-mono text-xs text-saffron">
                        {lastStep}/{ch.steps.length}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-saffron">Start</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer: logout */}
        {user && (
          <div className="border-t border-line px-5 py-4">
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger min-h-11"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
