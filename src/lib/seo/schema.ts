import { siteConfig } from "@/data/site";
import type { NewsArticle } from "@/data/news";
import type { Locale } from "@/lib/i18n/routing";
import type { Accommodation } from "@/types/accommodation";
import type { EventService } from "@/types/event-service";
import type { RestaurantMenu } from "@/types/restaurant-menu";
import type { Venue } from "@/types/venue";

export function buildWebsiteSchema(baseUrl: string, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: `${baseUrl}/${locale}`,
    inLanguage: locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/${locale}/actualites?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildHomepageSchema(baseUrl: string, locale: Locale) {
  const homeUrl = `${baseUrl}${siteConfig.homeRoute.paths[locale]}`;
  const restaurantRoute = siteConfig.primaryRoutes.find(
    (route) => route.key === "restaurant",
  );
  const venuesRoute = siteConfig.primaryRoutes.find(
    (route) => route.key === "salles",
  );
  const restaurantUrl = `${baseUrl}${restaurantRoute?.paths[locale] ?? `/${locale}/restaurant`}`;
  const venuesUrl = `${baseUrl}${venuesRoute?.paths[locale] ?? `/${locale}/salles`}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Hotel",
        "@id": `${homeUrl}#hotel`,
        name: "La Résidence Ankerana",
        url: homeUrl,
        image: `${baseUrl}/couverture.jpeg`,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
        telephone: siteConfig.contact.phoneHref,
        email: siteConfig.contact.email,
        amenityFeature: [
          {
            "@type": "LocationFeatureSpecification",
            name: "Restaurant Le Privilège",
            value: true,
          },
          {
            "@type": "LocationFeatureSpecification",
            name: "Seminar and event venues",
            value: true,
          },
        ],
      },
      {
        "@type": "Restaurant",
        "@id": `${restaurantUrl}#restaurant`,
        name: "Le Privilège",
        url: restaurantUrl,
        image: `${baseUrl}/restaurant.jpeg`,
        servesCuisine: ["Malagasy", "International"],
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
        parentOrganization: {
          "@id": `${homeUrl}#hotel`,
        },
      },
      {
        "@type": "LocalBusiness",
        "@id": `${homeUrl}#localbusiness`,
        name: "La Résidence Ankerana",
        url: homeUrl,
        image: `${baseUrl}/salles.jpeg`,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
        telephone: siteConfig.contact.phoneHref,
        email: siteConfig.contact.email,
        department: {
          "@type": "LocalBusiness",
          name: "Salles de séminaire et réception",
          url: venuesUrl,
        },
      },
    ],
  };
}

function getAccommodationRoute(locale: Locale) {
  const route = siteConfig.primaryRoutes.find(
    (item) => item.key === "hebergement",
  );
  return route?.paths[locale] ?? `/${locale}/hebergement`;
}

function getRestaurantRoute(locale: Locale) {
  const route = siteConfig.primaryRoutes.find(
    (item) => item.key === "restaurant",
  );
  return route?.paths[locale] ?? `/${locale}/restaurant`;
}

function getVenuesRoute(locale: Locale) {
  const route = siteConfig.primaryRoutes.find((item) => item.key === "salles");
  return route?.paths[locale] ?? `/${locale}/salles`;
}

function getEventsRoute(locale: Locale) {
  const route = siteConfig.primaryRoutes.find(
    (item) => item.key === "evenements",
  );
  return route?.paths[locale] ?? `/${locale}/evenements`;
}

function getNewsRoute(locale: Locale) {
  const route = siteConfig.primaryRoutes.find(
    (item) => item.key === "actualites",
  );
  return route?.paths[locale] ?? `/${locale}/actualites`;
}

