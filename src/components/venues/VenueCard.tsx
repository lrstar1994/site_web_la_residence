// import Image from "next/image";
// import type { Locale } from "@/lib/i18n/routing";
// import type { VenueCardModel } from "@/types/venue";

// type VenueCardProps = {
//   venue: VenueCardModel;
//   locale: Locale;
//   labels: {
//     maxCapacity: string;
//     details: string;
//     detailsPrefix: string;
//     detailsSuffix: string;
//   };
//   onOpen: (venueId: string, trigger: HTMLButtonElement) => void;
// };

// export function VenueCard({ venue, locale, labels, onOpen }: VenueCardProps) {
//   return (
//     <article className="room-card">
//       <div className="room-card-image">
//         <Image
//           src={venue.coverImage.src}
//           alt={venue.coverImage.alt[locale]}
//           width={700}
//           height={440}
//           sizes="(max-width: 768px) 85vw, 350px"
//         />
//         <div className="room-badge">
//           {venue.capacity[locale]} {labels.maxCapacity}
//         </div>
//       </div>
//       <div className="room-card-body">
//         <span className="location-badge">{venue.location[locale]}</span>
//         <h3>{venue.name[locale]}</h3>
//         <p>{venue.shortDescription[locale]}</p>
//         <button
//           className="btn-details"
//           type="button"
//           aria-label={`${labels.detailsPrefix} ${venue.name[locale]}${labels.detailsSuffix}`}
//           onClick={(event) => onOpen(venue.id, event.currentTarget)}
//         >
//           {labels.details}
//         </button>
//       </div>
//     </article>
//   );
// }

"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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

export function VenueCard({
  venue,
  locale,
  labels,
  onOpen,
}: VenueCardProps) {
  const images = useMemo(() => {
    if (venue.allImages && venue.allImages.length > 0) {
      return venue.allImages;
    }

    return [venue.coverImage];
  }, [venue.allImages, venue.coverImage]);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] =
    useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [venue.id]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();

    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updatePreference,
      );
    };
  }, []);

  useEffect(() => {
    if (
      images.length <= 1 ||
      isPaused ||
      prefersReducedMotion
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentImageIndex((current) => {
        return (current + 1) % images.length;
      });
    }, 4500);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    images.length,
    isPaused,
    prefersReducedMotion,
  ]);

  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, images.length]);

  const currentImage =
    images[currentImageIndex] ?? venue.coverImage;

  const previousImage = () => {
    setCurrentImageIndex((current) => {
      if (current === 0) {
        return images.length - 1;
      }

      return current - 1;
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((current) => {
      return (current + 1) % images.length;
    });
  };

  return (
    <article className="room-card">
      <div
        className="room-card-image room-card-slideshow"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <Image
          key={currentImage.src}
          src={currentImage.src}
          alt={currentImage.alt[locale]}
          width={700}
          height={440}
          sizes="(max-width: 768px) 85vw, 350px"
          className="room-card-slide-image"
        />

        <div className="room-badge">
          {venue.capacity[locale]} {labels.maxCapacity}
        </div>

        {images.length > 1 ? (
          <>
            <button
              className="room-card-slide-arrow previous"
              type="button"
              aria-label={
                locale === "fr"
                  ? "Image précédente"
                  : "Previous image"
              }
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
            >
              ‹
            </button>

            <button
              className="room-card-slide-arrow next"
              type="button"
              aria-label={
                locale === "fr"
                  ? "Image suivante"
                  : "Next image"
              }
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
            >
              ›
            </button>

            <div
              className="room-card-slide-counter"
              aria-hidden="true"
            >
              {currentImageIndex + 1} / {images.length}
            </div>
          </>
        ) : null}
      </div>

      <div className="room-card-body">
        <span className="location-badge">
          {venue.location[locale]}
        </span>

        <h3>{venue.name[locale]}</h3>

        <p>{venue.shortDescription[locale]}</p>

        <button
          className="btn-details"
          type="button"
          aria-label={`${labels.detailsPrefix} ${venue.name[locale]}${labels.detailsSuffix}`}
          onClick={(event) =>
            onOpen(venue.id, event.currentTarget)
          }
        >
          {labels.details}
        </button>
      </div>
    </article>
  );
}