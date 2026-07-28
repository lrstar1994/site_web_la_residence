import { getTranslations } from "next-intl/server";
import Image from "next/image";
import type { Locale } from "@/lib/i18n/routing";

type RestaurantHeroProps = {
  locale: Locale;
};

const timingItems = [
  {
    key: "breakfast",
    image: "/breakfast.jpg",
  },
  {
    key: "dinner",
    image: "/ChatGPT Image 23 juil. 2026, 15_59_20.PNG",
  },
  {
    key: "lunch",
    image: "/ChatGPT Image 23 juil. 2026, 16_00_42.PNG",
  },
  {
    key: "atmosphere",
    image: "/30-08-24 197.JPG",
  },
] as const;

export async function RestaurantHero({ locale }: RestaurantHeroProps) {
  const t = await getTranslations({
    locale,
    namespace: "restaurantPage.hero",
  });

  return (
    <section className="restaurant-gallery" aria-labelledby="restaurant-title">
      <div className="gallery-grid">
        <div className="gallery-item large main-title">
          <div className="text-overlay">
            <p className="pre-title">{t("eyebrow")}</p>
            <h1 id="restaurant-title">{t("title")}</h1>
          </div>
          <Image
            src="/30-08-24 276.JPG"
            alt={t("main_alt")}
            width={960}
            height={700}
            sizes="(max-width: 1024px) 90vw, 48vw"
            priority
          />
        </div>
        {timingItems.map((item) => (
          <div className="gallery-item" key={item.key}>
            <div className="timing-overlay">
              <p className="timing-title">{t(`timings.${item.key}.title`)}</p>
              <p>{t(`timings.${item.key}.value`)}</p>
            </div>
            <Image
              src={item.image}
              alt={t(`timings.${item.key}.alt`)}
              width={520}
              height={360}
              sizes="(max-width: 1024px) 45vw, 24vw"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
