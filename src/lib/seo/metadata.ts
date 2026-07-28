import type { Metadata } from "next";
import { SHOP_ENABLED } from "@/config/features";
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

const homeTitles: Record<Locale, string> = {
  fr: "La Résidence Ankerana | Hôtel, Restaurant et Salle de Réception à Antananarivo",
  en: "La Résidence Ankerana | Hotel, Restaurant and Event Venue in Antananarivo",
};

const homeDescriptions: Record<Locale, string> = SHOP_ENABLED
  ? {
      fr: "Séjournez à La Résidence Ankerana à Antananarivo. Hôtel, restaurant Le Privilège, salles de séminaire, événements privés, brunchs et boutique.",
      en: "Stay at La Résidence Ankerana in Antananarivo. Hotel, restaurant, seminar venue, private events, brunches and local shop.",
    }
  : {
      fr: "Séjournez à La Résidence Ankerana à Antananarivo. Hôtel, restaurant Le Privilège, salles de séminaire, événements privés et brunchs.",
      en: "Stay at La Résidence Ankerana in Antananarivo. Hotel, restaurant, seminar venue, private events and brunches.",
    };

const accommodationTitles: Record<Locale, string> = {
  fr: "Hébergements à Antananarivo | Chambres, Studios et Appartement",
  en: "Accommodation in Antananarivo | Rooms, Studios and Apartment",
};

const accommodationDescriptions: Record<Locale, string> = {
  fr: "Découvrez les chambres, studios et appartement de La Résidence Ankerana à Antananarivo : Wi-Fi, parking, piscine et hébergements adaptés aux séjours courts ou prolongés.",
  en: "Discover the rooms, studios and apartment at La Résidence Ankerana in Antananarivo, with Wi-Fi, parking, pool access and accommodation for short or extended stays.",
};

const accommodationOgAlt: Record<Locale, string> = {
  fr: "Hébergements de La Résidence Ankerana à Antananarivo",
  en: "Accommodation at La Résidence Ankerana in Antananarivo",
};

const restaurantTitles: Record<Locale, string> = {
  fr: "Restaurant à Ankerana Antananarivo | Le Privilège",
  en: "Restaurant in Ankerana Antananarivo | Le Privilège",
};

const restaurantDescriptions: Record<Locale, string> = {
  fr: "Découvrez Le Privilège, le restaurant de La Résidence Ankerana à Antananarivo : petit-déjeuner, déjeuner, dîner, cuisine malagasy, pizzas, desserts et repas de groupe.",
  en: "Discover Le Privilège, the restaurant at La Résidence Ankerana in Antananarivo, serving breakfast, lunch, dinner, Malagasy cuisine, pizzas, desserts and group meals.",
};

const restaurantOgAlt: Record<Locale, string> = {
  fr: "Restaurant Le Privilège à La Résidence Ankerana",
  en: "Le Privilège restaurant at La Résidence Ankerana",
};

const venuesTitles: Record<Locale, string> = {
  fr: "Salles de séminaire à Antananarivo | La Résidence Ankerana",
  en: "Seminar and Event Venues in Antananarivo | La Résidence Ankerana",
};

const venuesDescriptions: Record<Locale, string> = {
  fr: "Découvrez les salles de séminaire, réunion et réception de La Résidence Ankerana à Antananarivo, adaptées aux formations, conférences, ateliers et événements professionnels.",
  en: "Discover the seminar, meeting and reception venues at La Résidence Ankerana in Antananarivo for training sessions, conferences, workshops and professional events.",
};

const venuesOgAlt: Record<Locale, string> = {
  fr: "Salles de séminaire de La Résidence Ankerana à Antananarivo",
  en: "Seminar and event venues at La Résidence Ankerana in Antananarivo",
};

const eventsTitles: Record<Locale, string> = {
  fr: "Organisation d'événements à Antananarivo | La Résidence Ankerana",
  en: "Event Venue in Antananarivo | La Résidence Ankerana",
};

const eventsDescriptions: Record<Locale, string> = {
  fr: "Organisez vos séminaires, mariages, réceptions, événements piscine et prestations traiteur à La Résidence Ankerana à Antananarivo.",
  en: "Host seminars, weddings, receptions, poolside events and catering services at La Résidence Ankerana in Antananarivo.",
};

const eventsOgAlt: Record<Locale, string> = {
  fr: "Organisation d'événements à La Résidence Ankerana à Antananarivo",
  en: "Events at La Résidence Ankerana in Antananarivo",
};

const newsTitles: Record<Locale, string> = {
  fr: "Actualités et nouveautés à Antananarivo | La Résidence Ankerana",
  en: "News and Updates in Antananarivo | La Résidence Ankerana",
};

const newsDescriptions: Record<Locale, string> = {
  fr: "Découvrez les actualités, événements, offres, nouveautés du restaurant et conseils de La Résidence Ankerana à Antananarivo.",
  en: "Discover news, events, offers, restaurant updates and practical advice from La Résidence Ankerana in Antananarivo.",
};

