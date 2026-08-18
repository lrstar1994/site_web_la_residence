"use client";

import Image from "next/image";

import type { PublicEventMomentImage } from "@/lib/events/get-event-moments";
import type { Locale } from "@/lib/i18n/routing";

type EventMomentsCarouselProps = {
  images: PublicEventMomentImage[];
  locale: Locale;
};

export function EventMomentsCarousel({
  images,
  locale,
}: EventMomentsCarouselProps) {
  if (images.length === 0) {
    return null;
  }

  const baseImages =
    images.length >= 5
      ? images
      : [
          ...images,
          ...images,
          ...images,
        ];

  function renderGroup(
    groupKey: string,
    hidden: boolean,
  ) {
    return (
      <div
        className="event-moments-group"
        aria-hidden={hidden ? "true" : undefined}
      >
        {baseImages.map((image, index) => (
          <figure
            className="event-moments-item"
            key={`${groupKey}-${image.id}-${index}`}
          >
            <Image
              src={image.imagePath}
              alt={hidden ? "" : image.alt[locale]}
              fill
              sizes="(max-width: 640px) 76vw, (max-width: 1024px) 42vw, 320px"
              className="event-moments-image"
            />
          </figure>
        ))}
      </div>
    );
  }

  return (
    <div
      className="event-moments"
      aria-label={
        locale === "fr"
          ? "Galerie d’images de nos événements"
          : "Gallery of our event moments"
      }
    >
      

      <div className="event-moments-viewport">
        <div className="event-moments-track">
          {renderGroup("original", false)}
          {renderGroup("duplicate", true)}
        </div>
      </div>
    </div>
  );
}