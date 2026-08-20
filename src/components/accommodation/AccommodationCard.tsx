"use client";

import Image from "next/image";
import type { Locale } from "@/lib/i18n/routing";
import { getAccommodationImageAlt } from "@/lib/seo/accommodation-alt";
import type { AccommodationCardModel } from "@/types/accommodation";

type AccommodationCardProps = {
  accommodation: AccommodationCardModel;
  locale: Locale;
  labels: {
    from: string;
    unit: string;
    details: string;
    detailsPrefix: string;
  };
  onOpen?: (
    accommodationId: string,
    trigger: HTMLButtonElement,
  ) => void;
};

export function AccommodationCard({
  accommodation,
  locale,
  labels,
  onOpen,
}: AccommodationCardProps) {
  const mainImage =
    accommodation.images[0] ?? "/hebergement.jpeg";

  const category =
    accommodation.category[locale].toLowerCase();

  const name = accommodation.name[locale];

  const detailsLabel =
    locale === "fr"
      ? `${labels.detailsPrefix} ${category} ${name}`
      : `${labels.detailsPrefix} ${name} ${category}`;

  const surfaceLabel =
    locale === "fr"
      ? "Superficie"
      : "Area";

  const capacityLabel =
    locale === "fr"
      ? "Capacité maximale"
      : "Maximum capacity";

  return (
    <article className="room-card-small">
      <div className="room-thumb">
        <Image
          src={mainImage}
          alt={getAccommodationImageAlt(
            accommodation,
            locale,
          )}
          width={520}
          height={360}
          sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 30vw"
          className="room-thumb-img"
        />

        <div className="room-type-badges">
          <span className="type-badge">
            {accommodation.category[locale]}
          </span>
        </div>
      </div>

      <div className="room-details-small">
        <span className="room-cat">
          {accommodation.category[locale]}
        </span>

        <h3>{name}</h3>

        <p>
          {accommodation.subtitle[locale]}
        </p>

        <div className="room-quick-specs">
          <div className="room-quick-spec">
            <span className="room-quick-spec-label">
              {surfaceLabel}
            </span>

            <strong className="room-quick-spec-value">
              {accommodation.surface}
            </strong>
          </div>

          <div className="room-quick-spec">
            <span className="room-quick-spec-label">
              {capacityLabel}
            </span>

            <strong className="room-quick-spec-value">
              {accommodation.capacity[locale]}
            </strong>
          </div>
        </div>

        <div className="room-footer">
          <div className="room-price-from">
            {labels.from}{" "}
            <strong>
              {accommodation.price}
            </strong>

            <br />

            <small>
              {labels.unit}
            </small>
          </div>

          <button
            className="btn-book-details"
            type="button"
            aria-label={detailsLabel}
            onClick={(event) =>
              onOpen?.(
                accommodation.id,
                event.currentTarget,
              )
            }
          >
            {labels.details}
          </button>
        </div>
      </div>
    </article>
  );
}