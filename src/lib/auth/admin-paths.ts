import type { Locale } from "@/lib/i18n/routing";

export function getAdminPath(locale: Locale) {
  return `/${locale}/admin/hebergements`;
}

export function getAdminLoginPath(locale: Locale) {
  return locale === "fr" ? "/fr/admin/connexion" : "/en/admin/login";
}
