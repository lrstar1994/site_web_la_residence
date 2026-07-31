import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type AccommodationHeroProps = {
  locale: Locale;
};

export async function AccommodationHero({ locale }: AccommodationHeroProps) {
  const t = await getTranslations({
    locale,
    namespace: "accommodationPage.hero",
  });

  return (
    <header className="hero-lux" role="banner">
      <div className="hero-lux-outer">
        <div className="hero-lux-content">
          <span className="lux-tag">{t("label")}</span>
          <h1>{t("title")}</h1>
          <div className="lux-divider" aria-hidden="true" />
          <p>{t("description")}</p>
          <a
            className="btn-lux-main"
            href={siteConfig.reservationUrl[locale]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t("cta")}
          </a>
        </div>
        <div className="hero-lux-visual">
          <div className="lux-img-container">
            <Image
              className="lux-img"
              src="/hebergement_la_residence_ankerana.png"
              alt={t("image_alt")}
              width={900}
              height={650}
              sizes="(max-width: 1024px) 90vw, 58vw"
              priority
            />
            <div className="lux-img-overlay" aria-hidden="true" />
          </div>
          <div className="lux-decor-frame" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
