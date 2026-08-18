import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SHOP_ENABLED } from "@/config/features";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type FooterProps = {
  locale: Locale;
};

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations({ locale, namespace: "common" });
  const layout = await getTranslations({ locale, namespace: "layout" });
  const navigationRoutes = siteConfig.primaryRoutes.filter(
    (route) => SHOP_ENABLED || route.key !== "boutique",
  );
  const legalLinks = ["legal", "privacy", "terms"] as const;

  return (
    <footer className="footer-luxe" role="contentinfo">
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col footer-about">
              <div className="footer-logo">
                <span className="main-logo">{layout("brand.main")}</span>
                <span className="sub-logo">{layout("brand.sub")}</span>
              </div>
              <p className="footer-tagline">{layout("footer.tagline")}</p>
              <div
                className="footer-socials"
                aria-label={layout("footer.socials")}
              >
                  <a
                    href={siteConfig.socialLinks.facebook}
                    aria-label="Facebook"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="currentColor"
                        d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z"
                      />
                    </svg>
                  </a>

                  <a
                    href={siteConfig.socialLinks.instagram}
                    aria-label="Instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="currentColor"
                        d="M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm-.2 2A3.6 3.6 0 0 0 4 7.6v8.8A3.6 3.6 0 0 0 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6A3.6 3.6 0 0 0 16.4 4H7.6Zm9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                      />
                    </svg>
                  </a>

                  <a
                    href={siteConfig.socialLinks.whatsapp}
                    aria-label="WhatsApp"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path
                        fill="currentColor"
                        d="M12.04 2a9.84 9.84 0 0 0-8.45 14.88L2 22l5.25-1.55A9.96 9.96 0 1 0 12.04 2Zm0 17.92a8 8 0 0 1-4.08-1.12l-.29-.17-3.12.92.94-3.04-.19-.31A7.92 7.92 0 1 1 12.04 19.92Zm4.35-5.93c-.24-.12-1.41-.7-1.63-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.41-.58 1.61-1.13.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
                      />
                    </svg>
                  </a>
                </div>
              </div>

            <div className="footer-col">
              <h2 className="footer-title">{layout("footer.navigation")}</h2>
              <ul className="footer-links">
                {navigationRoutes.map((route) => (
                  <li key={route.key}>
                    <Link href={route.paths[locale]}>
                      {t(`routes.${route.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h2 className="footer-title">{layout("footer.services")}</h2>
              <ul className="footer-links">
                {siteConfig.footerServices.map((item) => (
                  <li key={item}>
                    <Link href={siteConfig.homeRoute.paths[locale]}>
                      {layout(`footer.serviceItems.${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-col">
              <h2 className="footer-title">{layout("footer.contact")}</h2>
              <div className="contact-info">
                <p>
                  <strong>{layout("footer.addressLabel")}</strong>
                  <br />
                  {siteConfig.contact.addressLine1}
                  <br />
                  {t("footer_location")}
                </p>
                <p>
                  <strong>{layout("footer.reservationsLabel")}</strong>
                  <br />
                  <a href={`tel:${siteConfig.contact.phoneHref}`}>
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </p>
                <p>
                  <strong>{layout("footer.emailLabel")}</strong>
                  <br />
                  <a href={`mailto:${siteConfig.contact.email}`}>
                    {siteConfig.contact.email}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p className="copyright">{layout("footer.copyright")}</p>
          {/* <div className="legal-links">
            {legalLinks.map((item) => (
              <Link key={item} href={siteConfig.homeRoute.paths[locale]}>
                {layout(`footer.legal.${item}`)}
              </Link>
            ))}
          </div> */}
        </div>
      </div>
    </footer>
  );
}
