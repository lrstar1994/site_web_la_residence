import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { HomeAccommodation } from "@/components/home/HomeAccommodation";
import { HomeEvents } from "@/components/home/HomeEvents";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeRestaurant } from "@/components/home/HomeRestaurant";
import { HomeServices } from "@/components/home/HomeServices";
import { HomeVenues } from "@/components/home/HomeVenues";
import { SHOP_ENABLED } from "@/config/features";
import type { Locale } from "@/lib/i18n/routing";
import { getBaseUrl, getHomeMetadata } from "@/lib/seo/metadata";
import { buildHomepageSchema } from "@/lib/seo/schema";

type HomePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return getHomeMetadata(locale);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const baseUrl = getBaseUrl();
  const HomeShop = SHOP_ENABLED
    ? (await import("@/components/home/HomeShop")).HomeShop
    : null;

  return (
    <>
      <HomeHero
        eyebrow={t("hero.eyebrow")}
        title={t("hero.title")}
        description={t("hero.description")}
        cta={t("hero.cta")}
        imageAlt={t("hero.image_alt")}
      />
      <HomeServices locale={locale} />
      <HomeRestaurant locale={locale} />
      <HomeAccommodation locale={locale} />
      <HomeVenues locale={locale} />
      <HomeEvents locale={locale} />
      {HomeShop ? <HomeShop locale={locale} /> : null}
      <JsonLd data={buildHomepageSchema(baseUrl, locale)} />
    </>
  );
}
