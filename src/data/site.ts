import type { Locale, RouteKey } from "@/lib/i18n/routing";
import { SHOP_ENABLED } from "@/config/features";

type StaticRouteKey = Exclude<RouteKey, "home">;
export type InternalPath =
  | "/"
  | "/hebergement"
  | "/restaurant"
  | "/salles"
  | "/evenements"
  | "/actualites"
  | "/boutique";

export type SiteRoute = {
  key: StaticRouteKey;
  internalPath: Exclude<InternalPath, "/">;
  paths: Record<Locale, `/${Locale}${string}`>;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
};

const locales: Locale[] = ["fr", "en"];

const homeRoute = {
  key: "home" as const,
  internalPath: "/" as const,
  paths: {
    fr: "/fr",
    en: "/en",
  },
  priority: 1,
  changeFrequency: "weekly" as const,
};

const boutiqueRoute: SiteRoute = {
  key: "boutique",
  internalPath: "/boutique",
  paths: { fr: "/fr/boutique", en: "/en/shop" },
  priority: 0.7,
  changeFrequency: "weekly",
};

const primaryRoutes: SiteRoute[] = [
  {
    key: "hebergement",
    internalPath: "/hebergement",
    paths: { fr: "/fr/hebergement", en: "/en/accommodation" },
    priority: 0.9,
    changeFrequency: "weekly",
  },
  {
    key: "restaurant",
    internalPath: "/restaurant",
    paths: { fr: "/fr/restaurant", en: "/en/restaurant" },
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    key: "salles",
    internalPath: "/salles",
    paths: { fr: "/fr/salles", en: "/en/venues" },
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    key: "evenements",
    internalPath: "/evenements",
    paths: { fr: "/fr/evenements", en: "/en/events" },
    priority: 0.8,
    changeFrequency: "weekly",
  },
  {
    key: "actualites",
    internalPath: "/actualites",
    paths: { fr: "/fr/actualites", en: "/en/blog" },
    priority: 0.7,
    changeFrequency: "daily",
  },
  ...(SHOP_ENABLED ? [boutiqueRoute] : []),
];

export const siteConfig = {
  name: "La Résidence Ankerana",
  location: "Antananarivo, Madagascar",
  reservationUrl: {
    fr: "https://secure.reservit.com/engine/booking/2/450550/dates?specialMode=default&langcode=FR&m=booking",
    en: "https://secure.reservit.com/engine/booking/2/450550/dates?specialMode=default&langcode=EN&m=booking",
  },
  contact: {
    addressLine1: "Lot II H 40 A, Ankerana Ankadindramamy",
    phoneDisplay: "034 01 807 70",
    phoneHref: "+261340180770",
    email: "contact.laresidenceankerana@gmail.com",
  },
  socialLinks: {
    facebook: "https://www.facebook.com/LaResidenceAntananarivo",
    instagram:
      "https://www.instagram.com/laresidence_ankerana?igsh=MXFlejd5d3A5eWtncw==",
    whatsapp: "https://wa.me/261340180772",
  },
  footerServices: ["stays", "meals", "meetings", "brunches"] as const,
  locales,
  homeRoute,
  primaryRoutes,
  seoRoutes: [homeRoute, ...primaryRoutes],
  futureCollections: [
    "rooms",
    "restaurant_menu",
    "events",
    "blog_posts",
    "products",
    "bookings",
  ],
  organizationSchema(baseUrl: string) {
    return {
      "@context": "https://schema.org",
      "@type": "Hotel",
      name: "La Résidence Ankerana",
      url: baseUrl,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Antananarivo",
        addressCountry: "MG",
      },
    };
  },
};
