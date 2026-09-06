import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { PracticeCatalog } from "@/components/practice/practice-catalog";
import { abroadTests } from "@/lib/practice";

export const metadata: Metadata = pageMetadata({
  title: "Self Assessment — international tests",
  description: "Timed mock exams for international standardized tests — practice IELTS, SAT and more under real exam conditions.",
  path: "/abroad/self-assessment",
});

export default function AbroadSelfAssessmentPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Abroad</Badge>
        <span className="font-mono text-xs text-faint">international tests</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Self Assessment
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        Timed mock exams for international standardized tests &mdash; practice
        with IELTS, SAT, and more under real exam conditions.
      </p>
      <div
        className="animate-reveal mt-8"
        style={{ animationDelay: "180ms" }}
      >
        <PracticeCatalog tests={abroadTests} basePath="/abroad/self-assessment" />
      </div>
    </div>
  );
}
