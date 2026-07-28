"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { VenueCard } from "@/components/venues/VenueCard";
import { VenueModal } from "@/components/venues/VenueModal";
import type { Locale } from "@/lib/i18n/routing";
import type { VenueCardModel } from "@/types/venue";

type VenuesExplorerProps = {
  venues: VenueCardModel[];
  locale: Locale;
  labels: {
    previous: string;
    next: string;
    maxCapacity: string;
    details: string;
    detailsPrefix: string;
    detailsSuffix: string;
    modal: {
      close: string;
      previous: string;
      next: string;
      thumbnails: string;
      setupsTitle: string;
      area: string;
      capacity: string;
    };
  };
};

export function VenuesExplorer({ venues, locale, labels }: VenuesExplorerProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(
    null,
  );
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const selectedVenue = venues.find((venue) => venue.id === selectedId) ?? null;

  const updateScrollState = useCallback(() => {
    const slider = sliderRef.current;

    if (!slider) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const maxScrollLeft = slider.scrollWidth - slider.clientWidth;
    setCanScrollPrev(slider.scrollLeft > 4);
    setCanScrollNext(slider.scrollLeft < maxScrollLeft - 4);
  }, []);

  const scrollSlider = useCallback((direction: number) => {
    const slider = sliderRef.current;

    if (!slider) {
      return;
    }

    const firstCard = slider.querySelector<HTMLElement>(".room-card");
    const step = firstCard
      ? firstCard.offsetWidth + 30
      : Math.round(slider.clientWidth * 0.85);

    slider.scrollBy({
      left: direction * step,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    const slider = sliderRef.current;

    updateScrollState();

    if (!slider) {
      return undefined;
    }

    slider.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      slider.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  function handleSliderKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollSlider(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollSlider(1);
    }
  }

  const handleOpen = useCallback((venueId: string, trigger: HTMLButtonElement) => {
    setTriggerElement(trigger);
    setSelectedId(venueId);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    triggerElement?.focus();
    setTriggerElement(null);
  }, [triggerElement]);

  return (
    <>
      <div className="slider-wrapper">
        {canScrollPrev ? (
          <button
            className="slider-arrow prev"
            type="button"
            aria-label={labels.previous}
            onClick={() => scrollSlider(-1)}
          >
            <span aria-hidden="true">‹</span>
          </button>
        ) : null}
        <div
          className="rooms-slider"
          ref={sliderRef}
          tabIndex={0}
          onKeyDown={handleSliderKeyDown}
        >
          {venues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              locale={locale}
              labels={{
                maxCapacity: labels.maxCapacity,
                details: labels.details,
                detailsPrefix: labels.detailsPrefix,
                detailsSuffix: labels.detailsSuffix,
              }}
              onOpen={handleOpen}
            />
          ))}
        </div>
        {canScrollNext ? (
          <button
            className="slider-arrow next"
            type="button"
            aria-label={labels.next}
            onClick={() => scrollSlider(1)}
          >
            <span aria-hidden="true">›</span>
          </button>
        ) : null}
      </div>
      {selectedVenue ? (
        <VenueModal
          venue={selectedVenue}
          locale={locale}
          labels={labels.modal}
          onClose={handleClose}
        />
      ) : null}
    </>
  );
}
