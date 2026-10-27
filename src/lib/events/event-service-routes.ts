import type { Locale } from "@/lib/i18n/routing";

export function getEventServicesListPath(locale: Locale) {
  return locale === "en" ? "/en/events" : "/fr/evenements";
}

export function getEventServiceDetailPath(locale: Locale, code: string) {
  return `${getEventServicesListPath(locale)}/${encodeURIComponent(code)}`;
}

export function getEventServiceQuotePath(locale: Locale, code: string) {
  const listPath = getEventServicesListPath(locale);
  return `${listPath}?service=${encodeURIComponent(code)}#event-quote-title`;
}
