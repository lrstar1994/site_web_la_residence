import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";

type AccommodationIntroProps = {
  locale: Locale;
};

const indicatorKeys = ["options", "surface", "capacity"] as const;

export async function AccommodationIntro({ locale }: AccommodationIntroProps) {
  const t = await getTranslations({
    locale,
    namespace: "accommodationPage.intro",
  });

  return (
    <section className="rooms-intro-modern" aria-labelledby="accommodation-intro-title">
      <div className="intro-grid">
        <div className="intro-text-side">
          <span className="lux-subtitle">{t("label")}</span>
          <h2 id="accommodation-intro-title">{t("title")}</h2>
        </div>
        <div className="intro-desc-side">
          <div className="desc-content">
            <p>{t("description")}</p>
            <div className="intro-features" aria-label={t("indicators_label")}>
              {indicatorKeys.map((key) => (
                <div className="feature-item" key={key}>
                  <span className="feature-val">{t(`indicators.${key}.value`)}</span>
                  <span className="feature-lab">{t(`indicators.${key}.label`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
