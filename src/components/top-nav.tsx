"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { LogOut } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { AuthDialog } from "./auth-dialog";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { groups } from "@/components/sidebar";

export function TopNav() {
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-line bg-background/90 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-4 px-6">
          <Link href="/">
            <Brand />
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="max-w-[200px] truncate text-sm text-muted">
                  {user.user_metadata?.full_name || user.email}
                </span>
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
      </header>

      {/* Mobile nav: horizontally scrollable links visible below lg */}
      <nav className="lg:hidden border-b border-line overflow-x-auto">
        <div className="flex gap-1 px-3 py-2">
          {groups.flatMap((g) => g.links).map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-saffron/10 text-saffron"
                    : "text-muted hover:text-ink"
                )}
              >
                <link.icon className="h-3 w-3" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}