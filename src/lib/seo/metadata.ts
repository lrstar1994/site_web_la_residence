import type { Metadata } from "next";
import { siteConfig } from "@/data/site";
import type { Locale, RouteKey } from "@/lib/i18n/routing";

const fallbackBaseUrl = "https://domain.com";

const titles: Record<Locale, string> = {
  fr: "La Résidence Ankerana | Hôtel, Restaurant et Événements à Antananarivo",
  en: "La Résidence Ankerana | Hotel, Restaurant and Events in Antananarivo",
};

const descriptions: Record<Locale, string> = {
  fr: "Séjournez à La Résidence Ankerana, hôtel convivial à Antananarivo avec restaurant, salles, piscine et espaces événementiels.",
  en: "Stay at La Résidence Ankerana, a peaceful hotel in Antananarivo with restaurant, event venues and accommodation.",
};

export function getBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return siteUrl ? siteUrl.replace(/\/$/, "") : fallbackBaseUrl;
}

export function getDefaultTitle(locale: Locale) {
  return titles[locale];
}

export function getDefaultDescription(locale: Locale) {
  return descriptions[locale];
}

function routeForKey(routeKey: RouteKey) {
  if (routeKey === "home") {
    return siteConfig.homeRoute;
  }

  return siteConfig.primaryRoutes.find((route) => route.key === routeKey);
}

export function getRouteMetadata(locale: Locale, routeKey: RouteKey): Metadata {
  const baseUrl = getBaseUrl();
  const route = routeForKey(routeKey);
  const canonical = route?.paths[locale] ?? `/${locale}`;

  return {
    metadataBase: new URL(baseUrl),
    title: getDefaultTitle(locale),
    description: getDefaultDescription(locale),
    alternates: {
      canonical,
      languages: {
        fr: route?.paths.fr ?? "/fr",
        en: route?.paths.en ?? "/en",
      },
    },
    openGraph: {
      type: "website",
      locale,
      alternateLocale: locale === "fr" ? "en" : "fr",
      siteName: siteConfig.name,
      title: getDefaultTitle(locale),
      description: getDefaultDescription(locale),
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: getDefaultTitle(locale),
      description: getDefaultDescription(locale),
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export function getHomeMetadata(locale: Locale): Metadata {
  return getRouteMetadata(locale, "home");
}
