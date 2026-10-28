"use client";

import { EventCard } from "@/components/events/EventCard";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventServicesGridProps = {
  locale: Locale;
  services: EventService[];
  labels: {
    viewDetails: string;
  };
};

export function EventServicesGrid({ locale, services, labels }: EventServicesGridProps) {
  return (
    <div className="events-grid">
      {services.map((service) => (
        <EventCard
          key={service.id}
          service={service}
          locale={locale}
          labels={{ viewDetails: labels.viewDetails }}
        />
      ))}
    </div>
  );
}
