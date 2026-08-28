"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  Award,
  BarChart3,
  BookOpen,
  BookOpenCheck,
  Bot,
  Calculator,
  ClipboardList,
  Compass,
  Eye,
  FileText,
  Globe,
  GraduationCap,
  Landmark,
  Medal,
  PenLine,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Video,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export type NavGroup = { label: string | null; links: NavLink[] };

export const groups: NavGroup[] = [
  {
    label: null,
    links: [
      { href: "/dashboard", label: "Dashboard", icon: Compass },
      { href: "/profile", label: "Profile", icon: User },
    ],
  },
  {
    label: "Education in Pakistan",
    links: [
      { href: "/pakistan/universities", label: "Universities", icon: GraduationCap },
      { href: "/pakistan/entry-tests", label: "Entry Tests", icon: ClipboardList },
      { href: "/pakistan/self-assessment", label: "Self Assessment", icon: PenLine },
      { href: "/pakistan/scholarships", label: "Scholarships", icon: Award },
      { href: "/pakistan/salary-insights", label: "Salary & Scope", icon: BarChart3 },
      { href: "/merit", label: "Merit", icon: Target },
      { href: "/career", label: "Career", icon: Rocket },
      { href: "/trends", label: "Trends", icon: TrendingUp },
    ],
  },
  {
    label: "Education Abroad",
    links: [
      { href: "/abroad/countries", label: "Countries", icon: Globe },
      { href: "/abroad/scholarships", label: "Scholarships", icon: Medal },
      { href: "/abroad/test-prep", label: "Test Prep", icon: BookOpenCheck },
      { href: "/abroad/self-assessment", label: "Self Assessment", icon: PenLine },
      { href: "/abroad/ivy-league", label: "Ivy League", icon: Landmark },
      { href: "/abroad/planner", label: "Planner", icon: Calculator },
      { href: "/money", label: "Money", icon: Wallet },
      { href: "/convince", label: "Convince", icon: FileText },
    ],
  },
  {
    label: "Resources",
    links: [
      { href: "/#reality", label: "Reality Check", icon: Eye },
      { href: "/webinars", label: "Webinars", icon: Video },
      { href: "/trends", label: "World Trends", icon: TrendingUp },
    ],
  },
  {
    label: "A.I Assistants",
    links: [
      { href: "/abroad/assistant", label: "Safar A.I", icon: Bot },
      { href: "/study", label: "Ustaad A.I", icon: BookOpen },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface max-lg:hidden">
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label ?? "core"} className={group.label ? "mt-6" : ""}>
            {group.label && (
              <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-faint">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.links.map((l) => {
                const active = pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
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
        ))}

        <button
          type="button"
          onClick={() => document.dispatchEvent(new CustomEvent("open-rahbar"))}
          className="mt-1 flex w-full items-center gap-3 rounded-lg border border-saffron/30 bg-saffron/5 px-3 py-2.5 text-sm font-medium text-saffron transition-colors hover:bg-saffron/10"
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          Talk to Rahbar A.I
        </button>
      </nav>
    </aside>
  );
}
