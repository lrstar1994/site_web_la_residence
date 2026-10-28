import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  Maximize2,
  MessageCircle,
  UsersRound,
} from "lucide-react";

import { AccommodationFeatureIcon } from "@/components/accommodation/AccommodationFeatureIcon";
import {
  AccommodationHeroGallery,
  AccommodationLightboxGallery,
  AccommodationPhotoGallery,
} from "@/components/accommodation/AccommodationLightboxGallery";
import { getAccommodationDetailPath } from "@/lib/accommodations/accommodation-routes";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import type { Accommodation, AccommodationFeature } from "@/types/accommodation";

type AccommodationDetailLabels = {
  back: string;
  gallery: string;
  galleryTitle: string;
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
  features: string;
  featuresTitle: string;
  booking: string;
  bookingRateUnit: string;
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
  const shortDescription = accommodation.shortDescription[locale]?.trim() ?? "";
  const description = accommodation.description[locale]?.trim() ?? "";
  const leadDescription = shortDescription || description;
  const fullDescription =
    description && description.localeCompare(leadDescription, locale, { sensitivity: "base" }) !== 0
      ? description
      : "";

  return (
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
    >
      <main className="page-accommodation page-accommodation-detail">
        <div className="accommodation-detail-shell accommodation-detail-shell--hero">
          <AccommodationHeroGallery />
        </div>

        <div className="accommodation-detail-shell">
          <nav className="accommodation-detail-breadcrumb" aria-label="Breadcrumb">
            <Link href="/hebergement">{labels.breadcrumbRoot}</Link>
            <span aria-hidden="true">/</span>
            <span>{accommodation.name[locale]}</span>
          </nav>

          <section className="accommodation-detail-presentation" aria-labelledby="accommodation-detail-title">
            <div className="accommodation-detail-intro">
              {accommodation.category[locale] ? (
                <p className="section-eyebrow">{accommodation.category[locale]}</p>
              ) : null}
              <h1 id="accommodation-detail-title">{accommodation.name[locale]}</h1>
              {leadDescription ? <p className="accommodation-detail-lead">{leadDescription}</p> : null}
              {fullDescription ? <p className="accommodation-detail-description">{fullDescription}</p> : null}

              <dl className="accommodation-detail-facts" aria-label={labels.mainInfo}>
                {accommodation.surfaceM2 ? (
                  <div>
                    <Maximize2 aria-hidden="true" />
                    <dt>{labels.surface}</dt>
                    <dd>{Number(accommodation.surfaceM2)} m²</dd>
                  </div>
                ) : null}
                {accommodation.capacity ? (
                  <div>
                    <UsersRound aria-hidden="true" />
                    <dt>{labels.capacity}</dt>
                    <dd>{accommodation.capacity} {labels.guests}</dd>
                  </div>
                ) : null}
                {accommodation.priceFrom ? (
                  <div>
                    <Coins aria-hidden="true" />
                    <dt>{labels.priceFrom}</dt>
                    <dd>{formatPrice(accommodation.priceFrom)} {labels.priceUnit}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <aside className="accommodation-detail-booking" aria-labelledby="accommodation-detail-booking-title">
              <p className="section-eyebrow">{labels.booking}</p>
              <h2 id="accommodation-detail-booking-title" className="sr-only">{labels.booking}</h2>
              <div className="accommodation-detail-booking-price">
                <strong>{formatPrice(accommodation.priceFrom)} <small>Ar</small></strong>
                <span>{labels.bookingRateUnit}</span>
              </div>
              <p>{labels.bookingText}</p>
              <div className="accommodation-detail-booking-actions">
                <a href={onlineBookingUrl} target="_blank" rel="noopener noreferrer">
                  <CalendarDays aria-hidden="true" />
                  <span>{labels.bookOnline}</span>
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle aria-hidden="true" />
                  <span>{labels.whatsapp}</span>
                </a>
              </div>
            </aside>
          </section>

          {hasFeatures ? (
            <section className="accommodation-detail-features" aria-labelledby="accommodation-features-title">
              <div className="accommodation-detail-features-heading">
                <p className="section-eyebrow">{labels.features}</p>
                <h2 id="accommodation-features-title">{labels.featuresTitle}</h2>
              </div>
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

          <AccommodationPhotoGallery eyebrow={labels.gallery} title={labels.galleryTitle} />

          {relatedAccommodations.length > 0 ? (
            <section className="accommodation-detail-related" aria-labelledby="accommodation-related-title">
              <div className="accommodation-detail-section-heading">
                <div>
                  <p className="section-eyebrow">{labels.related}</p>
                  <h2 id="accommodation-related-title">{labels.relatedTitle}</h2>
                </div>
                <Link className="accommodation-detail-section-link" href="/hebergement">
                  <span>{labels.back}</span>
                  <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
                </Link>
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
                        <small>{labels.relatedPrice} {formatPrice(item.priceFrom)} {labels.priceUnit}</small>
                        <div className="accommodation-detail-related-specs">
                          {item.surfaceM2 ? <span><Maximize2 aria-hidden="true" />{Number(item.surfaceM2)} m²</span> : null}
                          {item.capacity ? <span><UsersRound aria-hidden="true" />{item.capacity} {labels.guests}</span> : null}
                        </div>
                        <em>{labels.discover}<ArrowRight aria-hidden="true" size={16} /></em>
                      </div>
                    </a>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </AccommodationLightboxGallery>
  );
}
