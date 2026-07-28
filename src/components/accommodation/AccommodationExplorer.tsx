"use client";

import { useCallback, useState } from "react";
import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
import { AccommodationModal } from "@/components/accommodation/AccommodationModal";
import type { Locale } from "@/lib/i18n/routing";
import type { AccommodationCardModel } from "@/types/accommodation";

type CardLabels = {
  from: string;
  unit: string;
  details: string;
  detailsPrefix: string;
};

export type AccommodationModalLabels = {
  close: string;
  previousImage: string;
  nextImage: string;
  galleryLabel: string;
  from: string;
  unit: string;
  highlights: string;
  whatsappButton: string;
  bookOnline: string;
  bookOnlineDescription: string;
  essentials: string;
  residenceBenefits: string;
};

type AccommodationExplorerProps = {
  accommodations: AccommodationCardModel[];
  locale: Locale;
  whatsappBaseUrl: string;
  onlineBookingUrl: string;
  labels: {
    card: CardLabels;
    modal: AccommodationModalLabels;
  };
};

export function AccommodationExplorer({
  accommodations,
  locale,
  whatsappBaseUrl,
  onlineBookingUrl,
  labels,
}: AccommodationExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const selectedAccommodation =
    accommodations.find((accommodation) => accommodation.id === selectedId) ??
    null;

  const handleOpen = useCallback(
    (accommodationId: string, trigger: HTMLButtonElement) => {
      setTriggerElement(trigger);
      setSelectedId(accommodationId);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setSelectedId(null);
    triggerElement?.focus();
    setTriggerElement(null);
  }, [triggerElement]);

  return (
    <>
      <div className="rooms-grid">
        {accommodations.map((accommodation) => (
          <AccommodationCard
            key={accommodation.id}
            accommodation={accommodation}
            locale={locale}
            labels={labels.card}
            onOpen={handleOpen}
          />
        ))}
      </div>
      {selectedAccommodation ? (
        <AccommodationModal
          accommodation={selectedAccommodation}
          locale={locale}
          labels={labels.modal}
          whatsappBaseUrl={whatsappBaseUrl}
          onlineBookingUrl={onlineBookingUrl}
          onClose={handleClose}
        />
      ) : null}
    </>
  );
}
