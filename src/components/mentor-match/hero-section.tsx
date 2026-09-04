"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function HeroSection({ onBecomeMentor }: { onBecomeMentor: () => void }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Badge variant="saffron">Mentors</Badge>
        <span className="font-mono text-xs text-faint">real students · real advice</span>
      </div>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Find your mentor
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        Real students. Honest advice. One conversation can change your direction.
      </p>
      <div className="mt-6">
        <Button variant="default" onClick={onBecomeMentor}>
          Become a mentor
        </Button>
      </div>
    </div>
  );
}
