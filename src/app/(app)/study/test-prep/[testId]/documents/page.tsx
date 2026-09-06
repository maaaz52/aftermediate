import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FileText, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/site";
import { contentFor, findTest, REGION_LABEL } from "@/lib/test-prep";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ testId: string }>;
}): Promise<Metadata> {
  const { testId } = await params;
  const name = findTest(testId)?.name;
  return pageMetadata({
    title: name ? `${name} — resources & documents` : "Test prep resources",
    description: name ? `Free preparation resources and documents for ${name}.` : "Test prep resources",
    path: `/study/test-prep/${testId}/documents`,
  });
}

export default async function TestPrepDocumentsPage({
  params,
}: {
  params: Promise<{ testId: string }>;
}) {
  const { testId } = await params;
  const test = findTest(testId);
  if (!test) notFound();

  const resources = contentFor(testId).resources;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Test Prep", path: "/study/test-prep" },
          { name: test.name, path: `/study/test-prep/${test.id}/documents` },
        ])}
      />
      <Link
        href="/study/test-prep"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All tests
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {test.short} Documents
        </h1>
        <Badge variant={test.region === "pakistan" ? "saffron" : "violet"}>
          {REGION_LABEL[test.region]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{test.name}</p>

      {resources.length === 0 ? (
        <div className="card-glass mt-6 rounded-2xl p-10 text-center">
          <p className="text-sm text-muted">No documents added yet.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {resources.map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-saffron/40"
            >
              {r.type === "pdf" ? (
                <FileText className="h-5 w-5 shrink-0 text-danger" />
              ) : (
                <Link2 className="h-5 w-5 shrink-0 text-info" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{r.title}</p>
                <p className="text-[11px] text-faint">
                  {r.type === "pdf" ? "PDF" : "Link"}
                  {r.year ? ` · ${r.year}` : ""}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}

      <Link
        href={`/study/test-prep/${testId}/lectures`}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-soft"
      >
        View lectures →
      </Link>
    </div>
  );
}