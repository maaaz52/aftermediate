import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { TestPrepExplorer } from "@/components/abroad/test-prep-explorer";

export const metadata: Metadata = {
  title: "Entry Tests — study abroad",
};

export default async function AbroadTestPrepPage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string }>;
}) {
  const params = await searchParams;
  const initialCountry = typeof params.country === "string" ? params.country : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Education Abroad</Badge>
        <span className="font-mono text-xs text-faint">tests &amp; preparation</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Every test between you and a foreign degree.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        IELTS to TOPIK: patterns, fees in PKR, scoring, and how to prepare — from official
        test bodies, not coaching academies.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <TestPrepExplorer initialCountry={initialCountry} />
      </div>
    </div>
  );
}
