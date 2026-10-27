import Image from "next/image";
import Link from "next/link";
import {
  getEventServiceQuotePath,
  getEventServicesListPath,
} from "@/lib/events/event-service-routes";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventServiceDetailLabels = {
  back: string;
  breadcrumbRoot: string;
  gallery: string;
  requestQuote: string;
  description: string;
  noImages: string;
};

type EventServiceDetailPageProps = {
  service: EventService;
  locale: Locale;
  labels: EventServiceDetailLabels;
};

export function EventServiceDetailPage({
  service,
  locale,
  labels,
}: EventServiceDetailPageProps) {
  const images =
    service.images.length > 0
      ? service.images
      : service.imagePath
        ? [
            {
              id: `${service.id}-legacy-image`,
              imagePath: service.imagePath,
              alt: service.imageAlt,
              sortOrder: 0,
              isCover: true,
            },
          ]
        : [];
  const coverImage = images.find((image) => image.isCover) ?? images[0] ?? null;

  return (
    <main className="page-evenement event-service-detail-page">
      <section className="event-service-detail-hero">
        {coverImage ? (
          <Image
            src={coverImage.imagePath}
            alt={coverImage.alt[locale]}
            fill
            priority
            sizes="100vw"
          />
        ) : null}
        <div className="event-service-detail-hero-overlay" />
        <div className="event-service-detail-shell event-service-detail-hero-content">
          <p>{labels.breadcrumbRoot}</p>
          <h1>{service.title[locale]}</h1>
        </div>
      </section>

      <div className="event-service-detail-shell">
        <nav className="event-service-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href={getEventServicesListPath(locale)}>{labels.breadcrumbRoot}</Link>
          <span aria-hidden="true">/</span>
          <span>{service.title[locale]}</span>
        </nav>

        <section className="event-service-detail-intro" aria-labelledby="event-service-description">
          <div>
            <p className="section-eyebrow">{labels.description}</p>
            <h2 id="event-service-description">{service.title[locale]}</h2>
            <p>{service.description[locale]}</p>
          </div>
          <Link
            className="event-service-detail-cta"
            href={getEventServiceQuotePath(locale, service.code)}
          >
            {labels.requestQuote}
          </Link>
        </section>

        <section className="event-service-detail-gallery" aria-labelledby="event-service-gallery">
          <div className="event-service-detail-section-heading">
            <p className="section-eyebrow">{labels.gallery}</p>
            <h2 id="event-service-gallery">{labels.gallery}</h2>
          </div>

          {images.length > 0 ? (
            <div className="event-service-detail-gallery-grid">
              {images.map((image) => (
                <figure key={image.id}>
                  <Image
                    src={image.imagePath}
                    alt={image.alt[locale]}
                    fill
                    sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                  />
                </figure>
              ))}
            </div>
          ) : (
            <p className="event-service-detail-empty">{labels.noImages}</p>
          )}
        </section>

        <footer className="event-service-detail-footer">
          <Link href={getEventServicesListPath(locale)}>{labels.back}</Link>
        </footer>
      </div>
    </main>
  );
}
