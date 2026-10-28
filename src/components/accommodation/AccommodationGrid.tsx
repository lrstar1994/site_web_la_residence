import { getTranslations } from "next-intl/server";
import { AccommodationExplorer } from "@/components/accommodation/AccommodationExplorer";
import type { Locale } from "@/lib/i18n/routing";
import type { AccommodationCardModel } from "@/types/accommodation";

type AccommodationGridProps = {
  locale: Locale;
  accommodations: AccommodationCardModel[];
  state?: "ready" | "empty" | "error";
};

export async function AccommodationGrid({
  locale,
  accommodations,
  state = "ready",
}: AccommodationGridProps) {
  const t = await getTranslations({
    locale,
    namespace: "accommodationPage.grid",
  });
  return (
    <section
      id="rooms"
      className="accommodation-grid-section"
      aria-labelledby="accommodation-grid-title"
    >
      <div className="section-header-rooms">
        <p className="section-eyebrow">{t("eyebrow")}</p>
        <h2 id="accommodation-grid-title">{t("title")}</h2>
      </div>
      {state === "ready" ? (
        <AccommodationExplorer
          accommodations={accommodations}
          locale={locale}
          labels={{
            card: {
              from: t("price_from"),
              unit: t("price_unit"),
              details: t("details"),
              detailsPrefix: t("details_prefix"),
            },
          }}
        />
      ) : (
        <section className="admin-news-empty" role={state === "error" ? "alert" : "status"}>
          <h2>{locale === "fr" ? "Information" : "Information"}</h2>
          <p>
            {state === "error"
              ? locale === "fr"
                ? "Nos hébergements sont momentanément indisponibles. Veuillez réessayer un peu plus tard."
                : "Our accommodation options are temporarily unavailable. Please try again later."
              : locale === "fr"
                ? "Aucun hébergement n’est disponible pour le moment."
                : "No accommodation option is currently available."}
          </p>
        </section>
      )}
    </section>
  );
}
