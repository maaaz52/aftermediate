import { formatPkr } from "@/lib/abroad-planner";
import type { AbroadTest, EntryTest, Stream } from "@/lib/types";
import entryJson from "@/data/entry-tests.json";
import abroadJson from "@/data/abroad-tests.json";
import contentJson from "@/data/test-prep-content.json";

const entryData = entryJson as unknown as { tests: EntryTest[] };
const abroadData = abroadJson as unknown as { tests: AbroadTest[] };
const prepContent = contentJson as unknown as {
  content: { testId: string; playlists: TestPlaylist[]; resources: TestResource[]; videos: R2Video[] }[];
};

export interface TestPlaylist {
  id: string;
  title: string;
  note?: string;
  episodes: { id: string; title: string; videoId: string }[];
}

export interface TestResource {
  id: string;
  title: string;
  type: "pdf" | "link";
  url: string;
  year?: number;
}

export interface R2Video {
  id: string;
  title: string;
  r2Key: string;
  note?: string;
}

export type Region = "pakistan" | "abroad";

export interface MergedTest {
  region: Region;
  id: string;
  short: string;
  name: string;
  body: string;
  patternCount: number;
  streams: Stream[];
}

export const REGION_LABEL: Record<Region, string> = {
  pakistan: "Pakistan",
  abroad: "Abroad",
};

export interface PrepContent {
  testId: string;
  playlists: TestPlaylist[];
  resources: TestResource[];
  videos: R2Video[];
}

export function contentFor(testId: string): PrepContent {
  return (
    prepContent.content.find((c) => c.testId === testId) ?? {
      testId,
      playlists: [],
      resources: [],
      videos: [],
    }
  );
}

/** All episodes across a test's playlists, flattened with playlist context. */
export interface FlatEpisode {
  episodeId: string;
  title: string;
  videoId: string;
  playlistId: string;
  playlistTitle: string;
}

export function episodesFor(testId: string): FlatEpisode[] {
  return contentFor(testId).playlists.flatMap((p) =>
    p.episodes.map((e) => ({
      episodeId: e.id,
      title: e.title,
      videoId: e.videoId,
      playlistId: p.id,
      playlistTitle: p.title,
    }))
  );
}

function normalizeTests(): MergedTest[] {
  const pakistan: MergedTest[] = entryData.tests.map((t) => ({
    region: "pakistan",
    id: t.id,
    short: t.short,
    name: t.name,
    body: t.conductingBody,
    patternCount: t.pattern.length,
    streams: t.streams,
  }));
  const abroad: MergedTest[] = abroadData.tests.map((t) => ({
    region: "abroad",
    id: t.id,
    short: t.short,
    name: t.name,
    body: "",
    patternCount: t.pattern.length,
    streams: [],
  }));
  return [...pakistan, ...abroad];
}

export const ALL_TESTS = normalizeTests();

export function findTest(testId: string): MergedTest | undefined {
  return ALL_TESTS.find((t) => t.id === testId);
}

export function findEntryTest(testId: string): EntryTest | undefined {
  return entryData.tests.find((t) => t.id === testId);
}

export function findAbroadTest(testId: string): AbroadTest | undefined {
  return abroadData.tests.find((t) => t.id === testId);
}

/** Fee display: raw string for Pakistan tests, formatted PKR for abroad. */
export function testFee(test: MergedTest): string {
  const entry = findEntryTest(test.id);
  if (entry) return entry.fee;
  const abroad = findAbroadTest(test.id);
  return formatPkr(abroad?.feePkr ?? 0);
}