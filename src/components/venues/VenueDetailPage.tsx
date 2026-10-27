import Image from "next/image";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { getVenueDetailPath } from "@/lib/venues/venue-routes";
import { VenueLightboxGallery } from "@/components/venues/VenueLightboxGallery";
import { VenueSetupIcon } from "@/components/venues/VenueSetupIcon";
import type { PhysicalVenueDetail, PhysicalVenueUse, Venue } from "@/types/venue";

type VenueDetailLabels = {
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
  capacity: string;
  capacityValue: string;
  location: string;
  surface: string;
  setupsEyebrow: string;
  setupsTitle: string;
  ctaText: string;
  requestQuote: string;
  whatsapp: string;
  heroEyebrow: string;
  usageSeminar: string;
  usageReception: string;
  usages: string;
  usageCount: string;
  configurationCount: string;
  introEyebrow: string;
  introTitle: string;
  usageSectionEyebrow: string;
  usageSectionTitle: string;
  eventCtaEyebrow: string;
  eventCtaTitle: string;
  eventCtaText: string;
  related: string;
  relatedTitle: string;
  discover: string;
};

type VenueDetailPageProps = {
  venue: PhysicalVenueDetail;
  relatedVenues: Venue[];
  locale: Locale;
  labels: VenueDetailLabels;
  quoteUrl: string;
  whatsappUrl: string;
};

type FactItem = {
  key: string;
  label: string;
  value: string;
  icon: "capacity" | "location" | "layers" | "surface";
};

function getUseLabel(typeCode: string, labels: VenueDetailLabels) {
  if (typeCode === "seminar") {
    return labels.usageSeminar;
  }

  if (typeCode === "reception") {
    return labels.usageReception;
  }

  return typeCode;
}

function getUseImage(use: PhysicalVenueUse) {
  return use.images.find((image) => image.isCover) ?? use.images[0] ?? null;
}

function getUsageTitle(usages: PhysicalVenueUse[], labels: VenueDetailLabels) {
  const hasSeminar = usages.some((use) => use.typeCode === "seminar");
  const hasReception = usages.some((use) => use.typeCode === "reception");

  if (hasSeminar && hasReception) {
    return `${labels.usageSeminar} & ${labels.usageReception}`;
  }

  return getUseLabel(usages[0]?.typeCode ?? "", labels);
}

function DetailFactIcon({ icon }: { icon: FactItem["icon"] }) {
  if (icon === "capacity") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M8 11a3 3 0 100-6 3 3 0 000 6zM16 11a3 3 0 100-6 3 3 0 000 6zM3 20a5 5 0 0110 0M11 20a5 5 0 0110 0" />
      </svg>
    );
  }

  if (icon === "location") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 21s7-6.1 7-12a7 7 0 10-14 0c0 5.9 7 12 7 12zM12 12a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    );
  }

  if (icon === "surface") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4 4h16v16H4zM8 4v16M16 4v16M4 8h16M4 16h16" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 3l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 16l9 5 9-5" />
    </svg>
  );
}

