"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const avatarCircles = [
  { gradient: "linear-gradient(135deg, #2f55d4, #4a6cf0)", initials: "AR" },
  { gradient: "linear-gradient(135deg, #1c9e62, #10b981)", initials: "FK" },
  { gradient: "linear-gradient(135deg, #7a5bd4, #8b5cf6)", initials: "HS" },
];

export function HeroSection() {
  const router = useRouter();

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
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="default"
          onClick={() =>
            document.getElementById("mentor-grid")?.scrollIntoView({ behavior: "smooth" })
          }
        >
          Browse mentors
        </Button>
        <Button variant="outline" onClick={() => router.push("/mentors/become")}>
          Become a mentor
        </Button>
      </div>
      <div className="mt-6 flex items-center gap-2">
        {avatarCircles.map((circle, i) => (
          <div
            key={circle.initials}
            className="flex h-11 w-11 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-md"
            style={{ background: circle.gradient, transform: `translateX(-${i * 6}px)` }}
          >
            {circle.initials}
          </div>
        ))}
        <span className="text-xs text-muted" style={{ marginLeft: -(avatarCircles.length - 1) * 6 }}>
          Join 12+ active mentors
        </span>
      </div>
    </div>
  );
}