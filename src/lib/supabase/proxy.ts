import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    await supabase.auth.getUser();
  } catch (error) {
    console.warn(
      "[supabase-proxy] Session refresh skipped:",
      error instanceof Error ? error.name : "Unknown error",
    );

    const { pathname } = request.nextUrl;
    const isAdminPath =
      pathname === "/fr/admin" ||
      pathname.startsWith("/fr/admin/") ||
      pathname === "/en/admin" ||
      pathname.startsWith("/en/admin/");
    const isLoginPath =
      pathname === "/fr/admin/connexion" || pathname === "/en/admin/login";

    if (isAdminPath && !isLoginPath) {
      return NextResponse.redirect(new URL("/fr/admin/connexion", request.url));
    }
  }

  return response;
}
