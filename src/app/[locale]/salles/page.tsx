import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { VenuesExplorer } from "@/components/venues/VenuesExplorer";
import { VenuesHero } from "@/components/venues/VenuesHero";
import type { Locale } from "@/lib/i18n/routing";
import { getBaseUrl, getVenuesMetadata } from "@/lib/seo/metadata";
import { buildVenuesPageSchema } from "@/lib/seo/schema";
import { getVenues } from "@/lib/venues/get-venues";

type PageProps = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getVenuesMetadata(locale);
}

export default async function SallesPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "venuesPage.catalog",
  });
  const baseUrl = getBaseUrl();
  const venues = await getVenues();
  const stateMessage = !venues.ok
    ? {
        title:
          locale === "fr"
            ? "Nos salles sont momentanément indisponibles."
            : "Our venues are temporarily unavailable.",
        text:
          locale === "fr"
            ? "Veuillez réessayer un peu plus tard."
            : "Please try again later.",
      }
    : venues.cards.length === 0
      ? {
          title:
            locale === "fr"
              ? "Aucune salle n’est disponible pour le moment."
              : "No venue is currently available.",
          text: "",
        }
      : null;

  return (
    <main className="page-venues">
      <VenuesHero locale={locale} />
      <section
        className="rooms-catalog-section many-rooms"
        aria-labelledby="venues-catalog-title"
      >
        <div className="container">
          <div className="section-header">
            <p className="subtitle">{t("eyebrow")}</p>
            <h2 id="venues-catalog-title">{t("title")}</h2>
          </div>
          {stateMessage ? (
            <section className="admin-news-empty" role="status">
              <h2>{stateMessage.title}</h2>
              {stateMessage.text ? <p>{stateMessage.text}</p> : null}
            </section>
          ) : (
            <VenuesExplorer
              venues={venues.cards}
              locale={locale}
              labels={{
                previous: t("previous"),
                next: t("next"),
                maxCapacity: t("max_capacity"),
                details: t("details"),
                detailsPrefix: t("details_prefix"),
                detailsSuffix: t("details_suffix"),
                modal: {
                  close: t("modal.close"),
                  previous: t("modal.previous"),
                  next: t("modal.next"),
                  thumbnails: t("modal.thumbnails"),
                  setupsTitle: t("modal.setups_title"),
                  area: t("modal.area"),
                  capacity: t("modal.capacity"),
                },
              }}
            />
          )}
        </div>
      </section>
      <JsonLd data={buildVenuesPageSchema(baseUrl, locale, venues.ok ? venues.venues : [])} />
    </main>
  );
}
