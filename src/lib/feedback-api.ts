import { createClient } from "@/lib/supabase/client";
import type { MediaKind, PriorityId, ToneId } from "./feedback-model";

export type ReviewPayload = {
  tone: ToneId;
  rating: number;
  reviewText: string;
  surprised: string;
  mindset: string;
  recommendTo: string[];
};

export type ReviewFile = { file: File; kind: MediaKind };

export type FeatureRequest = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  use_case: string;
  priority: PriorityId;
  status: "open" | "planning" | "shipped";
  votes_count: number;
  created_at: string;
};

function extensionFor(kind: MediaKind, name: string): string {
  const ext = name.split(".").pop() ?? "";
  if (ext && ext.length <= 5 && /^[a-z0-9]+$/i.test(ext)) return ext;
  return kind === "image" ? "png" : kind === "video" ? "mp4" : "mpeg";
}

export async function submitReview(
  payload: ReviewPayload,
  files: ReviewFile[]
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to share your voice." };

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      user_id: user.id,
      tone: payload.tone,
      rating: payload.rating,
      review_text: payload.reviewText,
      surprised: payload.surprised,
      mindset: payload.mindset,
      recommend_to: payload.recommendTo,
    })
    .select("id")
    .single();

  if (error || !review) return { ok: false, error: error?.message ?? "Could not save your review." };

  for (const m of files) {
    const path = `${user.id}/${crypto.randomUUID()}.${extensionFor(m.kind, m.file.name)}`;
    const { error: upErr } = await supabase.storage.from("review-media").upload(path, m.file);
    if (upErr) return { ok: false, error: `Upload failed: ${upErr.message}` };
    const { error: mediaErr } = await supabase.from("review_media").insert({
      review_id: review.id,
      url: path,
      media_type: m.kind,
      file_name: m.file.name,
      file_size: m.file.size,
    });
    if (mediaErr) return { ok: false, error: `Media row failed: ${mediaErr.message}` };
  }

  return { ok: true, id: review.id };
}

export async function toggleVote(
  featureId: string
): Promise<{ ok: true; voted: boolean; count: number } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to vote." };

  const { data: existing } = await supabase
    .from("feature_votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("feature_id", featureId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("feature_votes").delete().eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("feature_votes").insert({ user_id: user.id, feature_id: featureId });
    if (error) return { ok: false, error: error.message };
  }

  const { data: row } = await supabase.from("feature_requests").select("votes_count").eq("id", featureId).single();
  return { ok: true, voted: !existing, count: row?.votes_count ?? 0 };
}

export async function listFeatureRequests(status: "all" | "open" | "planning" | "shipped"): Promise<FeatureRequest[]> {
  const supabase = createClient();
  let query = supabase.from("feature_requests").select("*");
  if (status !== "all") query = query.eq("status", status);
  const { data } = await query.order("votes_count", { ascending: false });
  return (data ?? []) as FeatureRequest[];
}

export async function submitFeatureRequest(input: {
  name: string;
  description: string;
  useCase: string;
  priority: PriorityId;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in to propose a feature." };

  const { data, error } = await supabase
    .from("feature_requests")
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description,
      use_case: input.useCase,
      priority: input.priority,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not save your idea." };
  return { ok: true, id: data.id };
}

export interface MyReview {
  id: string;
  tone: string;
  rating: number;
  review_text: string;
  status: string;
  created_at: string;
  media: { id: string; url: string; media_type: string; file_name: string }[];
}

/** The signed-in user's own reviews, newest first, each with its media rows. */
export async function listMyReviews(): Promise<MyReview[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, tone, rating, review_text, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (!reviews?.length) return [];

  const { data: media } = await supabase
    .from("review_media")
    .select("id, review_id, url, media_type, file_name")
    .in(
      "review_id",
      reviews.map((r) => r.id)
    );

  return (reviews as MyReview[]).map((r) => ({
    ...r,
    media: (media ?? []).filter((m) => m.review_id === r.id),
  }));
}

/** Resolve a signed URL for review media the caller is allowed to see. */
export async function reviewMediaSignedUrl(path: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/review-media/url?path=${encodeURIComponent(path)}`);
    if (!res.ok) return null;
    const data = (await res.json().catch(() => null)) as { url?: string } | null;
    return data?.url ?? null;
  } catch {
    return null;
  }
}
