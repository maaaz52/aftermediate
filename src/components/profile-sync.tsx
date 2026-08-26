"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth";
import { useStudent } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";

export function ProfileSync() {
  const { user } = useAuth();
  const { profile } = useStudent();
  const synced = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const key = `${user.id}:${JSON.stringify(profile)}`;
    if (synced.current === key) return;
    synced.current = key;

    const supabase = createClient();
    supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: profile.name || user.user_metadata?.full_name || null,
        stream: profile.stream,
        marks: profile.marks,
        interests: profile.interests,
        city: profile.city || null,
        budget: profile.budget || null,
        updated_at: new Date().toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("profile sync failed", error.message);
      });
  }, [user, profile]);

  return null;
}
