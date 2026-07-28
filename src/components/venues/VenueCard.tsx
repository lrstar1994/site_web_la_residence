import Image from "next/image";
import type { Locale } from "@/lib/i18n/routing";
import type { VenueCardModel } from "@/types/venue";

type VenueCardProps = {
  venue: VenueCardModel;
  locale: Locale;
  labels: {
    maxCapacity: string;
    details: string;
    detailsPrefix: string;
    detailsSuffix: string;
  };
  onOpen: (venueId: string, trigger: HTMLButtonElement) => void;
};

export function VenueCard({ venue, locale, labels, onOpen }: VenueCardProps) {
  return (
    <article className="room-card">
      <div className="room-card-image">
        <Image
          src={venue.coverImage.src}
          alt={venue.coverImage.alt[locale]}
          width={700}
          height={440}
          sizes="(max-width: 768px) 85vw, 350px"
        />
        <div className="room-badge">
          {venue.capacity[locale]} {labels.maxCapacity}
        </div>
      </div>
      <div className="room-card-body">
        <span className="location-badge">{venue.location[locale]}</span>
        <h3>{venue.name[locale]}</h3>
        <p>{venue.shortDescription[locale]}</p>
        <button
          className="btn-details"
          type="button"
          aria-label={`${labels.detailsPrefix} ${venue.name[locale]}${labels.detailsSuffix}`}
          onClick={(event) => onOpen(venue.id, event.currentTarget)}
        >
          {labels.details}
        </button>
      </div>
    </article>
  );
}
