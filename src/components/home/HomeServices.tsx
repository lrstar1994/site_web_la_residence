import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { SHOP_ENABLED } from "@/config/features";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type HomeServicesProps = {
  locale: Locale;
};

const serviceKeys = [
  "hebergement",
  "restaurant",
  "salles",
  "evenements",
  ...(SHOP_ENABLED ? (["boutique"] as const) : []),
] as const;

export async function HomeServices({ locale }: HomeServicesProps) {
  const t = await getTranslations({ locale, namespace: "home.services" });
  const routes = new Map(
    siteConfig.primaryRoutes.map((route) => [route.key, route.paths[locale]]),
  );

  return (
    <section id="prestations" aria-labelledby="prestations-title">
      <div className="section-header">
        <p className="section-eyebrow">{t("eyebrow")}</p>
        <h2 id="prestations-title">{t("title")}</h2>
      </div>
      <div className="prestations-grid">
        {serviceKeys.map((key) => {
          const isShop = key === "boutique";
          const href = routes.get(key) ?? siteConfig.homeRoute.paths[locale];

          return (
            <article
              className={isShop ? "service-card boutique-special" : "service-card"}
              key={key}
            >
              <h3>
                <span aria-hidden="true">{t(`items.${key}.visible_title`)}</span>
                <span className="sr-only">{t(`items.${key}.seo_title`)}</span>
              </h3>
              <p>{t(`items.${key}.description`)}</p>
              <Link href={href} className={isShop ? "btn-shop" : "card-link"}>
                {t(`items.${key}.cta`)} <span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
