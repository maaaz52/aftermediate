import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const publicPages = [
    "/",
    "/login",
    "/coming-soon",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/terms",
    "/privacy",
    "/data-deletion",
    "/disclaimer",
    "/cookies",
    "/refund-policy",
    "/community-policy",
  ];
  const isPublicPage = publicPages.includes(pathname);
  const isApiRoute = pathname.startsWith("/api/");
  // OTP signup/verify must work for unauthenticated users (no session yet at signup time)
  const isPublicApiRoute = pathname.startsWith("/api/otp/");

  if (isApiRoute) {
    if (!isPublicApiRoute && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return supabaseResponse;
  }

  if (!isPublicPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
