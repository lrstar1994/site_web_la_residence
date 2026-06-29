import type { MetadataRoute } from "next";
import { siteConfig } from "@/data/site";
import { getBaseUrl } from "@/lib/seo/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
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

  const futureDynamicRoutes: MetadataRoute.Sitemap = [];

  return [...staticRoutes, ...futureDynamicRoutes];
}
