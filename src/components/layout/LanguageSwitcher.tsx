"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type LanguageSwitcherProps = {
  locale: Locale;
  currentLabel: string;
  currentLanguageName: string;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
};

function getAlternateHref(pathname: string, locale: Locale) {
  const nextLocale = locale === "fr" ? "en" : "fr";
  const route = siteConfig.seoRoutes.find(
    (item) => item.paths[locale] === pathname,
  );

  return route?.paths[nextLocale] ?? siteConfig.homeRoute.paths[nextLocale];
}

export function LanguageSwitcher({
  locale,
  currentLabel,
  currentLanguageName,
  variant = "desktop",
  onNavigate,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const nextLocale = locale === "fr" ? "en" : "fr";
  const alternateHref = getAlternateHref(pathname, locale);
  const alternateLabel = nextLocale.toUpperCase();
  const alternateName = nextLocale === "fr" ? "Francais" : "English";

  if (variant === "mobile") {
    return (
      <div className="mobile-lang" aria-label="Language">
        <span className="lang-link active" aria-current="true">
          {currentLabel}
        </span>
        <span className="lang-separator" aria-hidden="true">
          /
        </span>
        <Link
          className="lang-link"
          href={alternateHref}
          hrefLang={nextLocale}
          onClick={onNavigate}
        >
          {alternateLabel}
        </Link>
      </div>
    );
  }

  return (
    <details className="lang-switcher">
      <summary>
        <span>{currentLabel}</span>
        <span className="lang-current-label">{currentLanguageName}</span>
      </summary>
      <div className="lang-menu">
        <Link
          className="lang-link"
          href={alternateHref}
          hrefLang={nextLocale}
          onClick={onNavigate}
        >
          <span>{alternateLabel}</span>
          <span>{alternateName}</span>
        </Link>
      </div>
    </details>
  );
}
