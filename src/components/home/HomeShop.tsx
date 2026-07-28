import { getTranslations } from "next-intl/server";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type HomeShopProps = {
  locale: Locale;
};

export async function HomeShop({ locale }: HomeShopProps) {
  const t = await getTranslations({ locale, namespace: "home.shop" });
  const route = siteConfig.primaryRoutes.find(
    (item) => item.key === "boutique",
  );

  return (
    <section className="shop-intro" aria-labelledby="home-shop-title">
      <div className="shop-container">
        <div className="shop-visual">
          <div className="image-wrapper">
            <Image
              src="/boutique-artisanat.jpg"
              alt={t("image_alt")}
              width={700}
              height={520}
              sizes="(max-width: 1024px) 90vw, 50vw"
              className="shop-section-img"
            />
          </div>
        </div>
        <div className="shop-content">
          <p className="category-label">{t("label")}</p>
          <h2 id="home-shop-title">{t("title")}</h2>
          <div className="gold-divider" aria-hidden="true" />
          <p>{t("description")}</p>
          <Link
            href={route?.paths[locale] ?? siteConfig.homeRoute.paths[locale]}
            className="btn-shop-redirect"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
