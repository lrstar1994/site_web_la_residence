import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { getActiveAccommodationCodes } from "@/lib/accommodations/get-accommodations";
import { getAccommodationDetailPath } from "@/lib/accommodations/accommodation-routes";
import { getActiveEventServiceCodes } from "@/lib/events/get-event-services";
import { getEventServiceDetailPath } from "@/lib/events/event-service-routes";
import { getBaseUrl } from "@/lib/seo/metadata";
import { getActiveVenueCodes } from "@/lib/venues/get-venues";
import { getVenueDetailPath } from "@/lib/venues/venue-routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date();

  const staticRoutes = siteConfig.locales.flatMap((locale) =>
    siteConfig.seoRoutes.map((route) => ({
      url: `${baseUrl}${route.paths[locale]}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: {
        languages: {
          fr: `${baseUrl}${route.paths.fr}`,
          en: `${baseUrl}${route.paths.en}`,
        },
      },
    })),
  );

  const accommodations = await getActiveAccommodationCodes();
  const venues = await getActiveVenueCodes();
  const eventServices = await getActiveEventServiceCodes();
  const accommodationRoutes: MetadataRoute.Sitemap = accommodations.ok
    ? siteConfig.locales.flatMap((locale) =>
        accommodations.accommodations.map((accommodation) => ({
          url: `${baseUrl}${getAccommodationDetailPath(locale, accommodation.code)}`,
          lastModified: new Date(accommodation.updatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.75,
          alternates: {
            languages: {
              fr: `${baseUrl}${getAccommodationDetailPath("fr", accommodation.code)}`,
              en: `${baseUrl}${getAccommodationDetailPath("en", accommodation.code)}`,
            },
          },
        })),
      )
    : [];

  const venueRoutes: MetadataRoute.Sitemap = venues.ok
    ? siteConfig.locales.flatMap((locale) =>
        venues.venues.map((venue) => ({
          url: `${baseUrl}${getVenueDetailPath(locale, venue.code)}`,
          lastModified: new Date(venue.updatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.72,
          alternates: {
            languages: {
              fr: `${baseUrl}${getVenueDetailPath("fr", venue.code)}`,
              en: `${baseUrl}${getVenueDetailPath("en", venue.code)}`,
            },
          },
        })),
      )
    : [];

  const eventServiceRoutes: MetadataRoute.Sitemap = eventServices.ok
    ? siteConfig.locales.flatMap((locale) =>
        eventServices.services.map((service) => ({
          url: `${baseUrl}${getEventServiceDetailPath(locale, service.code)}`,
          lastModified: new Date(service.updatedAt),
          changeFrequency: "monthly" as const,
          priority: 0.7,
          alternates: {
            languages: {
              fr: `${baseUrl}${getEventServiceDetailPath("fr", service.code)}`,
              en: `${baseUrl}${getEventServiceDetailPath("en", service.code)}`,
            },
          },
        })),
      )
    : [];

  return [...staticRoutes, ...accommodationRoutes, ...venueRoutes, ...eventServiceRoutes];
}
