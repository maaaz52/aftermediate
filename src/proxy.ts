import { NextResponse, type NextRequest } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - api routes (handled separately)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/" || pathname === "/coming-soon";

  if (!isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/coming-soon";
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
