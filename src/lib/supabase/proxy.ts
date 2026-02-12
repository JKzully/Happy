import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase env vars in proxy");
    // Redirect to login if env vars are missing (don't allow dashboard access)
    if (!request.nextUrl.pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
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

  // Cron sync endpoints skip auth (verified by CRON_SECRET in route handler)
  const cronPaths = ["/api/shopify/sync", "/api/meta/sync", "/api/google-ads/sync"];
  if (cronPaths.includes(pathname)) {
    return supabaseResponse;
  }

  // Public paths that don't require authentication
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/set-password");

  // All other API routes require authenticated session (same as pages)
  if (!user && pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Not logged in → redirect to login (unless on a public path)
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const needsPassword = user.user_metadata?.needs_password === true;

    // User needs to set password → force to set-password page
    if (needsPassword && pathname !== "/auth/set-password" && pathname !== "/auth/callback") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/set-password";
      return NextResponse.redirect(url);
    }

    // User with password set → redirect away from login/set-password
    if (!needsPassword && (pathname === "/login" || pathname === "/auth/set-password")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
