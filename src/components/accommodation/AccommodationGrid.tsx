import { getTranslations } from "next-intl/server";
import { AccommodationExplorer } from "@/components/accommodation/AccommodationExplorer";
import { siteConfig } from "@/data/site";
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
  const modal = await getTranslations({
    locale,
    namespace: "accommodationPage.modal",
  });
  const whatsappBaseUrl = `https://wa.me/${siteConfig.contact.phoneHref.replace(/\D/g, "")}`;

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
          whatsappBaseUrl={whatsappBaseUrl}
          onlineBookingUrl={siteConfig.reservationUrl[locale]}
          labels={{
            card: {
              from: t("price_from"),
              unit: t("price_unit"),
              details: t("details"),
              detailsPrefix: t("details_prefix"),
            },
            modal: {
              close: modal("close"),
              previousImage: modal("previous_image"),
              nextImage: modal("next_image"),
              galleryLabel: modal("gallery_label"),
              from: modal("price_from"),
              unit: modal("price_unit"),
              highlights: modal("highlights"),
              whatsappButton: modal("whatsapp_button", {
                number: siteConfig.contact.phoneDisplay,
              }),
              bookOnline: modal("book_online"),
              bookOnlineDescription: modal("book_online_description"),
              essentials: modal("essentials"),
              residenceBenefits: modal("residence_benefits"),
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
