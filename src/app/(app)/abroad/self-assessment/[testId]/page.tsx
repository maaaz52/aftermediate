import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { abroadTests } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";

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
  return { title: name ? `${name} — practice test` : "Self assessment" };
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
  return <ExamRunner testId={testId} test={test} />;
}
