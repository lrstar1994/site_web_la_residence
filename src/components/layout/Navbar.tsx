"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import type { Locale } from "@/lib/i18n/routing";

type NavbarProps = {
  locale: Locale;
  navItems: {
    key: string;
    label: string;
    href: string;
  }[];
  reservationUrl: string;
  labels: {
    logoAlt: string;
    reservation: string;
    languageName: string;
    menuOpen: string;
    menuClose: string;
    primaryNavigation: string;
  };
};

function normalizePathname(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

export function Navbar({
  locale,
  navItems,
  reservationUrl,
  labels,
}: NavbarProps) {
  const pathname = usePathname();
  const normalizedPathname = normalizePathname(pathname);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="navbar nav-scrolled"
      id="mainNavbar"
      aria-label={labels.primaryNavigation}
    >
      <div className="logo">
        <Link
          href={locale === "fr" ? "/fr" : "/en"}
          className="logo-image-link"
          aria-label="La Résidence Ankerana"
          onClick={() => setIsOpen(false)}
        >
          <Image
            src="/logo_la_residence_ankerana_transparent.png"
            alt={labels.logoAlt}
            width={180}
            height={76}
            priority
            className="h-11 w-auto sm:h-14"
          />
        </Link>
      </div>

      <button
        className={isOpen ? "menu-toggle is-active" : "menu-toggle"}
        type="button"
        aria-controls="nav-links"
        aria-expanded={isOpen}
        aria-label={isOpen ? labels.menuClose : labels.menuOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      <ul
        className={isOpen ? "nav-links active" : "nav-links"}
        id="nav-links"
        role="list"
      >
        {navItems.map((item) => {
          const normalizedHref = normalizePathname(item.href);
          const isActive =
            normalizedPathname === normalizedHref ||
            (normalizedHref !== `/${locale}` &&
              normalizedPathname.startsWith(`${normalizedHref}/`));

          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={isActive ? "active" : undefined}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="mobile-lang-container">
          <LanguageSwitcher
            locale={locale}
            currentLabel={locale.toUpperCase()}
            currentLanguageName={labels.languageName}
            variant="mobile"
            onNavigate={() => setIsOpen(false)}
          />
        </li>
        <li className="mobile-reserve-item">
          <a
            href={reservationUrl}
            className="btn-reservation-mobile"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
          >
            {labels.reservation}
          </a>
        </li>
      </ul>

      <div className="navbar-right desktop-only">
        <LanguageSwitcher
          locale={locale}
          currentLabel={locale.toUpperCase()}
          currentLanguageName={labels.languageName}
        />
        <a
          href={reservationUrl}
          className="btn-reservation"
          target="_blank"
          rel="noopener noreferrer"
        >
          {labels.reservation}
        </a>
      </div>
    </nav>
  );
}
