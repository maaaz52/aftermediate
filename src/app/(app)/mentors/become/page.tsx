import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = pageMetadata({
  title: "Become a mentor",
  description: "Join the aftermediate mentor program and help Pakistani students find their path after FSc.",
  path: "/mentors/become",
});

export default function BecomeMentorPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Badge variant="violet">Mentors</Badge>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Become a mentor
      </h1>
      <p className="mt-2 max-w-xl text-muted">
        We&apos;re putting together the mentor program. If you&apos;re a student or recent
        graduate who wants to help others find their path, drop us a message — we&apos;d
        love to have you.
      </p>
      <p className="mt-8 text-center text-xs text-faint">This page is under construction.</p>
    </div>
  );
}
