// import { getTranslations } from "next-intl/server";
// import { EventServicesGrid } from "@/components/events/EventServicesGrid";
// import type { Locale } from "@/lib/i18n/routing";
// import type { EventService } from "@/types/event-service";

// type EventsShowcaseProps = {
//   locale: Locale;
//   services: EventService[];
//   state?: "ready" | "empty" | "error";
// };

// export async function EventsShowcase({
//   locale,
//   services,
//   state = "ready",
// }: EventsShowcaseProps) {
//   const t = await getTranslations({
//     locale,
//     namespace: "eventsPage.showcase",
//   });
//   const message =
//     state === "error"
//       ? locale === "fr"
//         ? "Nos prestations sont momentanément indisponibles. Veuillez réessayer un peu plus tard."
//         : "Our event services are temporarily unavailable. Please try again later."
//       : locale === "fr"
//         ? "Aucune prestation événementielle n’est disponible pour le moment."
//         : "No event service is currently available.";

//   return (
//     <section
//       className="event-showcase-section"
//       aria-labelledby="events-showcase-title"
//     >
//       <div className="container">
//         <div className="section-intro">
//           <p className="subtitle">{t("label")}</p>
//           <h2 id="events-showcase-title">{t("title")}</h2>
//           <div className="title-separator" aria-hidden="true" />
//         </div>
//         {state === "ready" ? (
//           <EventServicesGrid
//             locale={locale}
//             services={services}
//             labels={{
//               viewDetails: t("viewDetails"),
//               requestQuote: t("requestQuote"),
//               closeDetails: t("closeDetails"),
//               previousImage: t("previousImage"),
//               nextImage: t("nextImage"),
//               thumbnail: t("thumbnail"),
//             }}
//           />
//         ) : (
//           <div className="events-grid" role={state === "error" ? "alert" : "status"}>
//             <article className="event-card">
//               <div className="event-card-content">
//                 <h3>{state === "error" ? "Information" : t("title")}</h3>
//                 <p>{message}</p>
//               </div>
//             </article>
//           </div>
//         )}
//       </div>
//     </section>
//   );
// }

import { getTranslations } from "next-intl/server";

import { EventMomentsCarousel } from "@/components/events/EventMomentsCarousel";
import { EventServicesGrid } from "@/components/events/EventServicesGrid";
import type { PublicEventMomentImage } from "@/lib/events/get-event-moments";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventsShowcaseProps = {
  locale: Locale;
  services: EventService[];
  moments: PublicEventMomentImage[];
  state?: "ready" | "empty" | "error";
};

export async function EventsShowcase({
  locale,
  services,
  moments,
  state = "ready",
}: EventsShowcaseProps) {
  const t = await getTranslations({
    locale,
    namespace: "eventsPage.showcase",
  });

  const message =
    state === "error"
      ? locale === "fr"
        ? "Nos prestations sont momentanément indisponibles. Veuillez réessayer un peu plus tard."
        : "Our event services are temporarily unavailable. Please try again later."
      : locale === "fr"
        ? "Aucune prestation événementielle n’est disponible pour le moment."
        : "No event service is currently available.";

  return (
    <section
      className="event-showcase-section"
      aria-labelledby="events-showcase-title"
    >
      <div className="container">
        <div className="section-intro">
          <p className="subtitle">
            {t("label")}
          </p>

          <h2 id="events-showcase-title">
            {t("title")}
          </h2>

          <div
            className="title-separator"
            aria-hidden="true"
          />
        </div>

        {moments.length > 0 ? (
          <EventMomentsCarousel
            images={moments}
            locale={locale}
          />
        ) : null}

        {state === "ready" ? (
          <EventServicesGrid
            locale={locale}
            services={services}
            labels={{
              viewDetails: t("viewDetails"),
              requestQuote: t("requestQuote"),
              closeDetails: t("closeDetails"),
              previousImage: t("previousImage"),
              nextImage: t("nextImage"),
              thumbnail: t("thumbnail"),
            }}
          />
        ) : (
          <div
            className="events-grid"
            role={
              state === "error"
                ? "alert"
                : "status"
            }
          >
            <article className="event-card">
              <div className="event-card-content">
                <h3>
                  {state === "error"
                    ? "Information"
                    : t("title")}
                </h3>

                <p>{message}</p>
              </div>
            </article>
          </div>
        )}
      </div>
    </section>
  );
}