import Link from "next/link";
import { Brand } from "@/components/brand";

const cols = [
  {
    title: "Product",
    links: [
      { label: "Start now", href: "/onboard" },
      { label: "Merit engine", href: "/merit" },
      { label: "Career fields", href: "/career" },
      { label: "Money & abroad", href: "/money" },
      { label: "Parent report", href: "/convince" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Reality check", href: "/#reality" },
      { label: "World trends", href: "/trends" },
      { label: "Scholarships", href: "/money" },
      { label: "Short courses", href: "/career" },
    ],
  },
  {
    title: "Data sources",
    links: [
      { label: "PMDC", href: "https://pmdc.pk/" },
      { label: "HEC", href: "https://www.hec.gov.pk/" },
      { label: "PBS", href: "https://www.pbs.gov.pk/" },
      { label: "P@SHA", href: "https://pasha.org.pk/" },
      { label: "SBP", href: "https://www.sbp.org.pk/" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-surface-2">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
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
          <span className="font-mono">PMDC · HEC · PBS · P@SHA · SBP</span>
        </div>
      </div>
    </footer>
  );
}
