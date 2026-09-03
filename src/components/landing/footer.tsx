import Link from "next/link";
import { Brand } from "@/components/brand";

const cols = [
  {
    title: "Resources",
    links: [
      { label: "Reality check", href: "/reality-check" },
      { label: "Webinars", href: "/login?mode=signup" },
      { label: "World trends", href: "/login?mode=signup" },
      { label: "Scholarships", href: "/login?mode=signup" },
      { label: "Short courses", href: "/login?mode=signup" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Data Deletion", href: "/data-deletion" },
      { label: "Disclaimer", href: "/disclaimer" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Community Policy", href: "/community-policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-3 sm:px-6">
        <div className="space-y-4">
          <Brand />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            An AI-driven, hyper-localized career compass for Pakistani FSc, ICS, I.Com and A-Level
            students — and the parents deciding with them.
          </p>
          <p className="font-mono text-xs text-faint">Made for students, backed by data.</p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="font-sans text-sm font-bold text-ink">{c.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="text-sm text-muted transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} aftermediate. Every number on this site is sourced.</span>
        </div>
      </div>
    </footer>
  );
}
