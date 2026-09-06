import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { Feather } from "lucide-react";
import { CollegeEssaysApp } from "@/components/college-essays/college-essays-app";

export const metadata: Metadata = pageMetadata({
  title: "College essays",
  description: "Write, rate and refine your college and scholarship essays — with an AI coach that quotes your exact lines.",
  path: "/college-essays",
});

export default function CollegeEssaysPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet/10 text-violet">
          <Feather className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            College Essays <span className="text-violet">· Write yours</span>
          </h1>
          <p className="text-sm text-muted">
            Learn what admissions officers look for, write with a step-by-step guide, get your draft rated by
            Qalam A.I, and build a personalized approach.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <CollegeEssaysApp />
      </div>
    </div>
  );
}
