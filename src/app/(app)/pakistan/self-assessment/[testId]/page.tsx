import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { catalog } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";

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
  return { title: name ? `${name} — practice test` : "Self assessment" };
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
  return <ExamRunner testId={testId} />;
}
