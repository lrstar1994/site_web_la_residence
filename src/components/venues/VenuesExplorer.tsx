"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

type VenueCategorySliderProps = {
  id?: string;
  venues: VenueCardModel[];
  locale: Locale;
  title: string;
  eyebrow: string;
  description: string;
  labels: VenuesExplorerProps["labels"];
  onOpen: (
    venueId: string,
    trigger: HTMLButtonElement,
  ) => void;
};

function VenueCategorySlider({
  id,
  venues,
  locale,
  title,
  eyebrow,
  description,
  labels,
  onOpen,
}: VenueCategorySliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const [canScrollPrev, setCanScrollPrev] =
    useState(false);

  const [canScrollNext, setCanScrollNext] =
    useState(false);

  const updateScrollState = useCallback(() => {
    const slider = sliderRef.current;

    if (!slider) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const maxScrollLeft =
      slider.scrollWidth - slider.clientWidth;

    setCanScrollPrev(
      slider.scrollLeft > 4,
    );

    setCanScrollNext(
      slider.scrollLeft <
        maxScrollLeft - 4,
    );
  }, []);

  const scrollSlider = useCallback(
    (direction: number) => {
      const slider = sliderRef.current;

      if (!slider) {
        return;
      }

      const firstCard =
        slider.querySelector<HTMLElement>(
          ".room-card",
        );

      const step = firstCard
        ? firstCard.offsetWidth + 30
        : Math.round(
            slider.clientWidth * 0.85,
          );

      slider.scrollBy({
        left: direction * step,
        behavior: "smooth",
      });
    },
    [],
  );

  useEffect(() => {
    const slider = sliderRef.current;

    updateScrollState();

    if (!slider) {
      return undefined;
    }

    slider.addEventListener(
      "scroll",
      updateScrollState,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "resize",
      updateScrollState,
    );

    return () => {
      slider.removeEventListener(
        "scroll",
        updateScrollState,
      );

      window.removeEventListener(
        "resize",
        updateScrollState,
      );
    };
  }, [updateScrollState]);

  function handleSliderKeyDown(
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollSlider(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollSlider(1);
    }
  }

  if (venues.length === 0) {
    return null;
  }

  return (
    <section
      id={id}
      className="venue-category-section"
    >
      <div className="section-header venue-category-heading">
        <p className="subtitle venue-category-eyebrow">
          {eyebrow}
        </p>

        <h3 className="venue-category-title">
          {title}
        </h3>

        <p className="venue-category-description">
          {description}
        </p>

        <div
          className="venue-category-swipe-hint"
          aria-hidden="true"
        >
          <span className="venue-category-swipe-arrow venue-category-swipe-arrow-left">
            ←
          </span>

          <span className="venue-category-swipe-text">
            {locale === "fr"
              ? "Faites défiler pour voir plus"
              : "Scroll to see more"}
          </span>

          <span className="venue-category-swipe-arrow venue-category-swipe-arrow-right">
            →
          </span>
        </div>
      </div>

      <div className="slider-wrapper">
        {canScrollPrev ? (
          <button
            className="slider-arrow prev"
            type="button"
            aria-label={labels.previous}
            onClick={() =>
              scrollSlider(-1)
            }
          >
            <span aria-hidden="true">
              ‹
            </span>
          </button>
        ) : null}

        <div
          className="rooms-slider"
          ref={sliderRef}
          tabIndex={0}
          onKeyDown={
            handleSliderKeyDown
          }
        >
          {venues.map(
            (venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                locale={locale}
                labels={{
                  maxCapacity:
                    labels.maxCapacity,
                  details:
                    labels.details,
                  detailsPrefix:
                    labels.detailsPrefix,
                  detailsSuffix:
                    labels.detailsSuffix,
                }}
                onOpen={onOpen}
              />
            ),
          )}
        </div>

        {canScrollNext ? (
          <button
            className="slider-arrow next"
            type="button"
            aria-label={labels.next}
            onClick={() =>
              scrollSlider(1)
            }
          >
            <span aria-hidden="true">
              ›
            </span>
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function VenuesExplorer({
  venues,
  locale,
  labels,
}: VenuesExplorerProps) {
  const [selectedId, setSelectedId] =
    useState<string | null>(
      null,
    );

  const [
    triggerElement,
    setTriggerElement,
  ] =
    useState<HTMLButtonElement | null>(
      null,
    );

  const seminarVenues = useMemo(
    () =>
      venues.filter(
        (venue) =>
          venue.category?.code ===
          "seminar",
      ),
    [venues],
  );

  const receptionVenues = useMemo(
    () =>
      venues.filter(
        (venue) =>
          venue.category?.code ===
          "reception",
      ),
    [venues],
  );

  const uncategorizedVenues = useMemo(
    () =>
      venues.filter(
        (venue) =>
          !venue.category,
      ),
    [venues],
  );

  const selectedVenue =
    venues.find(
      (venue) =>
        venue.id === selectedId,
    ) ?? null;

  const handleOpen = useCallback(
    (
      venueId: string,
      trigger: HTMLButtonElement,
    ) => {
      setTriggerElement(trigger);
      setSelectedId(venueId);
    },
    [],
  );

  const handleClose = useCallback(() => {
    setSelectedId(null);

    triggerElement?.focus();

    setTriggerElement(null);
  }, [triggerElement]);

  const seminarLabels =
    locale === "fr"
      ? {
          eyebrow:
            "Événements professionnels",
          title:
            "Salles de réunions et séminaires",
          description:
            "Des espaces adaptés aux réunions, formations, conférences et rencontres professionnelles.",
        }
      : {
          eyebrow:
            "Professional events",
          title:
            "Meeting and seminar rooms",
          description:
            "Flexible spaces for meetings, training sessions, conferences and professional events.",
        };

  const receptionLabels =
    locale === "fr"
      ? {
          eyebrow:
            "Réceptions & célébrations",
          title:
            "Salles de réception",
          description:
            "Des espaces chaleureux pour vos mariages, anniversaires, cocktails, banquets et événements privés.",
        }
      : {
          eyebrow:
            "Receptions & celebrations",
          title:
            "Reception venues",
          description:
            "Welcoming spaces for weddings, birthdays, cocktails, banquets and private celebrations.",
        };

  const seminarSectionId =
    locale === "fr"
      ? "salles-seminaire"
      : "seminar-venues";

  const receptionSectionId =
    locale === "fr"
      ? "salles-reception"
      : "reception-venues";

  return (
    <>
      <div className="venues-category-groups">
        <VenueCategorySlider
          id={seminarSectionId}
          venues={seminarVenues}
          locale={locale}
          eyebrow={
            seminarLabels.eyebrow
          }
          title={
            seminarLabels.title
          }
          description={
            seminarLabels.description
          }
          labels={labels}
          onOpen={handleOpen}
        />

        <VenueCategorySlider
          id={receptionSectionId}
          venues={receptionVenues}
          locale={locale}
          eyebrow={
            receptionLabels.eyebrow
          }
          title={
            receptionLabels.title
          }
          description={
            receptionLabels.description
          }
          labels={labels}
          onOpen={handleOpen}
        />

        {uncategorizedVenues.length >
        0 ? (
          <VenueCategorySlider
            venues={
              uncategorizedVenues
            }
            locale={locale}
            eyebrow={
              locale === "fr"
                ? "Autres espaces"
                : "Other spaces"
            }
            title={
              locale === "fr"
                ? "Nos autres salles"
                : "Our other venues"
            }
            description={
              locale === "fr"
                ? "Découvrez également nos autres espaces disponibles."
                : "Discover our other available spaces."
            }
            labels={labels}
            onOpen={handleOpen}
          />
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