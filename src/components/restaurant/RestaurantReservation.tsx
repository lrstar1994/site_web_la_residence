import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type RestaurantReservationProps = {
  locale: Locale;
};

export async function RestaurantReservation({ locale }: RestaurantReservationProps) {
  const t = await getTranslations({
    locale,
    namespace: "restaurantPage.reservation",
  });

  return (
    <section
      className="reservation-premium"
      id="reservation"
      aria-labelledby="restaurant-reservation-title"
    >
      <div className="reservation-container">
        <div className="reservation-visual">
          <Image
            src="/30-08-24 268.jpg"
            alt={t("image_alt")}
            width={900}
            height={620}
            sizes="(max-width: 992px) 100vw, 50vw"
          />
          <div className="visual-overlay" aria-hidden="true" />
          <div className="visual-caption">
            <span className="caption-subtitle">{t("caption_label")}</span>
            <p className="caption-title">{t("caption_title")}</p>
          </div>
        </div>
        <div className="reservation-info">
          <div className="info-content">
            <span className="lux-tag">{t("label")}</span>
            <h2 id="restaurant-reservation-title">{t("title")}</h2>
            <p className="intro-text">{t("description")}</p>
            <div className="contact-grid">
              <div className="contact-item">
                <div className="icon-circle" aria-hidden="true">
                  tel
                </div>
                <div className="text">
                  <span className="label">{t("phone_label")}</span>
                  <a href={`tel:${siteConfig.contact.phoneHref}`}>
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </div>
              </div>
              <div className="contact-item">
                <div className="icon-circle" aria-hidden="true">
                  @
                </div>
                <div className="text">
                  <span className="label">{t("email_label")}</span>
                  <a href={`mailto:${siteConfig.contact.email}`}>
                    {siteConfig.contact.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
