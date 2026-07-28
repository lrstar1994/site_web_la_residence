import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type HomeVenuesProps = {
  locale: Locale;
};

export async function HomeVenues({ locale }: HomeVenuesProps) {
  const t = await getTranslations({ locale, namespace: "home.venues" });
  const route = siteConfig.primaryRoutes.find((item) => item.key === "salles");

  return (
    <section className="split-dark-section" aria-labelledby="home-venues-title">
      <div className="split-bg-overlay" aria-hidden="true" />
      <div className="split-container">
        <div className="split-image-block">
          <div className="image-inner">
            <Image
              src="/salle-mosaic-la-residence-ankerana.jpeg"
              alt={t("image_alt")}
              width={720}
              height={430}
              sizes="(max-width: 1024px) 90vw, 58vw"
              className="split-section-img"
            />
          </div>
        </div>
        <div className="split-text-block">
          <div className="text-inner">
            <p className="category-label">{t("label")}</p>
            <h2 id="home-venues-title">{t("title")}</h2>
            <p>{t("description")}</p>
            <Link
              href={route?.paths[locale] ?? siteConfig.homeRoute.paths[locale]}
              className="btn-minimal-gold"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
