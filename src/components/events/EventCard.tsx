"use client";

import Image from "next/image";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventCardProps = {
  service: EventService;
  locale: Locale;
  labels: {
    viewDetails: string;
  };
  onOpen: (service: EventService, trigger: HTMLButtonElement) => void;
};

export function EventCard({ service, locale, labels, onOpen }: EventCardProps) {
  const coverImage = service.images.find((image) => image.isCover) ?? service.images[0];
  const imagePath = coverImage?.imagePath ?? service.imagePath;
  const imageAlt = coverImage?.alt[locale] ?? service.imageAlt[locale];

  return (
    <article className="event-card">
      <div className="event-card-image">
        {imagePath ? (
          <Image
            src={imagePath}
            alt={imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : null}
      </div>
      <div className="event-card-content">
        <h3>{service.title[locale]}</h3>
        <p>{service.description[locale]}</p>
        <button
          className="event-card-details"
          type="button"
          aria-haspopup="dialog"
          onClick={(event) => onOpen(service, event.currentTarget)}
        >
          {labels.viewDetails}
        </button>
      </div>
    </article>
  );
}
