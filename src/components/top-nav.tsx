"use client";

import Link from "next/link";
import * as React from "react";
import { LogOut, Menu } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { AuthDialog } from "./auth-dialog";
import { useAuth } from "@/lib/auth";
import { MobileMenu } from "./mobile-menu";

export function TopNav() {
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const logoHref = user ? "/dashboard" : "/";

  return (
    <>
      <header
        className="sticky top-0 z-40 h-16 shrink-0 border-b border-line bg-background/90 backdrop-blur-md"
        data-tour="top-nav"
      >
        <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href={logoHref}
            className="flex h-10 items-center rounded-xl px-2 transition-colors hover:bg-surface-2/70"
            aria-label="aftermediate home"
          >
            <Brand />
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden max-w-[200px] truncate text-sm font-medium text-muted sm:block">
                  {user.user_metadata?.full_name || user.email}
                </span>
                {/* Desktop: show logout */}
                <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:inline-flex">
                  <LogOut className="h-4 w-4" />
                </Button>
                {/* Mobile: show hamburger */}
                <button
                  onClick={() => setMenuOpen(true)}
                  className="p-2 -mr-2 text-muted hover:text-ink sm:hidden min-h-11 min-w-11 flex items-center justify-center"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
