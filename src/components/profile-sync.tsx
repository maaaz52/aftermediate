"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth";
import { normalizeProfile, useStudent, type StudentProfile } from "@/lib/store";
import { chooseProfile } from "@/lib/merge-profile";
import { createClient } from "@/lib/supabase/client";

const LOCAL_STAMP = "aftermediate:profile:updatedAt";
const PROFILE_MAX_CHARS = 1_000_000;

function scopedProfileKey(userId: string) {
  return `aftermediate:profile:${userId}`;
}

function scopedStampKey(userId: string) {
  return `aftermediate:profile:updatedAt:${userId}`;
}

function readLocalProfile(userId: string): Partial<StudentProfile> | null {
  try {
    const raw = window.localStorage.getItem(scopedProfileKey(userId));
    if (!raw || raw.length > PROFILE_MAX_CHARS) return null;
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Partial<StudentProfile>)
      : null;
  } catch {
    return null;
  }
}

function hasMeaningfulProfile(profile: StudentProfile): boolean {
  return Boolean(
    profile.name ||
      profile.bio ||
      profile.stream ||
      profile.interests.length ||
      profile.skills.length ||
      profile.education.length ||
      profile.quizCompletedAt ||
      profile.practice.length ||
      profile.watchlist.length ||
      profile.marks.matricObtained ||
      profile.marks.fscObtained
  );
}

export function ProfileSync() {
  const { user } = useAuth();
  const { profile, hydrate, hydrated, beginHydration } = useStudent();
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
      pushed.current = null;
      hydrate(profile);
      return;
    }

    beginHydration();
    pushed.current = null;
    if (timer.current) clearTimeout(timer.current);

    let cancelled = false;
    const supabase = createClient();
    const userLocal = readLocalProfile(user.id);
    const startProfile = profile;
    const localCandidate = userLocal ?? (hasMeaningfulProfile(startProfile) ? startProfile : {});
    const localStamp = window.localStorage.getItem(
      userLocal ? scopedStampKey(user.id) : LOCAL_STAMP
    );

    supabase
      .from("profiles")
      .select("name, avatar_style, avatar_seed, bio, stream, marks, interests, skills, education, city, budget, quiz, quiz_completed_at, practice, watchlist, updated_at")
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
              watchlist: data.watchlist ?? [],
            }
          : null;

        if (liveProfile.current !== startProfile) {
          hydrate(liveProfile.current);
          return;
        }

        const choice = chooseProfile(localCandidate, localStamp, remote, data?.updated_at ?? null);
        const selected = normalizeProfile(choice.profile);
        if (choice.use === "remote") pushed.current = JSON.stringify(selected);
        hydrate(selected);
      });

    return () => {
      cancelled = true;
    };
    // Intentionally keyed on the user only — this must run once per sign-in,
    // not on every profile edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
          watchlist: profile.watchlist,
          updated_at: now,
        })
        .then(({ error }) => {
          if (error) {
            console.warn("profile sync failed", error.message);
          } else {
            pushed.current = payload;
            if (typeof window !== "undefined") {
              window.localStorage.setItem(LOCAL_STAMP, now);
              window.localStorage.setItem(scopedProfileKey(user.id), payload);
              window.localStorage.setItem(scopedStampKey(user.id), now);
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
