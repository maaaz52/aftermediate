import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalog } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";

export function generateStaticParams() {
  return catalog().flatMap((item) => [
    { testId: item.test.id },
    ...item.variants.map((v) => ({ testId: v.testId })),
  ]);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ testId: string }>;
}): Promise<Metadata> {
  const { testId } = await params;
  const name = catalog()
    .flatMap((item) => [item.test, ...item.variants.map((v) => ({ id: v.testId, name: item.test.name }))])
    .find((t) => t.id === testId)?.name;
  return pageMetadata({
    title: name ? `${name} — practice test` : "Self assessment",
    description: name ? `Timed mock exam for ${name} replicating the real entry-test conditions.` : "Self assessment practice tests",
    path: `/pakistan/self-assessment/${testId}`,
  });
}

export default async function SelfAssessmentTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const valid = catalog().some(
    (item) => item.test.id === testId || item.variants.some((v) => v.testId === testId)
  );
  if (!valid) {
    notFound();
  }
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Self Assessment", path: "/pakistan/self-assessment" },
          { name: testId, path: `/pakistan/self-assessment/${testId}` },
        ])}
      />
      <ExamRunner testId={testId} />
    </>
  );
}
