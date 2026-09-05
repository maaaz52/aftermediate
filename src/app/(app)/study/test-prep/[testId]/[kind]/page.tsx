import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Link2, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CoursePlayer } from "@/components/skills/course-player";
import { R2VideoPlayer } from "@/components/study/r2-video-player";
import {
  ALL_TESTS,
  contentFor,
  findAbroadTest,
  findEntryTest,
  findTest,
  REGION_LABEL,
} from "@/lib/test-prep";

export function generateStaticParams() {
  return ALL_TESTS.flatMap((t) => [
    { testId: t.id, kind: "lectures" },
    { testId: t.id, kind: "documents" },
  ]);
}

export default async function TestPrepContentPage({
  params,
}: {
  params: Promise<{ testId: string; kind: string }>;
}) {
  const { testId, kind } = await params;
  if (kind !== "lectures" && kind !== "documents") notFound();

  const test = findTest(testId);
  if (!test) notFound();

  const content = contentFor(testId);
  const entry = findEntryTest(testId);
  const abroad = findAbroadTest(testId);

  const playlists = content.playlists;
  const videos = content.videos;
  const resources = content.resources;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/study/test-prep"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> All tests
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {test.short}
        </h1>
        <Badge variant={test.region === "pakistan" ? "saffron" : "violet"}>
          {REGION_LABEL[test.region]}
        </Badge>
        <Badge variant="muted">{kind === "lectures" ? "Lectures" : "Documents"}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">{test.name}</p>

      <div className="mt-6 space-y-4">
        {kind === "lectures" ? (
          <>
            {playlists.length === 0 && videos.length === 0 ? (
              <EmptyState label="No lectures added yet." />
            ) : (
              <>
                {playlists.map((p) =>
                  p.playlistId || p.videoId ? (
                    <CoursePlayer
                      key={p.id}
                      title={p.title}
                      playlistId={p.playlistId}
                      videoId={p.videoId}
                    />
                  ) : (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4"
                    >
                      <PlayCircle className="h-5 w-5 shrink-0 text-saffron" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                        {p.note && <p className="truncate text-xs text-muted">{p.note}</p>}
                      </div>
                    </div>
                  )
                )}
                {videos.map((v) => (
                  <R2VideoPlayer key={v.id} title={v.title} r2Key={v.r2Key} />
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {resources.length === 0 ? (
              <EmptyState label="No documents added yet." />
            ) : (
              resources.map((r) => (
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
              ))
            )}
          </>
        )}
      </div>

      {entry?.note && (
        <p className="mt-6 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-muted">{entry.note}</p>
      )}
      {abroad && (
        <p className="mt-6 rounded-lg bg-surface-2/60 px-3 py-2 text-xs text-muted">
          Competitive score: {abroad.competitiveScore}
        </p>
      )}

      <div className="mt-8 flex items-center gap-3">
        <Link
          href={`/study/test-prep/${test.id}/${kind === "lectures" ? "documents" : "lectures"}`}
          className="inline-flex items-center gap-2 rounded-lg bg-saffron px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-soft"
        >
          {kind === "lectures" ? "View documents →" : "View lectures →"}
        </Link>
        <Link
          href={
            test.region === "pakistan"
              ? `/pakistan/self-assessment/${test.id}`
              : `/abroad/self-assessment/${test.id}`
          }
          className="inline-flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted hover:text-ink"
        >
          Practice paper →
        </Link>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="card-glass rounded-2xl p-10 text-center">
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}