import { NextResponse } from "next/server";

/**
 * Shared JSON response helpers for API routes.
 *
 * A single place for the error envelope so every route returns the same shape
 * (`{ error: string }`) and the same content-type. Keeps status codes and
 * message wording consistent across the app.
 */
export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}