"use client";

import * as React from "react";
import type { Marks, Stream } from "@/lib/types";

export interface StudentProfile {
  name: string;
  stream: Stream | null;
  marks: Marks;
  interests: string[];
  city: string;
  budget: string;
}

const defaultProfile: StudentProfile = {
  name: "",
  stream: null,
  marks: {
    matricObtained: 0,
    matricTotal: 1100,
    fscObtained: 0,
    fscTotal: 1100,
  },
  interests: [],
  city: "",
  budget: "",
};

interface Store {
  profile: StudentProfile;
  update: (patch: Partial<StudentProfile>) => void;
  reset: () => void;
  onboarded: boolean;
}

const Ctx = React.createContext<Store | null>(null);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<StudentProfile>(() => {
    if (typeof window === "undefined") return defaultProfile;
    try {
      const raw = window.localStorage.getItem("aftermediate:profile");
      return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
    } catch {
      return defaultProfile;
    }
  });

  const update = React.useCallback((patch: Partial<StudentProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (typeof window !== "undefined") {
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

  const value = React.useMemo<Store>(
    () => ({
      profile,
      update,
      reset,
      onboarded: !!profile.stream && profile.marks.fscTotal > 0,
    }),
    [profile, update, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudent(): Store {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useStudent must be used within StudentProvider");
  return ctx;
}
