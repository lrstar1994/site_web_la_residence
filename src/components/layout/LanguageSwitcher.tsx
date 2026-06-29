"use client";

import { Languages } from "lucide-react";
import type { Locale } from "@/lib/i18n/routing";
import { Link, usePathname } from "@/lib/i18n/navigation";

type LanguageSwitcherProps = {
  locale: Locale;
};

const staticPathnames = [
  "/",
  "/hebergement",
  "/restaurant",
  "/salles",
  "/evenements",
  "/actualites",
  "/boutique",
] as const;

type StaticPathname = (typeof staticPathnames)[number];

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const nextLocale = locale === "fr" ? "en" : "fr";
  const switchHref = staticPathnames.includes(pathname as StaticPathname)
    ? (pathname as StaticPathname)
    : "/";

  return (
    <Link
      href={switchHref}
      locale={nextLocale}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-white/70 text-sm font-medium transition hover:border-accent hover:text-accent"
      aria-label={nextLocale === "fr" ? "Français" : "English"}
      title={nextLocale === "fr" ? "Français" : "English"}
    >
      <Languages aria-hidden="true" size={18} />
    </Link>
  );
}
