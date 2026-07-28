import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/routing";

type EventsHeroProps = {
  locale: Locale;
};

export async function EventsHero({ locale }: EventsHeroProps) {
  const t = await getTranslations({
    locale,
    namespace: "eventsPage.hero",
  });
  const venuesHref = locale === "fr" ? "/fr/salles" : "/en/venues";

  return (
    <section className="hero-event" aria-labelledby="events-title">
      <div className="hero-bg-parallax">
        <Image
          className="hero-img"
          src="/evenements.jpeg"
          alt={t("image_alt")}
          fill
          sizes="100vw"
          priority
        />
      </div>
      <div className="hero-overlay" />
      <div className="hero-card-content">
        <p className="lux-label">{t("label")}</p>
        <h1 id="events-title">
          <span>{t("title_line_1")}</span>
          <span className="gold-script">{t("title_line_2")}</span>
        </h1>
        <p>{t("description")}</p>
        <div className="hero-actions">
          <Link className="btn-white-outline" href={venuesHref}>
            {t("venues_cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
