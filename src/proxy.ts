import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/lib/i18n/routing";
import { siteConfig } from "@/data/site";

const excludedPathPattern = /\.(.*)$/;

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function requestHeadersWithLocale(request: NextRequest, locale: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", locale);
  return requestHeaders;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    excludedPathPattern.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/fr", request.url));
  }

  const normalizedPathname = normalizePathname(pathname);
  const locale = routing.locales.find(
    (item) =>
      normalizedPathname === `/${item}` ||
      normalizedPathname.startsWith(`/${item}/`),
  );

  if (!locale) {
    return NextResponse.redirect(new URL(`/fr${normalizedPathname}`, request.url));
  }

  const localizedPath = normalizedPathname.replace(`/${locale}`, "") || "/";
  const route = siteConfig.seoRoutes.find(
    (item) => item.paths[locale] === normalizedPathname,
  );
  const internalRoute = siteConfig.primaryRoutes.find(
    (item) => item.internalPath === localizedPath,
  );

  if (locale === "en" && internalRoute) {
    return NextResponse.redirect(
      new URL(internalRoute.paths.en, request.url),
      308,
    );
  }

  const requestHeaders = requestHeadersWithLocale(request, locale);

  if (route && route.internalPath !== localizedPath) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/${locale}${route.internalPath}`;
    return NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
