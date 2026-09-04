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
  const liveProfile = React.useRef(profile);
  React.useEffect(() => {
    // Updated on every render (no deps array), not just inside other effects,
    // so the hydrate effect below can detect edits that happened while its
    // fetch was in flight.
    liveProfile.current = profile;
  });

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
      .select("name, avatar_style, avatar_seed, bio, stream, marks, interests, skills, education, city, budget, quiz, quiz_completed_at, practice, updated_at")
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
              name: data.name || user.user_metadata?.full_name || "",
              avatarStyle: data.avatar_style ?? "adventurer",
              avatarSeed: data.avatar_seed ?? "",
              bio: data.bio ?? "",
              stream: data.stream ?? null,
              marks: data.marks ?? undefined,
              interests: data.interests ?? [],
              skills: data.skills ?? [],
              education: data.education ?? [],
              city: data.city ?? "",
              budget: data.budget ?? "",
              quiz: data.quiz ?? {},
              quizCompletedAt: data.quiz_completed_at ?? null,
              practice: data.practice ?? [],
            }
          : null;

        const localStamp =
          typeof window !== "undefined" ? window.localStorage.getItem(LOCAL_STAMP) : null;

        const startProfile = profile; // the closure value, captured when the effect scheduled

        if (liveProfile.current !== startProfile) {
          // The user edited locally while this fetch was in flight — trust the
          // newer local state instead of overwriting it with a stale remote read.
          // The debounced push effect will carry the fresher local state up next.
          hydrate({});
          return;
        }

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
      const now = new Date().toISOString();
      const supabase = createClient();

      supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: profile.name || user.user_metadata?.full_name || null,
          avatar_style: profile.avatarStyle,
          avatar_seed: profile.avatarSeed,
          bio: profile.bio || null,
          stream: profile.stream,
          marks: profile.marks,
          interests: profile.interests,
          skills: profile.skills,
          education: profile.education,
          // quiz is the source of truth; these two columns are a mirror
          // so existing consumers keep working.
          city: profile.quiz.city ?? profile.city ?? null,
          budget:
            profile.quiz.budgetMonthly != null
              ? String(profile.quiz.budgetMonthly)
              : profile.budget || null,
          quiz: profile.quiz,
          quiz_completed_at: profile.quizCompletedAt,
          practice: profile.practice,
          updated_at: now,
        })
        .then(({ error }) => {
          if (error) {
            console.warn("profile sync failed", error.message);
          } else {
            pushed.current = payload;
            if (typeof window !== "undefined") {
              window.localStorage.setItem(LOCAL_STAMP, now);
            }
          }
        });
    }, 800);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [user, profile, hydrated]);

  return null;
}
