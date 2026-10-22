"use client";

import Link from "next/link";
import * as React from "react";
import { LogOut, Menu, Search, X } from "lucide-react";
import { Brand } from "./brand";
import { Button } from "./ui/button";
import { AuthDialog } from "./auth-dialog";
import { useAuth } from "@/lib/auth";
import { MobileMenu } from "./mobile-menu";
import { SiteSearch } from "./site-search";

export function TopNav() {
  const { user, signOut } = useAuth();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const logoHref = user ? "/dashboard" : "/";

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-40 h-16 border-b border-line bg-background/90 backdrop-blur-md"
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
                <div className="hidden md:block">
                  <SiteSearch />
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(true)}
                  className="flex min-h-11 min-w-11 items-center justify-center p-2 text-muted transition-colors hover:text-ink md:hidden"
                  aria-label="Open search"
                >
                  <Search className="h-5 w-5" />
                </button>
                <span className="hidden max-w-[200px] truncate text-sm font-medium text-muted xl:block">
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

        {user && mobileSearchOpen && (
          <div className="absolute inset-0 flex items-center gap-2 bg-background px-4 sm:px-6 md:hidden">
            <SiteSearch autoFocus className="w-full max-w-none" />
            <button
              type="button"
              onClick={() => setMobileSearchOpen(false)}
              className="flex min-h-11 min-w-11 shrink-0 items-center justify-center p-2 text-muted transition-colors hover:text-ink"
              aria-label="Close search"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
