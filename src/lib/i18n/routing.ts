import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/hebergement": {
      fr: "/hebergement",
      en: "/accommodation",
    },
    "/restaurant": {
      fr: "/restaurant",
      en: "/restaurant",
    },
    "/salles": {
      fr: "/salles",
      en: "/venues",
    },
    "/evenements": {
      fr: "/evenements",
      en: "/events",
    },
    "/actualites": {
      fr: "/actualites",
      en: "/blog",
    },
    "/actualites/[slug]": {
      fr: "/actualites/[slug]",
      en: "/blog/[slug]",
    },
    "/boutique": {
      fr: "/boutique",
      en: "/shop",
    },
    "/boutique/[slug]": {
      fr: "/boutique/[slug]",
      en: "/shop/[slug]",
    },
  },
});

export type Locale = (typeof routing.locales)[number];
export type RouteKey =
  | "home"
  | "hebergement"
  | "restaurant"
  | "salles"
  | "evenements"
  | "actualites"
  | "boutique";
