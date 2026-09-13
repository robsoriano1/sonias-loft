import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/* Keeps the Supabase session cookie fresh AND bounces anyone who is not
   signed in away from /admin. The login page itself stays public. */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isGuarded = pathname.startsWith("/admin") || pathname.startsWith("/staff");

  if (!user && isGuarded && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  /* Staff have exactly one screen. Sending them there rather than showing an
     owner page they cannot load keeps the boundary legible - the pages
     themselves re-check, and RLS is what actually enforces it. */
  if (user && (isLoginPage || pathname.startsWith("/admin"))) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    // No row means migration 002 has not run yet: treat as owner, which is
    // how this install behaved before roles existed.
    const role = (data as { role: string } | null)?.role ?? "owner";
    const home = role === "owner" ? "/admin" : "/staff";

    if (isLoginPage || (role !== "owner" && pathname.startsWith("/admin"))) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/staff"],
};
