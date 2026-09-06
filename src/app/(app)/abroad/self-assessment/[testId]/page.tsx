import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { abroadTests } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return abroadTests.map((test) => ({ testId: test.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ testId: string }>;
}): Promise<Metadata> {
  const { testId } = await params;
  const name = abroadTests.find((t) => t.id === testId)?.name;
  return pageMetadata({
    title: name ? `${name} — practice test` : "Self assessment",
    description: name ? `Timed mock exam for ${name} replicating the real test conditions.` : "Self assessment practice tests",
    path: `/abroad/self-assessment/${testId}`,
  });
}

export default async function AbroadSelfAssessmentTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = abroadTests.find((t) => t.id === testId);
  if (!test) {
    notFound();
  }
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Self Assessment", path: "/abroad/self-assessment" },
          { name: test.name, path: `/abroad/self-assessment/${test.id}` },
        ])}
      />
      <ExamRunner testId={testId} test={test} />
    </>
  );
}
