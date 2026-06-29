"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
    brandMain: string;
    brandSub: string;
    reservation: string;
    languageName: string;
    menuOpen: string;
    menuClose: string;
    primaryNavigation: string;
  };
};

export function Navbar({
  locale,
  navItems,
  reservationUrl,
  labels,
}: NavbarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 50);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={isScrolled ? "navbar nav-scrolled" : "navbar"}
      id="mainNavbar"
      aria-label={labels.primaryNavigation}
    >
      <div className="logo">
        <Link href={locale === "fr" ? "/fr" : "/en"} className="logo-image-link">
          <span className="main-logo">{labels.brandMain}</span>
          <span className="sub-logo">{labels.brandSub}</span>
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
          const isActive =
            pathname === item.href ||
            (item.href !== `/${locale}` && pathname.startsWith(`${item.href}/`));

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
