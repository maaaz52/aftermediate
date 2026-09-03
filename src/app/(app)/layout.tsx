"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { RahbarDrawer } from "@/components/rahbar-drawer";
import { TourProvider } from "@/components/tour/tour-provider";
import { TourHub } from "@/components/tour/tour-hub";
import { TourPrompt } from "@/components/tour/tour-prompt";
import { useAuth } from "@/lib/auth";

const PUBLIC_PATHS = new Set(["/", "/login", "/coming-soon", "/verify-email"]);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Prevent browser back from reaching public pages once inside the dashboard.
  React.useEffect(() => {
    if (!user) return;
    // Replace the current history entry so the first back press doesn't leave.
    history.replaceState(null, "", window.location.href);

    const onPop = () => {
      if (PUBLIC_PATHS.has(window.location.pathname)) {
        history.pushState(null, "", "/dashboard");
        router.replace("/dashboard");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [user, router]);

  if (loading) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-faint">loading your plan…</p>
      </div>
    );
  }

  return (
    <TourProvider>
      <div className="min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-col lg:pl-72">
          <TopNav />
          <main className="flex-1">{children}</main>
        </div>
        <RahbarDrawer />
      </div>
      <TourHub />
      <TourPrompt />
    </TourProvider>
  );
}