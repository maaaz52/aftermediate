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
  try {
    const res = await fetch("/api/mentors/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Could not send your application." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again." };
  }
}