export function buildAccommodationPageSchema(
  baseUrl: string,
  locale: Locale,
  accommodations: Accommodation[] = [],
) {
  const pageUrl = `${baseUrl}${getAccommodationRoute(locale)}`;
  const listName =
    locale === "fr"
      ? "Hébergements à La Résidence Ankerana"
      : "Accommodation at La Résidence Ankerana";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Hotel",
        "@id": `${pageUrl}#hotel`,
        name: "La Résidence Ankerana",
        url: pageUrl,
        image: `${baseUrl}/hebergement.jpeg`,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
        telephone: siteConfig.contact.phoneHref,
        email: siteConfig.contact.email,
        amenityFeature: [
          {
            "@type": "LocationFeatureSpecification",
            name: "Wi-Fi",
            value: true,
          },
          {
            "@type": "LocationFeatureSpecification",
            name: locale === "fr" ? "Parking" : "Parking",
            value: true,
          },
          {
            "@type": "LocationFeatureSpecification",
            name: locale === "fr" ? "Accès piscine" : "Pool access",
            value: true,
          },
        ],
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#accommodation-list`,
        name: listName,
        url: pageUrl,
        numberOfItems: accommodations.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: accommodations.map((accommodation, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Product",
            "@id": `${pageUrl}#${accommodation.code}`,
            name: accommodation.name[locale],
            description: accommodation.shortDescription[locale],
            image: accommodation.images[0]?.imagePath?.startsWith("/") ? `${baseUrl}${accommodation.images[0]?.imagePath ?? "/hebergement.jpeg"}` : (accommodation.images[0]?.imagePath ?? `${baseUrl}/hebergement.jpeg`),
            category: accommodation.category[locale],
            additionalProperty: [
              {
                "@type": "PropertyValue",
                name: locale === "fr" ? "Surface" : "Floor area",
                value: accommodation.surfaceM2 ? `${accommodation.surfaceM2} m²` : "",
              },
              {
                "@type": "PropertyValue",
                name: locale === "fr" ? "Capacité" : "Capacity",
                value: accommodation.capacity,
              },
            ],
            offers: {
              "@type": "Offer",
              url: pageUrl,
              priceCurrency: "MGA",
              price: accommodation.priceFrom,
            },
          },
        })),
      },
    ],
  };
}

export function buildRestaurantPageSchema(baseUrl: string, locale: Locale, menus: RestaurantMenu[] = []) {
  const pageUrl = `${baseUrl}${getRestaurantRoute(locale)}`;
  const homeUrl = `${baseUrl}${siteConfig.homeRoute.paths[locale]}`;
  const listName =
    locale === "fr"
      ? "Cartes du restaurant Le Privilège"
      : "Menus at Le Privilège restaurant";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Restaurant",
        "@id": `${pageUrl}#restaurant`,
        name: "Le Privilège",
        alternateName: "Restaurant Le Privilège",
        url: pageUrl,
        image: `${baseUrl}/hero-restau-light.jpg`,
        telephone: siteConfig.contact.phoneHref,
        email: siteConfig.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
        servesCuisine: ["Malagasy", "International", "Breakfast", "Pizza"],
        parentOrganization: {
          "@type": "Hotel",
          "@id": `${homeUrl}#hotel`,
          name: "La Résidence Ankerana",
          url: homeUrl,
        },
        containedInPlace: {
          "@id": `${homeUrl}#hotel`,
        },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#menu-categories`,
        name: listName,
        url: pageUrl,
        numberOfItems: menus.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: menus.map((menu, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: menu.title[locale],
            description: menu.shortDescription[locale],
            image: menu.images[0]?.imagePath?.startsWith("/")
              ? `${baseUrl}${menu.images[0]?.imagePath ?? "/hero-restau-light.jpg"}`
              : (menu.images[0]?.imagePath ?? `${baseUrl}/hero-restau-light.jpg`),
          },
        })),
      },
    ],
  };
}

export function buildVenuesPageSchema(baseUrl: string, locale: Locale, venues: Venue[] = []) {
  const pageUrl = `${baseUrl}${getVenuesRoute(locale)}`;
  const listName =
    locale === "fr"
      ? "Salles de La Résidence Ankerana"
      : "Venues at La Résidence Ankerana";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["LocalBusiness", "EventVenue"],
        "@id": `${pageUrl}#event-venue`,
        name: "La Résidence Ankerana",
        url: pageUrl,
        image: `${baseUrl}/salles.jpeg`,
        telephone: siteConfig.contact.phoneHref,
        email: siteConfig.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
      },
      {
        "@type": "ItemList",
        "@id": `${pageUrl}#venue-list`,
        name: listName,
        url: pageUrl,
        numberOfItems: venues.length,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: venues.map((venue, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "EventVenue",
            "@id": `${pageUrl}#${venue.code}`,
            name: venue.name,
            description: venue.description[locale],
            image: venue.images[0]?.imagePath?.startsWith("/")
              ? `${baseUrl}${venue.images[0]?.imagePath ?? "/salles.jpeg"}`
              : (venue.images[0]?.imagePath ?? `${baseUrl}/salles.jpeg`),
            maximumAttendeeCapacity: venue.capacity,
            floorSize: {
              "@type": "QuantitativeValue",
              value: venue.surfaceM2 ?? undefined,
              unitCode: "MTK",
            },
            containedInPlace: {
              "@id": `${pageUrl}#event-venue`,
            },
            provider: {
              "@id": `${pageUrl}#event-venue`,
            },
          },
        })),
      },
    ],
  };
}

