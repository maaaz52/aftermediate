import { createClient } from "@/lib/supabase/client";

export async function submitMentorApplication(input: {
  name: string;
  email: string;
  institution: string;
  degree: string;
  field: string;
  bio: string;
  topics: string;
  socialLink: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("mentor_applications").insert({
    user_id: user?.id ?? null,
    name: input.name,
    email: input.email,
    institution: input.institution,
    degree: input.degree,
    field: input.field,
    bio: input.bio,
    topics: input.topics,
    social_link: input.socialLink,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
