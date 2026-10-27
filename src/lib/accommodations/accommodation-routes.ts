import type { Locale } from "@/lib/i18n/routing";

export function getAccommodationListPath(locale: Locale) {
  return locale === "en" ? "/en/accommodation" : "/fr/hebergement";
}

export function getAccommodationDetailPath(locale: Locale, code: string) {
  return `${getAccommodationListPath(locale)}/${encodeURIComponent(code)}`;
}
