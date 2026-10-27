import type { Locale } from "@/lib/i18n/routing";

export function getCanonicalVenueCode(code: string) {
  return code;
}

export function isVenueAliasCode(code: string) {
  return getCanonicalVenueCode(code) !== code;
}

export function getPhysicalVenueMemberCodes(code: string) {
  return [getCanonicalVenueCode(code)];
}

export function getVenueListPath(locale: Locale) {
  return locale === "en" ? "/en/venues" : "/fr/salles";
}

export function getVenueDetailPath(locale: Locale, code: string) {
  return `${getVenueListPath(locale)}/${encodeURIComponent(getCanonicalVenueCode(code))}`;
}
