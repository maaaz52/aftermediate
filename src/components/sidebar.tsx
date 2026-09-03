"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  Award,
  BarChart3,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Bot,
  Calculator,
  ChevronDown,
  ClipboardList,
  Compass,
  Eye,
  Feather,
  FileText,
  Globe,
  GraduationCap,
  Handshake,
  Landmark,
  Medal,
  MessageSquareHeart,
  MessageSquareText,
  MonitorPlay,
  Navigation,
  PenLine,
  Rocket,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  User,
  Users,
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
      { href: "/pakistan/assistant", label: "Manzil A.I", icon: Navigation },
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
      { href: "/money", label: "Money", icon: Wallet },
      { href: "/convince", label: "Convince", icon: FileText },
      { href: "/abroad/assistant", label: "Safar A.I", icon: Bot },
    ],
  },
  {
    label: "Skills & Side Hustles",
    links: [
      { href: "/skills/courses", label: "Courses", icon: MonitorPlay },
      { href: "/skills/books", label: "Books", icon: BookMarked },
      { href: "/skills/clients", label: "Clients", icon: Handshake },
      { href: "/skills/platforms", label: "Platforms", icon: Store },
      { href: "/skills/chat", label: "Hunar A.I", icon: MessageSquareText },
    ],
  },
  {
    label: "Utilities",
    links: [
      { href: "/college-essays", label: "College Essays", icon: Feather },
      { href: "/builder", label: "CV Builder", icon: FileText },
    ],
  },
  {
    label: "Resources",
    links: [
      { href: "/reality-check", label: "Reality Check", icon: Eye },
      { href: "/webinars", label: "Webinars", icon: Video },
      { href: "/study", label: "Ustaad A.I", icon: BookOpen },
    ],
  },
  {
    label: "Community",
    links: [
      { href: "/mentors", label: "Mentor Match", icon: Users },
      { href: "/feedback", label: "Your Voice", icon: MessageSquareHeart },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const g of groups) {
      if (g.label && g.links.some((l) => pathname.startsWith(l.href))) {
        initial[g.label] = true;
      }
    }
    return initial;
  });

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-surface max-lg:hidden">
      <nav className="flex-1 overflow-y-auto px-3 py-4" data-tour="sidebar-nav">
        {groups.map((group) => {
          const key = group.label ?? "core";
          const isOpen = group.label ? expanded[group.label] !== false : true;

          return (
            <div key={key} className={group.label ? "mt-6" : ""}>
              {group.label ? (
                <button
                  type="button"
                  onClick={() => toggle(group.label!)}
                  className="flex w-full items-center justify-between px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-faint transition-colors hover:text-muted"
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
                  <div className="space-y-1 pb-1">
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
              </div>
            </div>
          );
        })}

        <button
          type="button"
          data-tour="rahbar-button"
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
