"use client";

import * as React from "react";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { AuthDialog } from "./auth-dialog";
import { useAuth } from "@/lib/auth";
import { useStudent } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { nustAggregate, fastAggregate, mdcatAggregate, pct } from "@/lib/aggregates";

export function SavePlanButton() {
  const { user } = useAuth();
  const { profile } = useStudent();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [state, setState] = React.useState<"idle" | "saving" | "saved">("idle");

  async function save() {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setState("saving");
    const stream = profile.stream ?? "pre-engineering";
    const results =
      stream === "pre-medical"
        ? [mdcatAggregate(profile.marks)]
        : [nustAggregate(profile.marks), fastAggregate(profile.marks)];

    const supabase = createClient();
    const { error } = await supabase.from("saved_plans").insert({
      user_id: user.id,
      type: "roadmap",
      payload: {
        stream,
        fscPct: pct(profile.marks.fscObtained, profile.marks.fscTotal),
        aggregates: results.map((r) => ({ name: r.name, value: r.value })),
        interests: profile.interests,
        savedAt: new Date().toISOString(),
      },
    });

    if (error) {
      setState("idle");
      console.warn("save failed", error.message);
    } else {
      setState("saved");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <>
      <Button
        onClick={save}
        variant={state === "saved" ? "emerald" : "outline"}
        disabled={state === "saving"}
        className="gap-2"
      >
        {state === "saving" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "saved" ? (
          <Check className="h-4 w-4" />
        ) : (
          <BookmarkPlus className="h-4 w-4" />
        )}
        {state === "saved" ? "Saved" : "Save my roadmap"}
      </Button>
      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
