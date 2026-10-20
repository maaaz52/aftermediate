"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopNav } from "@/components/top-nav";
import { RahbarDrawer } from "@/components/rahbar-drawer";
import { TourProvider } from "@/components/tour/tour-provider";
import { TourHub } from "@/components/tour/tour-hub";
import { TourPrompt } from "@/components/tour/tour-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { useStudent } from "@/lib/store";

function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-72 shrink-0 flex-col border-r border-line bg-surface p-4 lg:flex">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="mt-8 h-4 w-24" />
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="mt-2 h-9 w-full" />
        ))}
        <Skeleton className="mt-8 h-4 w-28" />
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="mt-2 h-9 w-full" />
        ))}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex h-16 items-center justify-between border-b border-line px-6">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-xl" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-3 h-9 w-72" />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_2fr]">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <Skeleton className="mt-4 h-24 rounded-2xl" />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <Skeleton className="mt-4 h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { profile, hydrated } = useStudent();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  React.useEffect(() => {
    if (!loading && user && hydrated && !profile.quizCompletedAt) {
      router.replace("/onboard");
    }
  }, [hydrated, loading, profile.quizCompletedAt, router, user]);

  if (loading || !user || !hydrated || !profile.quizCompletedAt) {
    return <AppShellSkeleton />;
  }

  return (
    <TourProvider>
      <div className="min-h-screen overflow-x-hidden">
        <Sidebar />
        <div className="flex min-h-screen flex-col pt-16">
          <TopNav />
          <main className="flex-1 lg:pl-72">{children}</main>
        </div>
        <RahbarDrawer />
      </div>
      <TourHub />
      <TourPrompt />
    </TourProvider>
  );
}
