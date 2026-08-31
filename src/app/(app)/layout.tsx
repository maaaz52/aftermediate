"use client";

import * as React from "react";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { RahbarDrawer } from "@/components/rahbar-drawer";
import { TourProvider } from "@/components/tour/tour-provider";
import { TourHub } from "@/components/tour/tour-hub";
import { TourPrompt } from "@/components/tour/tour-prompt";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

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