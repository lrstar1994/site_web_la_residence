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
              <div className="footer-socials" aria-label={layout("footer.socials")}>
                <a href={siteConfig.socialLinks.facebook} aria-label="Facebook">
                  f
                </a>
                <a href={siteConfig.socialLinks.instagram} aria-label="Instagram">
                  ig
                </a>
                <a href={siteConfig.socialLinks.whatsapp} aria-label="WhatsApp">
                  wa
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
