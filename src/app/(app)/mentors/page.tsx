import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { MentorMatchPage } from "@/components/mentor-match/mentor-match-page";

export const metadata: Metadata = pageMetadata({
  title: "Mentor Match",
  description: "Find verified mentors who've walked the Pakistani FSc-to-career path — filter by field, budget and style, and book a session.",
  path: "/mentors",
});

export default function MentorsPage() {
  return (
    <div data-tour="mentor-match" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MentorMatchPage />
    </div>
  );
}