export function VenueDetailPage({
  venue,
  relatedVenues,
  locale,
  labels,
  quoteUrl,
  whatsappUrl,
}: VenueDetailPageProps) {
  const coverImage = venue.images.find((image) => image.isCover) ?? venue.images[0] ?? null;
  const location = venue.location[locale];
  const description = venue.description[locale];
  const shortDescription = venue.shortDescription[locale];
  const normalizedDescription = description.trim();
  const normalizedShortDescription = shortDescription.trim();
  const showShortDescription =
    Boolean(normalizedShortDescription) &&
    normalizedShortDescription !== normalizedDescription;
  const showDescription = Boolean(normalizedDescription);
  const usageBadges = venue.physicalUses.map((use) => getUseLabel(use.typeCode, labels));
  const usageTitle = getUsageTitle(venue.physicalUses, labels);
  const usageImage =
    venue.physicalUses.map(getUseImage).find(Boolean) ?? coverImage;
  const facts: FactItem[] = [
    {
      key: "capacity",
      label: labels.capacity,
      value: labels.capacityValue,
      icon: "capacity",
    },
    ...(location
      ? [
          {
            key: "location",
            label: labels.location,
            value: location,
            icon: "location" as const,
          },
        ]
      : []),
    ...(venue.setups.length > 0
      ? [
          {
            key: "setups",
            label: labels.setupsTitle,
            value: labels.configurationCount,
            icon: "layers" as const,
          },
        ]
      : []),
    ...(venue.surfaceM2
      ? [
          {
            key: "surface",
            label: labels.surface,
            value: `${Number(venue.surfaceM2)} m²`,
            icon: "surface" as const,
          },
        ]
      : []),
  ];

  return (
    <main className="page-venue-detail page-venue-detail--event">
      <section className="venue-event-hero" aria-labelledby="venue-event-title">
        {coverImage ? (
          <Image
            src={coverImage.imagePath}
            alt={coverImage.alt[locale]}
            fill
            priority
            sizes="100vw"
            className="venue-event-hero__image"
          />
        ) : (
          <div className="venue-event-hero__placeholder" aria-hidden="true" />
        )}
        <div className="venue-event-hero__overlay" aria-hidden="true" />
        <div className="venue-event-hero__content">
          <p className="venue-event-eyebrow">{labels.heroEyebrow}</p>
          <h1 id="venue-event-title">{venue.name}</h1>
          {location ? <p className="venue-event-location">{location}</p> : null}
          {usageBadges.length > 0 ? (
            <div className="venue-event-usage-line" aria-label={labels.usages}>
              {usageBadges.map((badge) => (
                <span key={badge}>
                  <DetailFactIcon icon="layers" />
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="venue-detail-shell">
        <nav className="venue-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">{locale === "fr" ? "Accueil" : "Home"}</Link>
          <span aria-hidden="true">›</span>
          <Link href="/salles">{labels.breadcrumbRoot}</Link>
          <span aria-hidden="true">›</span>
          <span>{venue.name}</span>
        </nav>

        <section className="venue-event-overview" aria-labelledby="venue-event-overview-title">
          <div className="venue-event-overview__intro">
            <p className="section-eyebrow">{labels.introEyebrow}</p>
            <h2 id="venue-event-overview-title">{venue.name}</h2>
            {showShortDescription ? <p className="venue-event-lead">{shortDescription}</p> : null}
            {showDescription ? <p>{description}</p> : null}
          </div>

          {facts.length > 0 ? (
            <dl className="venue-event-facts" aria-label={labels.mainInfo}>
              {facts.map((fact) => (
                <div key={fact.key}>
                  <DetailFactIcon icon={fact.icon} />
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
        </section>

        {venue.physicalUses.length > 0 ? (
          <section className="venue-event-use-panel" aria-labelledby="venue-event-use-title">
            {usageImage ? (
              <Image
                src={usageImage.imagePath}
                alt={usageImage.alt[locale]}
                fill
                sizes="(max-width: 900px) 100vw, 1220px"
                className="venue-event-use-panel__image"
              />
            ) : null}
            <div className="venue-event-use-panel__overlay" aria-hidden="true" />
            <div className="venue-event-use-panel__content">
              <span className="venue-event-panel-rule" aria-hidden="true" />
              <p className="section-eyebrow">{labels.usageSectionEyebrow}</p>
              <h2 id="venue-event-use-title">{usageTitle}</h2>
              <div className="venue-event-use-panel__actions">
                <a href={quoteUrl}>{labels.requestQuote}</a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  {labels.whatsapp}
                </a>
              </div>
            </div>
          </section>
        ) : null}

        {venue.setups.length > 0 ? (
          <section className="venue-event-setups">
            <div className="venue-event-centered-heading">
              <h2>{labels.setupsTitle}</h2>
            </div>
            <ul className="venue-event-setup-list">
              {venue.setups.map((setup) => (
                <li key={setup.code}>
                  <VenueSetupIcon iconKey={setup.iconKey} className="venue-detail-setup-icon" />
                  <span>{setup.name[locale]}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {venue.images.length > 0 ? (
          <section className="venue-event-gallery-block">
            <VenueLightboxGallery
              images={venue.images}
              locale={locale}
              venueName={venue.name}
              heading={labels.gallery}
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
          </section>
        ) : null}
      </div>

      {relatedVenues.length > 0 ? (
        <section className="venue-event-related-band">
          <div className="venue-detail-shell">
            <div className="venue-event-centered-heading">
              <h2>{labels.relatedTitle}</h2>
            </div>
            <div className="venue-detail-related-grid">
              {relatedVenues.map((item) => {
                const relatedImage =
                  item.images.find((image) => image.isCover) ?? item.images[0] ?? null;

                return (
                  <a
                    className="venue-detail-related-card"
                    href={getVenueDetailPath(locale, item.code)}
                    key={item.code}
                  >
                    {relatedImage ? (
                      <Image
                        src={relatedImage.imagePath}
                        alt={relatedImage.alt[locale]}
                        width={180}
                        height={130}
                        sizes="(max-width: 760px) 35vw, 180px"
                      />
                    ) : (
                      <div className="venue-detail-related-placeholder" aria-hidden="true" />
                    )}
                    <div className="venue-detail-related-body">
                      <strong>{item.name}</strong>
                      {item.capacity ? (
                        <small>
                          {locale === "fr"
                            ? `${item.capacity} personnes`
                            : `${item.capacity} guests`}
                        </small>
                      ) : null}
                    </div>
                    <em aria-hidden="true">→</em>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
