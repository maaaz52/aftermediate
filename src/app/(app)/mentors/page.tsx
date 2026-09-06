import type { Metadata } from "next";
import { MentorMatchPage } from "@/components/mentor-match/mentor-match-page";

export const metadata: Metadata = {
  title: "Mentor Match",
};

export default function MentorsPage() {
  return (
    <div data-tour="mentor-match" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MentorMatchPage />
    </div>
  );
}
