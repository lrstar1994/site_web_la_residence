import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type HomeRestaurantProps = {
  locale: Locale;
};

const featureKeys = ["feature_1", "feature_2", "feature_3"] as const;

export async function HomeRestaurant({ locale }: HomeRestaurantProps) {
  const t = await getTranslations({ locale, namespace: "home.restaurant" });
  const restaurantRoute = siteConfig.primaryRoutes.find(
    (route) => route.key === "restaurant",
  );

  return (
    <section className="menu-highlight" aria-labelledby="home-restaurant-title">
      <div className="menu-content">
        <p className="subtitle">{t("eyebrow")}</p>
        <h2 id="home-restaurant-title">
          <span aria-hidden="true">{t("visible_title")}</span>
          <span className="sr-only">{t("seo_title")}</span>
        </h2>
        <p className="description">{t("description")}</p>
        <ul className="menu-features">
          {featureKeys.map((key) => (
            <li key={key}>{t(`features.${key}`)}</li>
          ))}
        </ul>
        <Link
          href={restaurantRoute?.paths[locale] ?? siteConfig.homeRoute.paths[locale]}
          className="btn-discover"
        >
          {t("cta")}
        </Link>
      </div>
      <div className="menu-illustration">
        <div className="image-wrapper">
          <Image
            src="/accueil privilege.jpg"
            alt={t("image_alt")}
            width={720}
            height={520}
            sizes="(max-width: 1024px) 90vw, 45vw"
            className="restaurant-highlight-img"
          />
          <div className="image-border" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
