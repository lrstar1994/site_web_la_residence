import Image from "next/image";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventCardProps = {
  service: EventService;
  locale: Locale;
};

export function EventCard({ service, locale }: EventCardProps) {
  return (
    <article className="event-card">
      <div className="event-card-image">
        <Image
          src={service.imagePath}
          alt={service.imageAlt[locale]}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
      </div>
      <div className="event-card-content">
        <h3>{service.title[locale]}</h3>
        <p>{service.description[locale]}</p>
      </div>
    </article>
  );
}