export function buildEventsPageSchema(
  baseUrl: string,
  locale: Locale,
  eventServices: EventService[] = [],
) {
  const pageUrl = `${baseUrl}${getEventsRoute(locale)}`;
  const listName =
    locale === "fr"
      ? "Prestations événementielles de La Résidence Ankerana"
      : "Event services at La Résidence Ankerana";

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `${pageUrl}#localbusiness`,
        name: "La Résidence Ankerana",
        url: pageUrl,
        image: `${baseUrl}/evenements.jpeg`,
        telephone: siteConfig.contact.phoneHref,
        email: siteConfig.contact.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
      },
      {
        "@type": "EventVenue",
        "@id": `${pageUrl}#event-venue`,
        name: "La Résidence Ankerana",
        url: pageUrl,
        image: `${baseUrl}/evenements.jpeg`,
        address: {
          "@type": "PostalAddress",
          streetAddress: siteConfig.contact.addressLine1,
          addressLocality: "Antananarivo",
          addressCountry: "MG",
        },
        containedInPlace: {
          "@id": `${pageUrl}#localbusiness`,
        },
      },
      ...(eventServices.length > 0
        ? [
            {
              "@type": "ItemList",
              "@id": `${pageUrl}#event-services`,
              name: listName,
              url: pageUrl,
              numberOfItems: eventServices.length,
              itemListOrder: "https://schema.org/ItemListOrderAscending",
              itemListElement: eventServices.map((service, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Service",
                  name: service.title[locale],
                  description: service.description[locale],
                  image: service.imagePath.startsWith("/")
                    ? `${baseUrl}${service.imagePath}`
                    : service.imagePath,
                },
              })),
            },
          ]
        : []),
    ],
  };
}

export function buildNewsPageSchema(
  baseUrl: string,
  locale: Locale,
  articles: NewsArticle[] = [],
) {
  const pageUrl = `${baseUrl}${getNewsRoute(locale)}`;
  const blogName =
    locale === "fr"
      ? "Actualités de La Résidence Ankerana"
      : "La Résidence Ankerana News";
  const blogDescription =
    locale === "fr"
      ? "Actualités, événements, offres, nouveautés du restaurant et conseils de La Résidence Ankerana à Antananarivo."
      : "News, events, offers, restaurant updates and practical advice from La Résidence Ankerana in Antananarivo.";
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Blog",
      "@id": `${pageUrl}#blog`,
      name: blogName,
      description: blogDescription,
      url: pageUrl,
      image: `${baseUrl}/restaurant.jpeg`,
      inLanguage: locale,
      publisher: {
        "@type": "Hotel",
        "@id": `${baseUrl}${siteConfig.homeRoute.paths[locale]}#hotel`,
        name: "La Résidence Ankerana",
        url: `${baseUrl}${siteConfig.homeRoute.paths[locale]}`,
      },
    },
  ];

  if (articles.length > 0) {
    graph[0].hasPart = {
      "@id": `${pageUrl}#news-list`,
    };

    graph.push({
      "@type": "ItemList",
      "@id": `${pageUrl}#news-list`,
      name: blogName,
      numberOfItems: articles.length,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: articles.map((article, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "CreativeWork",
          name: article.title[locale],
          description: article.excerpt[locale],
          image: `${baseUrl}${article.image}`,
          datePublished: article.publishedAt,
          category: article.categoryLabel?.[locale] ?? article.category,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}



