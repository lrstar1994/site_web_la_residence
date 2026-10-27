"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { VenueImage } from "@/types/venue";

type VenueLightboxGalleryLabels = {
  gallery: string;
  noImages: string;
  viewPhotos: string;
  viewPhotosCount: string;
  closeGallery: string;
  previousImage: string;
  nextImage: string;
};

type VenueLightboxGalleryProps = {
  images: VenueImage[];
  locale: Locale;
  venueName: string;
  heading?: string;
  labels: VenueLightboxGalleryLabels;
};

const SWIPE_THRESHOLD = 48;

export function VenueLightboxGallery({
  images,
  locale,
  venueName,
  heading,
  labels,
}: VenueLightboxGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const coverImage = images.find((image) => image.isCover) ?? images[0] ?? null;
  const coverImageIndex = coverImage
    ? Math.max(
        images.findIndex((image) => image.id === coverImage.id),
        0,
      )
    : 0;
  const secondaryImages = images
    .filter((image) => image.id !== coverImage?.id)
    .slice(0, 2);
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;
  const activeImage = activeIndex === null ? null : images[activeIndex] ?? null;
  const photoLabel = hasMultipleImages ? labels.viewPhotosCount : labels.viewPhotos;

  function openLightbox(index: number, opener: HTMLElement) {
    openerRef.current = opener;
    setActiveIndex(index);
  }

  function closeLightbox() {
    setActiveIndex(null);
    window.setTimeout(() => {
      openerRef.current?.focus();
    }, 0);
  }

  function showPreviousImage() {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return 0;
      }

      return currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    });
  }

  function showNextImage() {
    if (!hasMultipleImages) {
      return;
    }

    setActiveIndex((currentIndex) => {
      if (currentIndex === null) {
        return 0;
      }

      return currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    });
  }

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
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
  }, [activeIndex, hasMultipleImages, images.length]);

  if (!coverImage) {
    return (
      <section className="venue-detail-gallery" aria-labelledby="venue-detail-gallery-title">
        <h2 className="sr-only" id="venue-detail-gallery-title">
          {labels.gallery}
        </h2>
        <div className="venue-detail-image-placeholder">{labels.noImages}</div>
      </section>
    );
  }

  return (
    <section className="venue-detail-gallery" aria-labelledby="venue-detail-gallery-title">
      {heading ? (
        <div className="venue-event-gallery-heading">
          <h2 id="venue-detail-gallery-title">{heading}</h2>
          {hasImages ? (
            <button
              type="button"
              className="venue-event-gallery-action"
              aria-label={`${photoLabel} - ${venueName}`}
              onClick={(event) => openLightbox(0, event.currentTarget)}
            >
              <span>{photoLabel}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M5 12h13M13 6l6 6-6 6" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : (
        <h2 className="sr-only" id="venue-detail-gallery-title">
          {labels.gallery}
        </h2>
      )}
      <div
        className={
          secondaryImages.length > 0
            ? "venue-detail-mosaic"
            : "venue-detail-mosaic venue-detail-mosaic--single"
        }
      >
        <div className="venue-detail-main-image">
          <button
            type="button"
            className="venue-detail-image-button"
            onClick={(event) => openLightbox(coverImageIndex, event.currentTarget)}
          >
            <Image
              src={coverImage.imagePath}
              alt={coverImage.alt[locale]}
              width={1280}
              height={820}
              priority
              sizes="(max-width: 900px) 100vw, 68vw"
            />
          </button>
        </div>
        {secondaryImages.length > 0 ? (
          <div className="venue-detail-side-images">
            {secondaryImages.map((image) => {
              const imageIndex = images.findIndex((item) => item.id === image.id);

              return (
                <div className="venue-detail-side-image" key={image.id}>
                  <button
                    type="button"
                    className="venue-detail-image-button"
                    onClick={(event) => openLightbox(imageIndex, event.currentTarget)}
                  >
                    <Image
                      src={image.imagePath}
                      alt={image.alt[locale]}
                      width={520}
                      height={380}
                      sizes="(max-width: 900px) 42vw, 26vw"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
        {hasMultipleImages ? (
          <button
            type="button"
            className="venue-detail-gallery-link"
            aria-label={`${photoLabel} - ${venueName}`}
            onClick={(event) => openLightbox(0, event.currentTarget)}
          >
            <span className="sr-only">{photoLabel}</span>
          </button>
        ) : null}
      </div>

      {activeImage ? (
        <div
          className="venue-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby="venue-lightbox-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <div className="venue-lightbox__header">
            <h2 id="venue-lightbox-title">{venueName}</h2>
            <p>
              {(activeIndex ?? 0) + 1} / {images.length}
            </p>
            <button
              type="button"
              className="venue-lightbox__close"
              aria-label={labels.closeGallery}
              onClick={closeLightbox}
              ref={closeButtonRef}
            >
              ×
            </button>
          </div>

          <div
            className="venue-lightbox__stage"
            onTouchStart={(event) => {
              touchStartXRef.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const touchStartX = touchStartXRef.current;
              const touchEndX = event.changedTouches[0]?.clientX ?? null;
              touchStartXRef.current = null;

              if (touchStartX === null || touchEndX === null || !hasMultipleImages) {
                return;
              }

              const distance = touchStartX - touchEndX;

              if (Math.abs(distance) < SWIPE_THRESHOLD) {
                return;
              }

              if (distance > 0) {
                showNextImage();
              } else {
                showPreviousImage();
              }
            }}
          >
            {hasMultipleImages ? (
              <button
                type="button"
                className="venue-lightbox__arrow venue-lightbox__arrow--previous"
                aria-label={labels.previousImage}
                onClick={showPreviousImage}
              >
                ‹
              </button>
            ) : null}

            <Image
              src={activeImage.imagePath}
              alt={activeImage.alt[locale]}
              width={1800}
              height={1200}
              sizes="100vw"
              className="venue-lightbox__image"
            />

            {hasMultipleImages ? (
              <button
                type="button"
                className="venue-lightbox__arrow venue-lightbox__arrow--next"
                aria-label={labels.nextImage}
                onClick={showNextImage}
              >
                ›
              </button>
            ) : null}
          </div>

          {hasMultipleImages ? (
            <div className="venue-lightbox__thumbnails" aria-label={labels.gallery}>
              {images.map((image, index) => (
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "venue-lightbox__thumbnail venue-lightbox__thumbnail--active"
                      : "venue-lightbox__thumbnail"
                  }
                  aria-label={`${labels.gallery} ${index + 1}`}
                  aria-current={index === activeIndex ? "true" : undefined}
                  key={image.id}
                  onClick={() => setActiveIndex(index)}
                >
                  <Image
                    src={image.imagePath}
                    alt={image.alt[locale]}
                    width={112}
                    height={78}
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
