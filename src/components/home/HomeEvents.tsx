import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type HomeEventsProps = {
  locale: Locale;
};

export async function HomeEvents({ locale }: HomeEventsProps) {
  const t = await getTranslations({ locale, namespace: "home.events" });
  const route = siteConfig.primaryRoutes.find(
    (item) => item.key === "evenements",
  );

  return (
    <section className="events-loft" aria-labelledby="home-events-title">
      <div className="loft-container">
        <div className="loft-text-side">
          <h2 className="loft-title" id="home-events-title">
            <em>{t("title")}</em>
          </h2>
          <div className="loft-divider" aria-hidden="true" />
          <p className="loft-description">{t("description")}</p>
          <Link
            href={route?.paths[locale] ?? siteConfig.homeRoute.paths[locale]}
            className="loft-cta"
          >
            <span className="cta-circle" aria-hidden="true">
              →
            </span>
            <span className="cta-label">{t("cta")}</span>
          </Link>
        </div>
        <div className="loft-image-side">
          <div className="frame-container">
            <Image
              src="/brunch et fete.JPG"
              alt={t("image_alt")}
              width={760}
              height={520}
              sizes="(max-width: 1024px) 90vw, 52vw"
              className="img-loft"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
