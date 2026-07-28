"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n/routing";
import { VenueSetupIcon } from "@/components/venues/VenueSetupIcon";
import type { VenueCardModel } from "@/types/venue";

type VenueModalProps = {
  venue: VenueCardModel;
  locale: Locale;
  labels: {
    close: string;
    previous: string;
    next: string;
    thumbnails: string;
    setupsTitle: string;
    area: string;
    capacity: string;
  };
  onClose: () => void;
};

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

export function VenueModal({ venue, locale, labels, onClose }: VenueModalProps) {
  const t = useTranslations("venuesPage.modal");
  const [currentIndex, setCurrentIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const images = venue.images.length ? venue.images : [venue.coverImage];
  const currentImage = images[currentIndex] ?? images[0];
  const hasMultipleImages = images.length > 1;
  const titleId = `venue-modal-${venue.id}`;

  const navigate = useCallback(
    (direction: number) => {
      if (!hasMultipleImages) {
        return;
      }

      setCurrentIndex((index) => (index + direction + images.length) % images.length);
    },
    [hasMultipleImages, images.length],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, onClose]);

  function handleFocusTrap(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusableElements = getFocusableElements(modalRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) {
      return;
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  return (
    <div className="modal is-open" aria-hidden="false" onKeyDown={handleFocusTrap}>
      <button
        className="modal-backdrop"
        type="button"
        aria-label={labels.close}
        onClick={onClose}
      />
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
      >
        <button
          className="close-modal"
          type="button"
          aria-label={labels.close}
          onClick={onClose}
          ref={closeButtonRef}
        >
          <span aria-hidden="true">x</span>
        </button>
        <div className="modal-grid">
          <div className="modal-gallery">
            <div className="main-img-container">
              {hasMultipleImages ? (
                <button
                  className="modal-nav prev-img"
                  type="button"
                  aria-label={labels.previous}
                  onClick={() => navigate(-1)}
                >
                  <span aria-hidden="true">‹</span>
                </button>
              ) : null}
              <Image
                id="modalMainImg"
                src={currentImage.src}
                alt={`${currentImage.alt[locale]} - ${t("counter", {
                  current: currentIndex + 1,
                  total: images.length,
                })}`}
                fill
                sizes="(max-width: 1024px) 90vw, 55vw"
              />
              {hasMultipleImages ? (
                <button
                  className="modal-nav next-img"
                  type="button"
                  aria-label={labels.next}
                  onClick={() => navigate(1)}
                >
                  <span aria-hidden="true">›</span>
                </button>
              ) : null}
              <div className="modal-counter" aria-live="polite">
                {t("counter", {
                  current: currentIndex + 1,
                  total: images.length,
                })}
              </div>
            </div>
            {hasMultipleImages ? (
              <div className="modal-thumbnails" aria-label={labels.thumbnails}>
                {images.map((image, index) => (
                  <button
                    type="button"
                    className={index === currentIndex ? "active-thumb" : undefined}
                    key={`${venue.id}-${image.src}-${index}`}
                    aria-label={t("thumbnail", { index: index + 1 })}
                    aria-current={index === currentIndex ? "true" : undefined}
                    onClick={() => setCurrentIndex(index)}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      width={110}
                      height={70}
                      sizes="110px"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="modal-details">
            <span className="modal-location">{venue.location[locale]}</span>
            <h2 id={titleId}>{venue.name[locale]}</h2>
            <div className="modal-separator" aria-hidden="true" />
            <p>{venue.fullDescription[locale]}</p>
            <div className="setup-section">
              <h3>{labels.setupsTitle}</h3>
              <div className="modal-setups">
                {(venue.setupItems?.length ? venue.setupItems : []).map((setup) => (
                  <span className="modal-setup-tag" key={setup.id}>
                    <VenueSetupIcon iconKey={setup.iconKey} className="venue-setup-icon" />
                    {setup.name[locale]}
                    {setup.capacity ? ` — ${setup.capacity}` : ""}
                  </span>
                ))}
                {!venue.setupItems?.length
                  ? venue.setups.map((setup) => (
                      <span className="modal-setup-tag" key={setup[locale]}>
                        <VenueSetupIcon className="venue-setup-icon" />
                        {setup[locale]}
                      </span>
                    ))
                  : null}
              </div>
            </div>
            <div className="modal-specs-grid">
              <div className="spec-item">
                <strong>{labels.area}</strong>
                <span>{venue.area}</span>
              </div>
              <div className="spec-item">
                <strong>{labels.capacity}</strong>
                <span>{venue.capacity[locale]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
