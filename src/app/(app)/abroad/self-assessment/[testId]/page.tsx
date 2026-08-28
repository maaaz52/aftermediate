import { notFound } from "next/navigation";
import { abroadTests } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";

export function generateStaticParams() {
  return abroadTests.map((test) => ({ testId: test.id }));
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
