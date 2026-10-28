"use client";

import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { EventService } from "@/types/event-service";

type EventServiceImage = EventService["images"][number];

type EventServiceLightboxGalleryProps = {
  images: EventServiceImage[];
  locale: Locale;
  serviceTitle: string;
  labels: {
    eyebrow: string;
    title: string;
    viewAll: string;
    close: string;
    previous: string;
    next: string;
  };
};

const SWIPE_THRESHOLD = 48;

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

export function EventServiceLightboxGallery({
  images,
  locale,
  serviceTitle,
  labels,
}: EventServiceLightboxGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const coverIndex = Math.max(
    images.findIndex((image) => image.isCover),
    0,
  );
  const galleryImages = images.length
    ? [images[coverIndex], ...images.filter((_, index) => index !== coverIndex)]
    : [];
  const visibleImages = galleryImages.slice(0, 5);
  const activeImage = activeIndex === null ? null : galleryImages[activeIndex] ?? null;
  const hasMultipleImages = galleryImages.length > 1;
  const galleryCountClass = `event-service-gallery-mosaic--count-${Math.min(visibleImages.length, 5)}`;

  function openLightbox(index: number, opener: HTMLElement) {
    openerRef.current = opener;
    setActiveIndex(index);
  }

  function closeLightbox() {
    setActiveIndex(null);
    window.setTimeout(() => openerRef.current?.focus(), 0);
  }

  function showPreviousImage() {
    if (!hasMultipleImages) return;

    setActiveIndex((current) => {
      if (current === null || current === 0) return galleryImages.length - 1;
      return current - 1;
    });
  }

  function showNextImage() {
    if (!hasMultipleImages) return;

    setActiveIndex((current) => {
      if (current === null || current === galleryImages.length - 1) return 0;
      return current + 1;
    });
  }

  useEffect(() => {
    if (activeIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, hasMultipleImages, galleryImages.length]);

  function handleFocusTrap(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const focusableElements = getFocusableElements(dialogRef.current);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (images.length === 0) return null;

  return (
    <section className="event-service-gallery-section" aria-labelledby="event-service-gallery-title">
      <div className="event-service-detail-shell">
        <div className="event-service-gallery-heading">
          <div>
            <p className="event-service-detail-eyebrow">{labels.eyebrow}</p>
            <h2 id="event-service-gallery-title">{labels.title}</h2>
          </div>
          <button
            type="button"
            className="event-service-gallery-open"
            aria-label={`${labels.viewAll} - ${serviceTitle}`}
            onClick={(event) => openLightbox(0, event.currentTarget)}
          >
            <span>{labels.viewAll}</span>
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className={`event-service-gallery-mosaic ${galleryCountClass}`}>
          {visibleImages.map((image, visibleIndex) => {
            const imageIndex = galleryImages.findIndex((item) => item.id === image.id);

            return (
              <button
                type="button"
                className={
                  visibleIndex === 0
                    ? "event-service-gallery-image event-service-gallery-image--main"
                    : "event-service-gallery-image"
                }
                aria-label={`${labels.viewAll} - ${visibleIndex + 1}`}
                key={image.id}
                onClick={(event) => openLightbox(imageIndex, event.currentTarget)}
              >
                <Image
                  src={image.imagePath}
                  alt={image.alt[locale]}
                  fill
                  sizes={
                    visibleIndex === 0
                      ? "(max-width: 760px) 100vw, 44vw"
                      : "(max-width: 760px) 50vw, 27vw"
                  }
                />
              </button>
            );
          })}
        </div>
      </div>

      {activeImage ? (
        <div
          className="event-service-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby="event-service-lightbox-title"
          ref={dialogRef}
          onKeyDown={handleFocusTrap}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <header className="event-service-lightbox__header">
            <h2 id="event-service-lightbox-title">{serviceTitle}</h2>
            <p>{(activeIndex ?? 0) + 1} / {galleryImages.length}</p>
            <button
              type="button"
              className="event-service-lightbox__close"
              aria-label={labels.close}
              onClick={closeLightbox}
              ref={closeButtonRef}
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div
            className="event-service-lightbox__stage"
            onTouchStart={(event) => {
              touchStartXRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const startX = touchStartXRef.current;
              const endX = event.changedTouches[0]?.clientX ?? null;
              touchStartXRef.current = null;

              if (startX === null || endX === null || !hasMultipleImages) return;

              const distance = startX - endX;
              if (Math.abs(distance) < SWIPE_THRESHOLD) return;
              if (distance > 0) showNextImage();
              else showPreviousImage();
            }}
          >
            {hasMultipleImages ? (
              <button
                type="button"
                className="event-service-lightbox__arrow event-service-lightbox__arrow--previous"
                aria-label={labels.previous}
                onClick={showPreviousImage}
              >
                <ChevronLeft aria-hidden="true" />
              </button>
            ) : null}

            <Image
              src={activeImage.imagePath}
              alt={activeImage.alt[locale]}
              width={1800}
              height={1200}
              sizes="100vw"
              className="event-service-lightbox__image"
            />

            {hasMultipleImages ? (
              <button
                type="button"
                className="event-service-lightbox__arrow event-service-lightbox__arrow--next"
                aria-label={labels.next}
                onClick={showNextImage}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {hasMultipleImages ? (
            <div className="event-service-lightbox__thumbnails" aria-label={labels.eyebrow}>
              {galleryImages.map((image, index) => (
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "event-service-lightbox__thumbnail is-active"
                      : "event-service-lightbox__thumbnail"
                  }
                  aria-current={index === activeIndex ? "true" : undefined}
                  aria-label={`${labels.viewAll} - ${index + 1}`}
                  key={image.id}
                  onClick={() => setActiveIndex(index)}
                >
                  <Image
                    src={image.imagePath}
                    alt=""
                    width={112}
                    height={76}
                    sizes="112px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
