"use client";

import * as React from "react";
import type { Marks, PracticeAttempt, QuizAnswers, Stream, WatchlistEntry } from "@/lib/types";

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  year: string;
  grade: string;
}

export interface StudentProfile {
  name: string;
  avatar: string;
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

const defaultProfile: StudentProfile = {
  name: "",
  avatar: "",
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
}

const Ctx = React.createContext<Store | null>(null);

/** Guard against a corrupt or oversized local profile blob. */
const PROFILE_MAX_CHARS = 1_000_000;

function isUsableProfile(raw: unknown): raw is Partial<StudentProfile> {
  return !!raw && typeof raw === "object" && !Array.isArray(raw);
}

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<StudentProfile>(() => {
    if (typeof window === "undefined") return defaultProfile;
    try {
      const raw = window.localStorage.getItem("aftermediate:profile");
      if (!raw || raw.length > PROFILE_MAX_CHARS) return defaultProfile;
      const parsed: unknown = JSON.parse(raw);
      return isUsableProfile(parsed) ? { ...defaultProfile, ...parsed } : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const update = React.useCallback((patch: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== "undefined" && JSON.stringify(next).length <= PROFILE_MAX_CHARS) {
        window.localStorage.setItem("aftermediate:profile", JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const reset = React.useCallback(() => {
    setProfile(defaultProfile);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("aftermediate:profile");
    }
  }, []);

  const [hydrated, setHydrated] = React.useState(false);

  const hydrate = React.useCallback((remote: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...remote };
      if (typeof window !== "undefined" && JSON.stringify(next).length <= PROFILE_MAX_CHARS) {
        window.localStorage.setItem("aftermediate:profile", JSON.stringify(next));
      }
      return next;
    });
    setHydrated(true);
  }, []);

  const value = React.useMemo<Store>(
    () => ({ profile, update, reset, hydrated, hydrate }),
    [profile, update, reset, hydrated, hydrate]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudent(): Store {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
