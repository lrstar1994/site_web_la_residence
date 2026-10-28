"use client";

import { AccommodationCard } from "@/components/accommodation/AccommodationCard";
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
  discover: string;
  essentials: string;
  residenceBenefits: string;
};

type AccommodationExplorerProps = {
  accommodations: AccommodationCardModel[];
  locale: Locale;
  labels: {
    card: CardLabels;
  };
};

export function AccommodationExplorer({
  accommodations,
  locale,
  labels,
}: AccommodationExplorerProps) {
  return (
    <div className="rooms-grid">
      {accommodations.map((accommodation) => (
        <AccommodationCard
          key={accommodation.id}
          accommodation={accommodation}
          locale={locale}
          labels={labels.card}
        />
      ))}
    </div>
  );
}
