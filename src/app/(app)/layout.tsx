"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { RahbarDrawer } from "@/components/rahbar-drawer";
import { useAuth } from "@/lib/auth";
import { useStudent } from "@/lib/store";
import { isQuizComplete } from "@/lib/quiz";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { profile, hydrated } = useStudent();

  const complete = isQuizComplete(profile);

  React.useEffect(() => {
    if (loading || !hydrated) return;
    if (user && !complete) router.replace("/onboard");
  }, [loading, hydrated, user, complete, router]);

  if (loading || !hydrated || (user && !complete)) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-faint">loading your plan…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-72">
        <TopNav />
        <main className="flex-1">{children}</main>
      </div>
      <RahbarDrawer />
    </div>
  );
}