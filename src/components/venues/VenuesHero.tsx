import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/routing";

type VenuesHeroProps = {
  locale: Locale;
};

export async function VenuesHero({ locale }: VenuesHeroProps) {
  const t = await getTranslations({
    locale,
    namespace: "venuesPage.hero",
  });

  return (
    <section className="hero-salles" aria-labelledby="venues-title">
      <div className="hero-image-container" aria-hidden="true">
        <Image
          className="hero-img"
          src="/PISCINE.png"
          alt={t("image_alt")}
          fill
          sizes="100vw"
          priority
        />
        <div className="hero-overlay" />
      </div>
      <div className="hero-content">
        <div className="welcome-text">
          <span className="line" aria-hidden="true" />
          <p className="text-upper">{t("label")}</p>
          <span className="line" aria-hidden="true" />
        </div>
        <h1 id="venues-title">{t("title")}</h1>
        <p className="hero-subtitle">{t("description")}</p>
      </div>
      <div className="scroll-indicator" aria-hidden="true">
        <div className="mouse" />
      </div>
    </section>
  );
}
