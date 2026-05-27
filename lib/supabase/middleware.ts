import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

const FALLBACK_URL = "https://invalid.supabase.co";
const FALLBACK_KEY = "invalid-anon-key";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_KEY;

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Refresh session if expired.
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
  const isProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/cards") ||
    path.startsWith("/advisor") ||
    path.startsWith("/history");

  if (!user && isProtected) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }
  if (user && isAuthRoute) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    return NextResponse.redirect(redirect);
  }

  return response;
}
