"use client";

import { useRef, useState } from "react";
import { EventCard } from "@/components/events/EventCard";
import { EventServiceModal } from "@/components/events/EventServiceModal";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventServicesGridProps = {
  locale: Locale;
  services: EventService[];
  labels: {
    viewDetails: string;
    requestQuote: string;
    closeDetails: string;
    previousImage: string;
    nextImage: string;
    thumbnail: string;
  };
};

export function EventServicesGrid({ locale, services, labels }: EventServicesGridProps) {
  const [selectedService, setSelectedService] = useState<EventService | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  function openModal(service: EventService, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setSelectedService(service);
  }

  function closeModal() {
    setSelectedService(null);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }

  function requestQuote(service: EventService) {
    setSelectedService(null);
    window.dispatchEvent(
      new CustomEvent("event-quote-select", {
        detail: {
          serviceId: service.id,
        },
      }),
    );
  }

  return (
    <>
      <div className="events-grid">
        {services.map((service) => (
          <EventCard
            key={service.id}
            service={service}
            locale={locale}
            labels={{ viewDetails: labels.viewDetails }}
            onOpen={openModal}
          />
        ))}
      </div>
      {selectedService ? (
        <EventServiceModal
          service={selectedService}
          locale={locale}
          labels={labels}
          onClose={closeModal}
          onRequestQuote={requestQuote}
        />
      ) : null}
    </>
  );
}
