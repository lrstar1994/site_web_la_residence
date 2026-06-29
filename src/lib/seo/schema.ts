import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

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
