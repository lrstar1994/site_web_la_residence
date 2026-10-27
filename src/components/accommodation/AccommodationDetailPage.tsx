import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import { getAccommodationDetailPath } from "@/lib/accommodations/accommodation-routes";
import type { Locale } from "@/lib/i18n/routing";
import { AccommodationFeatureIcon } from "@/components/accommodation/AccommodationFeatureIcon";
import { AccommodationLightboxGallery } from "@/components/accommodation/AccommodationLightboxGallery";
import type { Accommodation, AccommodationFeature } from "@/types/accommodation";

type AccommodationDetailLabels = {
  back: string;
  gallery: string;
  noImages: string;
  breadcrumbRoot: string;
  viewPhotos: string;
  viewPhotosCount: string;
  closeGallery: string;
  previousImage: string;
  nextImage: string;
  mainInfo: string;
  surface: string;
  capacity: string;
  guests: string;
  priceFrom: string;
  priceUnit: string;
  descriptionEyebrow: string;
  descriptionTitle: string;
  features: string;
  booking: string;
  bookingText: string;
  bookOnline: string;
  whatsapp: string;
  related: string;
  relatedTitle: string;
  relatedPrice: string;
  discover: string;
};

type AccommodationDetailPageProps = {
  accommodation: Accommodation;
  relatedAccommodations: Accommodation[];
  locale: Locale;
  labels: AccommodationDetailLabels;
  onlineBookingUrl: string;
  whatsappUrl: string;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function getFeatureLabel(feature: AccommodationFeature, locale: Locale) {
  return feature.customLabel[locale] ?? feature.name[locale];
}

export function AccommodationDetailPage({
  accommodation,
  relatedAccommodations,
  locale,
  labels,
  onlineBookingUrl,
  whatsappUrl,
}: AccommodationDetailPageProps) {
  const hasFeatures = accommodation.featureGroups.some(
    (group) => group.features.length > 0,
  );

  return (
    <main className="page-accommodation page-accommodation-detail">
      <div className="accommodation-detail-shell accommodation-detail-shell--hero">
        <AccommodationLightboxGallery
          images={accommodation.images}
          locale={locale}
          accommodationName={accommodation.name[locale]}
          labels={{
            gallery: labels.gallery,
            noImages: labels.noImages,
            viewPhotos: labels.viewPhotos,
            viewPhotosCount: labels.viewPhotosCount,
            closeGallery: labels.closeGallery,
            previousImage: labels.previousImage,
            nextImage: labels.nextImage,
          }}
        />
      </div>

      <div className="accommodation-detail-shell">
        <nav className="accommodation-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/hebergement">{labels.breadcrumbRoot}</Link>
          <span aria-hidden="true">/</span>
          <span>{accommodation.name[locale]}</span>
        </nav>

        <header className="accommodation-detail-identity">
          {accommodation.category[locale] ? (
            <p className="section-eyebrow">{accommodation.category[locale]}</p>
          ) : null}
          <h1>{accommodation.name[locale]}</h1>
          <p>{accommodation.shortDescription[locale]}</p>
        </header>

        <dl className="accommodation-detail-facts" aria-label={labels.mainInfo}>
          {accommodation.surfaceM2 ? (
            <div>
              <dt>{labels.surface}</dt>
              <dd>{Number(accommodation.surfaceM2)} m²</dd>
            </div>
          ) : null}
          <div>
            <dt>{labels.capacity}</dt>
            <dd>
              {accommodation.capacity} {labels.guests}
            </dd>
          </div>
          <div>
            <dt>{labels.priceFrom}</dt>
            <dd>
              {formatPrice(accommodation.priceFrom)} {labels.priceUnit}
            </dd>
          </div>
        </dl>

        <div className="accommodation-detail-content-grid">
          <div className="accommodation-detail-main-content">
            {accommodation.description[locale] ? (
              <section className="accommodation-detail-section accommodation-detail-section--editorial">
                <p className="section-eyebrow">{labels.descriptionEyebrow}</p>
                <h2>{labels.descriptionTitle}</h2>
                <p>{accommodation.description[locale]}</p>
              </section>
            ) : null}

            {hasFeatures ? (
              <section className="accommodation-detail-section accommodation-detail-section--features">
                <p className="section-eyebrow">{labels.features}</p>
                <h2>{labels.features}</h2>
                <div className="accommodation-detail-feature-groups">
                  {accommodation.featureGroups.map((group) =>
                    group.features.length > 0 ? (
                      <section className="accommodation-detail-feature-group" key={group.id}>
                        <h3>{group.name[locale]}</h3>
                        <ul>
                          {group.features.map((feature) => (
                            <li key={feature.id}>
                              <AccommodationFeatureIcon
                                iconKey={feature.iconKey}
                                className="accommodation-detail-feature-icon"
                              />
                              <span>{getFeatureLabel(feature, locale)}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null,
                  )}
                </div>
              </section>
            ) : null}

          </div>

          <aside className="accommodation-detail-booking" aria-labelledby="accommodation-detail-booking-title">
            <p className="section-eyebrow">{labels.booking}</p>
            <h2 id="accommodation-detail-booking-title">{labels.booking}</h2>
            <div className="accommodation-detail-booking-price">
              <span>{labels.priceFrom}</span>
              <strong>{formatPrice(accommodation.priceFrom)}</strong>
              <span>{labels.priceUnit}</span>
            </div>
            <p>{labels.bookingText}</p>
            <div className="accommodation-detail-booking-actions">
              <a href={onlineBookingUrl} target="_blank" rel="noopener noreferrer">
                {labels.bookOnline}
              </a>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                {labels.whatsapp}
              </a>
            </div>
          </aside>
        </div>

        {relatedAccommodations.length > 0 ? (
          <section className="accommodation-detail-related">
            <div className="accommodation-detail-related-header">
              <p className="section-eyebrow">{labels.related}</p>
              <h2>{labels.relatedTitle}</h2>
            </div>
            <div className="accommodation-detail-related-grid">
              {relatedAccommodations.map((item) => {
                const relatedImage =
                  item.images.find((image) => image.isCover) ?? item.images[0] ?? null;

                return (
                  <a
                    className="accommodation-detail-related-card"
                    href={getAccommodationDetailPath(locale, item.code)}
                    key={item.id}
                  >
                    {relatedImage ? (
                      <Image
                        src={relatedImage.imagePath}
                        alt={relatedImage.alt[locale]}
                        width={420}
                        height={280}
                        sizes="(max-width: 760px) 88vw, 30vw"
                      />
                    ) : null}
                    <div className="accommodation-detail-related-body">
                      <span>{item.category[locale]}</span>
                      <strong>{item.name[locale]}</strong>
                      <small>
                        {labels.relatedPrice} {formatPrice(item.priceFrom)} {labels.priceUnit}
                      </small>
                      <em>{labels.discover} →</em>
                    </div>
                  </a>
                );
              })}
            </div>
          </section>
        ) : null}

        <Link className="accommodation-detail-back accommodation-detail-back--bottom" href="/hebergement">
          {labels.back}
        </Link>
      </div>
    </main>
  );
}
