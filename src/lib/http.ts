import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/require-user";
import { jsonError } from "@/lib/api-response";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Creates a server client and verifies the session in one step, so a route
 * can't forget the signed-out branch. Returns the client and user on success,
 * or an error Response (default 401 "Unauthorized").
 */
export async function requireAuth(message = "Unauthorized") {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  if (!user) return { ok: false as const, error: jsonError(message, 401) };
  return { ok: true as const, supabase, user };
}

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; error: Response };

/**
 * Reads and JSON-parses a request body, refusing anything over maxBytes. The
 * declared content-length is the cheap refusal; the real size is measured on
 * the text actually handed to the parser, because Content-Length is the
 * client's word.
 */
export async function parseJsonBody(
  req: Request,
  maxBytes: number
): Promise<JsonBodyResult> {
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, error: jsonError("Request body is too large", 413) };
  }

  const text = await req.text();
  if (text.length > maxBytes) {
    return { ok: false, error: jsonError("Request body is too large", 413) };
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, error: jsonError("Request body is not valid JSON", 400) };
  }
}