const newsOgAlt: Record<Locale, string> = {
  fr: "Actualités de La Résidence Ankerana à Antananarivo",
  en: "News from La Résidence Ankerana in Antananarivo",
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

export function getAccommodationMetadata(locale: Locale): Metadata {
  const baseUrl = getBaseUrl();
  const route = routeForKey("hebergement");
  const canonical = route?.paths[locale] ?? `/${locale}/hebergement`;
  const title = accommodationTitles[locale];
  const description = accommodationDescriptions[locale];
  const openGraphLocale = locale === "fr" ? "fr_FR" : "en_US";
  const alternateLocale = locale === "fr" ? "en_US" : "fr_FR";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        fr: route?.paths.fr ?? "/fr/hebergement",
        en: route?.paths.en ?? "/en/accommodation",
        "x-default": route?.paths.fr ?? "/fr/hebergement",
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      alternateLocale,
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      images: [
        {
          url: "/hebergement.jpeg",
          width: 1200,
          height: 630,
          alt: accommodationOgAlt[locale],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/hebergement.jpeg"],
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export function getRestaurantMetadata(locale: Locale): Metadata {
  const baseUrl = getBaseUrl();
  const route = routeForKey("restaurant");
  const canonical = route?.paths[locale] ?? `/${locale}/restaurant`;
  const title = restaurantTitles[locale];
  const description = restaurantDescriptions[locale];
  const openGraphLocale = locale === "fr" ? "fr_FR" : "en_US";
  const alternateLocale = locale === "fr" ? "en_US" : "fr_FR";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        fr: route?.paths.fr ?? "/fr/restaurant",
        en: route?.paths.en ?? "/en/restaurant",
        "x-default": route?.paths.fr ?? "/fr/restaurant",
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      alternateLocale,
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      images: [
        {
          url: "/hero-restau-light.jpg",
          width: 1200,
          height: 630,
          alt: restaurantOgAlt[locale],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/hero-restau-light.jpg"],
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export function getVenuesMetadata(locale: Locale): Metadata {
  const baseUrl = getBaseUrl();
  const route = routeForKey("salles");
  const canonical = route?.paths[locale] ?? `/${locale}/salles`;
  const title = venuesTitles[locale];
  const description = venuesDescriptions[locale];
  const openGraphLocale = locale === "fr" ? "fr_FR" : "en_US";
  const alternateLocale = locale === "fr" ? "en_US" : "fr_FR";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        fr: route?.paths.fr ?? "/fr/salles",
        en: route?.paths.en ?? "/en/venues",
        "x-default": route?.paths.fr ?? "/fr/salles",
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      alternateLocale,
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      images: [
        {
          url: "/salles.jpeg",
          width: 1200,
          height: 630,
          alt: venuesOgAlt[locale],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/salles.jpeg"],
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export function getEventsMetadata(locale: Locale): Metadata {
  const baseUrl = getBaseUrl();
  const route = routeForKey("evenements");
  const canonical = route?.paths[locale] ?? `/${locale}/evenements`;
  const title = eventsTitles[locale];
  const description = eventsDescriptions[locale];
  const openGraphLocale = locale === "fr" ? "fr_FR" : "en_US";
  const alternateLocale = locale === "fr" ? "en_US" : "fr_FR";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        fr: route?.paths.fr ?? "/fr/evenements",
        en: route?.paths.en ?? "/en/events",
        "x-default": route?.paths.fr ?? "/fr/evenements",
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      alternateLocale,
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      images: [
        {
          url: "/evenements.jpeg",
          width: 1200,
          height: 630,
          alt: eventsOgAlt[locale],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/evenements.jpeg"],
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export function getNewsMetadata(locale: Locale): Metadata {
  const baseUrl = getBaseUrl();
  const route = routeForKey("actualites");
  const canonical = route?.paths[locale] ?? `/${locale}/actualites`;
  const title = newsTitles[locale];
  const description = newsDescriptions[locale];
  const openGraphLocale = locale === "fr" ? "fr_FR" : "en_US";
  const alternateLocale = locale === "fr" ? "en_US" : "fr_FR";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        fr: route?.paths.fr ?? "/fr/actualites",
        en: route?.paths.en ?? "/en/blog",
        "x-default": route?.paths.fr ?? "/fr/actualites",
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      alternateLocale,
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      images: [
        {
          url: "/restaurant.jpeg",
          width: 1200,
          height: 630,
          alt: newsOgAlt[locale],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/restaurant.jpeg"],
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export function getHomeMetadata(locale: Locale): Metadata {
  const baseUrl = getBaseUrl();
  const canonical = siteConfig.homeRoute.paths[locale];
  const title = homeTitles[locale];
  const description = homeDescriptions[locale];
  const openGraphLocale = locale === "fr" ? "fr_FR" : "en_US";
  const alternateLocale = locale === "fr" ? "en_US" : "fr_FR";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical,
      languages: {
        fr: siteConfig.homeRoute.paths.fr,
        en: siteConfig.homeRoute.paths.en,
      },
    },
    openGraph: {
      type: "website",
      locale: openGraphLocale,
      alternateLocale,
      siteName: siteConfig.name,
      title,
      description,
      url: canonical,
      images: [
        {
          url: "/couverture.jpeg",
          width: 1200,
          height: 630,
          alt: "La Résidence Ankerana à Antananarivo",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/couverture.jpeg"],
    },
    icons: {
      icon: "/favicon.ico",
    },
  };
}
