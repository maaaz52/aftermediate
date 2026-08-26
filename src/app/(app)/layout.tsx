"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { Chatbot } from "@/components/chatbot";
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

  // Never gate before hydration — a completed user would be bounced
  // into the quiz during the async load.
  if (loading || !hydrated || (user && !complete)) {
    return (
      <div className="grid-bg grid min-h-screen place-items-center">
        <p className="font-mono text-sm text-faint">loading your plan…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Chatbot />
    </div>
  );
}
