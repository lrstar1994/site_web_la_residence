"use client";

import Image from "next/image";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventCardProps = {
  service: EventService;
  locale: Locale;
};

export function EventCard({ service, locale }: EventCardProps) {
  const images = service.images.length > 0
    ? service.images
    : [
        {
          id: `${service.id}-legacy-image`,
          imagePath: service.imagePath,
          alt: service.imageAlt,
          sortOrder: 0,
          isCover: true,
        },
      ];
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <article className="event-card">
      <div className="event-card-image">
        <Image
          src={activeImage.imagePath}
          alt={activeImage.alt[locale]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {images.length > 1 ? (
          <>
            <div className="event-card-gallery-count" aria-live="polite">
              {activeIndex + 1} / {images.length}
            </div>
            <div className="event-card-gallery-controls" aria-label="Galerie de la prestation">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={index === activeIndex ? "is-active" : ""}
                  aria-label={`Afficher l'image ${index + 1}`}
                  aria-current={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
      <div className="event-card-content">
        <h3>{service.title[locale]}</h3>
        <p>{service.description[locale]}</p>
      </div>
    </article>
  );
}
