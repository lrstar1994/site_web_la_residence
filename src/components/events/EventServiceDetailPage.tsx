import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { EventServiceLightboxGallery } from "@/components/events/EventServiceLightboxGallery";
import {
  getEventServiceDetailPath,
  getEventServiceQuotePath,
  getEventServicesListPath,
} from "@/lib/events/event-service-routes";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventServiceDetailLabels = {
  breadcrumbRoot: string;
  requestQuote: string;
  description: string;
  noImages: string;
  galleryEyebrow: string;
  galleryTitle: string;
  viewAllPhotos: string;
  closeGallery: string;
  previousImage: string;
  nextImage: string;
  otherEyebrow: string;
  otherTitle: string;
  discoverService: string;
};

type EventServiceDetailPageProps = {
  service: EventService;
  relatedServices: EventService[];
  locale: Locale;
  labels: EventServiceDetailLabels;
};

export function EventServiceDetailPage({
  service,
  relatedServices,
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
  const presentationImage =
    images.find((image) => image.id !== coverImage?.id) ?? coverImage;

  return (
    <main className="page-evenement event-service-detail-page">
      <section className="event-service-detail-hero" aria-labelledby="event-service-detail-title">
        {coverImage ? (
          <Image
            src={coverImage.imagePath}
            alt={coverImage.alt[locale]}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
          />
        ) : null}
        <div className="event-service-detail-hero-overlay" />
        <div className="event-service-detail-shell event-service-detail-hero-content">
          <p>{labels.breadcrumbRoot}</p>
          <h1 id="event-service-detail-title">{service.title[locale]}</h1>
          <span aria-hidden="true" />
        </div>
      </section>

      <div className="event-service-detail-shell">
        <nav className="event-service-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href={getEventServicesListPath(locale)}>{labels.breadcrumbRoot}</Link>
          <span aria-hidden="true">›</span>
          <span>{service.title[locale]}</span>
        </nav>

        <section className="event-service-detail-intro" aria-labelledby="event-service-description">
          <div className="event-service-detail-copy">
            <p className="event-service-detail-eyebrow">{labels.description}</p>
            <h2 id="event-service-description">{service.title[locale]}</h2>
            <p>{service.description[locale]}</p>
            <Link
              className="event-service-detail-cta"
              href={getEventServiceQuotePath(locale, service.code)}
            >
              <CalendarDays aria-hidden="true" size={20} strokeWidth={1.8} />
              <span>{labels.requestQuote}</span>
              <ArrowRight aria-hidden="true" size={19} strokeWidth={1.8} />
            </Link>
          </div>
          {presentationImage ? (
            <div className="event-service-detail-presentation-image">
              <Image
                src={presentationImage.imagePath}
                alt={presentationImage.alt[locale]}
                width={760}
                height={620}
                sizes="(max-width: 800px) 100vw, 48vw"
              />
            </div>
          ) : null}
        </section>
      </div>

      {images.length > 0 ? (
        <EventServiceLightboxGallery
          images={images}
          locale={locale}
          serviceTitle={service.title[locale]}
          labels={{
            eyebrow: labels.galleryEyebrow,
            title: labels.galleryTitle,
            viewAll: labels.viewAllPhotos,
            close: labels.closeGallery,
            previous: labels.previousImage,
            next: labels.nextImage,
          }}
        />
      ) : (
        <section className="event-service-gallery-section">
          <div className="event-service-detail-shell">
            <p className="event-service-detail-empty">{labels.noImages}</p>
          </div>
        </section>
      )}

      {relatedServices.length > 0 ? (
        <section className="event-service-related" aria-labelledby="event-service-related-title">
          <div className="event-service-detail-shell">
            <header className="event-service-related-heading">
              <p className="event-service-detail-eyebrow">{labels.otherEyebrow}</p>
              <h2 id="event-service-related-title">{labels.otherTitle}</h2>
            </header>
            <div className="event-service-related-grid">
              {relatedServices.map((relatedService) => {
                const relatedImage =
                  relatedService.images.find((image) => image.isCover) ??
                  relatedService.images[0] ??
                  null;

                return (
                  <article className="event-service-related-card" key={relatedService.id}>
                    {relatedImage ? (
                      <div className="event-service-related-image">
                        <Image
                          src={relatedImage.imagePath}
                          alt={relatedImage.alt[locale]}
                          fill
                          sizes="(max-width: 680px) 100vw, 24vw"
                        />
                      </div>
                    ) : null}
                    <div className="event-service-related-body">
                      <h3>{relatedService.title[locale]}</h3>
                      <p>{relatedService.description[locale]}</p>
                      <Link href={getEventServiceDetailPath(locale, relatedService.code)}>
                        <span>{labels.discoverService}</span>
                        <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
