"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventServiceModalProps = {
  service: EventService;
  locale: Locale;
  labels: {
    requestQuote: string;
    closeDetails: string;
    previousImage: string;
    nextImage: string;
    thumbnail: string;
  };
  onClose: () => void;
  onRequestQuote: (service: EventService) => void;
};

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

export function EventServiceModal({
  service,
  locale,
  labels,
  onClose,
  onRequestQuote,
}: EventServiceModalProps) {
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `event-service-modal-${service.id}`;
  const images = service.images.length > 0
    ? service.images
    : service.imagePath
      ? [
          {
            id: `${service.id}-legacy-image`,
            imagePath: service.imagePath,
            alt: service.imageAlt,
            sortOrder: 0,
            isCover: true,
          },
        ]
      : [];
  const coverIndex = Math.max(0, images.findIndex((image) => image.isCover));
  const [activeIndex, setActiveIndex] = useState(coverIndex);
  const activeImage = images[activeIndex] ?? images[0] ?? null;

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

      if (images.length > 1 && event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveIndex((current) => (current - 1 + images.length) % images.length);
      }

      if (images.length > 1 && event.key === "ArrowRight") {
        event.preventDefault();
        setActiveIndex((current) => (current + 1) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  function handleFocusTrap(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(modalRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  function previousImage() {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  }

  function nextImage() {
    setActiveIndex((current) => (current + 1) % images.length);
  }

  return (
    <div className="event-service-modal-layer" onKeyDown={handleFocusTrap}>
      <button
        className="event-service-modal-backdrop"
        type="button"
        aria-label={labels.closeDetails}
        onClick={onClose}
      />
      <article
        className="event-service-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
      >
        <button
          className="event-service-modal-close"
          type="button"
          aria-label={labels.closeDetails}
          onClick={onClose}
          ref={closeButtonRef}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="event-service-modal-gallery">
          <div className="event-service-modal-main-image">
            {activeImage ? (
              <Image
                src={activeImage.imagePath}
                alt={activeImage.alt[locale]}
                fill
                sizes="(max-width: 900px) 92vw, 560px"
              />
            ) : (
              <span>Image indisponible</span>
            )}
            {images.length > 1 ? (
              <>
                <span className="event-service-modal-counter">
                  {activeIndex + 1} / {images.length}
                </span>
                <button
                  className="event-service-modal-arrow previous"
                  type="button"
                  aria-label={labels.previousImage}
                  onClick={previousImage}
                >
                  ‹
                </button>
                <button
                  className="event-service-modal-arrow next"
                  type="button"
                  aria-label={labels.nextImage}
                  onClick={nextImage}
                >
                  ›
                </button>
              </>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="event-service-modal-thumbnails">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  className={index === activeIndex ? "is-active" : ""}
                  aria-label={`${labels.thumbnail} ${index + 1}`}
                  aria-current={index === activeIndex}
                  onClick={() => setActiveIndex(index)}
                >
                  <Image src={image.imagePath} alt="" fill sizes="72px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="event-service-modal-content">
          <h2 id={titleId}>{service.title[locale]}</h2>
          <p>{service.description[locale]}</p>
          <button
            className="event-service-modal-quote"
            type="button"
            onClick={() => onRequestQuote(service)}
          >
            {labels.requestQuote}
          </button>
        </div>
      </article>
    </div>
  );
}
