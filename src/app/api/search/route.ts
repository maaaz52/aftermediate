import type { NextRequest } from "next/server";
import { searchSite } from "@/lib/site-search";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) ?? "";
  return Response.json({ results: searchSite(query) });
}
