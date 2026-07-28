import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { routing } from "./lib/i18n/routing";
import { updateSession } from "./lib/supabase/proxy";

const intlProxy = createMiddleware(routing);

function isAdminPath(pathname: string) {
  return (
    pathname === "/fr/admin" ||
    pathname.startsWith("/fr/admin/") ||
    pathname === "/en/admin" ||
    pathname.startsWith("/en/admin/")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname === "/") {
    return updateSession(
      request,
      NextResponse.redirect(new URL("/fr", request.url)),
    );
  }

  if (isAdminPath(pathname)) {
    const response =
      pathname === "/en/admin/login"
        ? NextResponse.rewrite(new URL("/en/admin/connexion", request.url), {
            request: {
              headers: requestHeaders,
            },
          })
        : NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });

    return updateSession(request, response);
  }

  const response = intlProxy(request);

  return updateSession(request, response);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
