"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth";
import { useStudent, type StudentProfile } from "@/lib/store";
import { chooseProfile } from "@/lib/merge-profile";
import { createClient } from "@/lib/supabase/client";

const LOCAL_STAMP = "aftermediate:profile:updatedAt";

export function ProfileSync() {
  const { user } = useAuth();
  const { profile, hydrate, hydrated } = useStudent();
  const pushed = React.useRef<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Hydrate once per user.
  React.useEffect(() => {
    if (!user) {
      // Anonymous visitors (e.g. from the public /onboard CTA) never get a
      // signed-in fetch, so flip `hydrated` immediately with a no-op merge —
      // otherwise pages gating render on `hydrated` spin forever.
      hydrate({});
      return;
    }
    let cancelled = false;
    const supabase = createClient();

    supabase
      .from("profiles")
      .select("name, stream, marks, interests, city, budget, quiz, quiz_completed_at, updated_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("profile load failed", error.message);
          hydrate({});
          return;
        }

        const remote: Partial<StudentProfile> | null = data
          ? {
              name: data.name ?? "",
              stream: data.stream ?? null,
              marks: data.marks ?? undefined,
              interests: data.interests ?? [],
              city: data.city ?? "",
              budget: data.budget ?? "",
              quiz: data.quiz ?? {},
              quizCompletedAt: data.quiz_completed_at ?? null,
            }
          : null;

        const localStamp =
          typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_STAMP) : null;

        const choice = chooseProfile(profile, localStamp, remote, data?.updated_at ?? null);
        hydrate(choice.use === "remote" ? choice.profile : {});
      });

    return () => {
      cancelled = true;
    };
    // Intentionally keyed on the user only — this must run once per sign-in,
    // not on every profile edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // 2. Debounced push.
  React.useEffect(() => {
    if (!user || !hydrated) return;

    const payload = JSON.stringify(profile);
    if (pushed.current === payload) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      pushed.current = payload;
      const now = new Date().toISOString();
      const supabase = createClient();

      supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: profile.name || user.user_metadata?.full_name || null,
          stream: profile.stream,
          marks: profile.marks,
          interests: profile.interests,
          // quiz is the source of truth; these two columns are a mirror
          // so existing consumers keep working.
          city: profile.quiz.city ?? profile.city ?? null,
          budget:
            profile.quiz.budgetMonthly != null
              ? String(profile.quiz.budgetMonthly)
              : profile.budget || null,
          quiz: profile.quiz,
          quiz_completed_at: profile.quizCompletedAt,
          updated_at: now,
        })
        .then(({ error }) => {
          if (error) console.warn("profile sync failed", error.message);
          else if (typeof window !== "undefined") {
            window.localStorage.setItem(LOCAL_STAMP, now);
          }
        });
    }, 800);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user, profile, hydrated]);

  return null;
}
