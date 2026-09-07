export async function submitContactMessage(input: {
  name: string;
  email: string;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: data?.error ?? "Could not send your message." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — check your connection and try again." };
  }
}