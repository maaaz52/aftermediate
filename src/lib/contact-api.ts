import { createClient } from "@/lib/supabase/client";

export async function submitContactMessage(input: {
  name: string;
  email: string;
  message: string;
  rating: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("contact_messages").insert({
    user_id: user?.id ?? null,
    name: input.name,
    email: input.email,
    message: input.message,
    rating: input.rating,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
