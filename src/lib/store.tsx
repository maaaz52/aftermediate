"use client";

import * as React from "react";
import type { Marks, PracticeAttempt, QuizAnswers, Stream, WatchlistEntry } from "@/lib/types";
import type { AvatarStyleId } from "@/lib/avatar";

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  year: string;
  grade: string;
}

export interface StudentProfile {
  name: string;
  avatarStyle: AvatarStyleId;
  avatarSeed: string;
  bio: string;
  stream: Stream | null;
  marks: Marks;
  interests: string[];
  skills: string[];
  education: EducationEntry[];
  city: string;
  budget: string;
  quiz: QuizAnswers;
  quizStep: number;
  quizCompletedAt: string | null;
  practice: PracticeAttempt[];
  watchlist: WatchlistEntry[];
}

export const DEFAULT_PROFILE: StudentProfile = {
  name: "",
  avatarStyle: "adventurer",
  avatarSeed: "",
  bio: "",
  stream: null,
  marks: {
    matricObtained: 0,
    matricTotal: 1100,
    fscObtained: 0,
    fscTotal: 1100,
  },
  interests: [],
  skills: [],
  education: [],
  city: "",
  budget: "",
  quiz: {},
  quizStep: 0,
  quizCompletedAt: null,
  practice: [],
  watchlist: [],
};

interface Store {
  profile: StudentProfile;
  update: (patch: Partial<StudentProfile>) => void;
  reset: () => void;
  hydrated: boolean;
  hydrate: (remote: Partial<StudentProfile>) => void;
  beginHydration: () => void;
}

const Ctx = React.createContext<Store | null>(null);

/** Guard against a corrupt or oversized local profile blob. */
const PROFILE_MAX_CHARS = 1_000_000;

function isUsableProfile(raw: unknown): raw is Partial<StudentProfile> {
  return !!raw && typeof raw === "object" && !Array.isArray(raw);
}

export function normalizeProfile(profile: Partial<StudentProfile>): StudentProfile {
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    marks: { ...DEFAULT_PROFILE.marks, ...(profile.marks ?? {}) },
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    education: Array.isArray(profile.education) ? profile.education : [],
    quiz: profile.quiz && typeof profile.quiz === "object" ? profile.quiz : {},
    practice: Array.isArray(profile.practice) ? profile.practice : [],
    watchlist: Array.isArray(profile.watchlist) ? profile.watchlist : [],
  };
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<StudentProfile>(() => {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    try {
      const raw = window.localStorage.getItem("aftermediate:profile");
      if (!raw || raw.length > PROFILE_MAX_CHARS) return DEFAULT_PROFILE;
      const parsed: unknown = JSON.parse(raw);
      return isUsableProfile(parsed) ? normalizeProfile(parsed) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const update = React.useCallback((patch: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== "undefined" && JSON.stringify(next).length <= PROFILE_MAX_CHARS) {
        window.localStorage.setItem("aftermediate:profile", JSON.stringify(next));
        window.localStorage.setItem("aftermediate:profile:updatedAt", new Date().toISOString());
      }
      return next;
    });
  }, []);

  const reset = React.useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("aftermediate:profile");
      window.localStorage.removeItem("aftermediate:profile:updatedAt");
    }
  }, []);

  const [hydrated, setHydrated] = React.useState(false);

  const beginHydration = React.useCallback(() => {
    setHydrated(false);
  }, []);

  const hydrate = React.useCallback((remote: Partial<StudentProfile>) => {
    setProfile(() => {
      const next = normalizeProfile(remote);
      if (typeof window !== "undefined" && JSON.stringify(next).length <= PROFILE_MAX_CHARS) {
        window.localStorage.setItem("aftermediate:profile", JSON.stringify(next));
      }
      return next;
    });
    setHydrated(true);
  }, []);

  const value = React.useMemo<Store>(
    () => ({ profile, update, reset, hydrated, hydrate, beginHydration }),
    [profile, update, reset, hydrated, hydrate, beginHydration]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudent(): Store {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
