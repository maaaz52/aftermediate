import { notFound } from "next/navigation";
import { catalog } from "@/lib/practice";
import { ExamRunner } from "@/components/practice/exam-runner";

export function generateStaticParams() {
  return catalog().map((item) => ({ testId: item.test.id }));
}

export default async function SelfAssessmentTestPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  if (!catalog().some((item) => item.test.id === testId)) {
    notFound();
  }
  return <ExamRunner testId={testId} />;
}
