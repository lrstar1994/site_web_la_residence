import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { RestaurantMenuExplorer } from "@/components/restaurant/RestaurantMenuExplorer";
import { RestaurantReservation } from "@/components/restaurant/RestaurantReservation";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Locale } from "@/lib/i18n/routing";
import { getRestaurantMenus } from "@/lib/restaurant/get-restaurant-menus";
import { getBaseUrl, getRestaurantMetadata } from "@/lib/seo/metadata";
import { buildRestaurantPageSchema } from "@/lib/seo/schema";

type PageProps = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getRestaurantMetadata(locale);
}

export default async function RestaurantPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "restaurantPage.menus",
  });
  const baseUrl = getBaseUrl();
  const menus = await getRestaurantMenus();
  const stateMessage = !menus.ok
    ? {
        title:
          locale === "fr"
            ? "Nos cartes sont momentanément indisponibles."
            : "Our menus are temporarily unavailable.",
        text:
          locale === "fr"
            ? "Veuillez réessayer un peu plus tard."
            : "Please try again later.",
      }
    : menus.cards.length === 0
      ? {
          title:
            locale === "fr"
              ? "Aucune carte n’est disponible pour le moment."
              : "No menu is currently available.",
          text: "",
        }
      : null;

  return (
    <div className="page-restaurant">
      <RestaurantHero locale={locale} />
      <section
        className="menus-section"
        aria-labelledby="restaurant-menus-title"
      >
        <div className="container">
          <div className="section-header center">
            <p className="subtitle">{t("eyebrow")}</p>
            <h2 id="restaurant-menus-title">{t("title")}</h2>
            <p className="description">{t("description")}</p>
          </div>
          {stateMessage ? (
            <section className="admin-news-empty" role="status">
              <h2>{stateMessage.title}</h2>
              {stateMessage.text ? <p>{stateMessage.text}</p> : null}
            </section>
          ) : (
            <RestaurantMenuExplorer
              categories={menus.categories}
              menus={menus.cards}
              locale={locale}
              labels={{
                tabsLabel: t("tabs_label"),
                filters: { all: t("tabs.all") },
                imageCountSingular: t("image_count_singular"),
                imageCountPlural: t("image_count_plural"),
                viewSingle: t("view_single"),
                viewMultiple: t("view_multiple"),
                modal: {
                  close: t("modal.close"),
                  previous: t("modal.previous"),
                  next: t("modal.next"),
                  thumbnails: t("modal.thumbnails"),
                },
              }}
            />
          )}
        </div>
      </section>
      <RestaurantReservation locale={locale} />
      <JsonLd data={buildRestaurantPageSchema(baseUrl, locale, menus.ok ? menus.menus : [])} />
    </div>
  );
}
