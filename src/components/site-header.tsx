"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Compass, Target, Rocket, Wallet, FileText, TrendingUp, LogOut } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { AuthDialog } from "./auth-dialog";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Command", icon: Compass },
  { href: "/merit", label: "Merit", icon: Target },
  { href: "/career", label: "Career", icon: Rocket },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/money", label: "Money", icon: Wallet },
  { href: "/convince", label: "Convince", icon: FileText },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/">
          <Brand />
        </Link>
        <nav className="flex items-center gap-1 overflow-x-auto">
          {links.map((l) => {
            const active = pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                  active ? "bg-saffron/10 text-saffron" : "text-muted hover:text-ink hover:bg-surface-2"
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          {user ? (
            <>
              <span className="max-w-[160px] truncate text-sm text-muted">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>
              Sign in
            </Button>
          )}
        </div>
      </div>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
