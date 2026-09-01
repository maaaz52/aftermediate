import { notFound } from "next/navigation";
import { catalog } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";

export function generateStaticParams() {
  return catalog().flatMap((item) => [
    { testId: item.test.id },
    ...item.variants.map((v) => ({ testId: v.testId })),
  ]);
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
