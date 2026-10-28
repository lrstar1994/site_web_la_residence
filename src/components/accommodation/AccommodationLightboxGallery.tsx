"use client";

import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent, ReactNode } from "react";

import type { Locale } from "@/lib/i18n/routing";
import type { AccommodationImage } from "@/types/accommodation";

type AccommodationLightboxGalleryLabels = {
  gallery: string;
  noImages: string;
  viewPhotos: string;
  viewPhotosCount: string;
  closeGallery: string;
  previousImage: string;
  nextImage: string;
};

type AccommodationLightboxGalleryProps = {
  images: AccommodationImage[];
  locale: Locale;
  accommodationName: string;
  labels: AccommodationLightboxGalleryLabels;
  children: ReactNode;
};

type GalleryContextValue = {
  images: AccommodationImage[];
  locale: Locale;
  labels: AccommodationLightboxGalleryLabels;
  openLightbox: (index: number, opener: HTMLElement) => void;
};

const GalleryContext = createContext<GalleryContextValue | null>(null);
const SWIPE_THRESHOLD = 48;

function useAccommodationGallery() {
  const context = useContext(GalleryContext);

  if (!context) {
    throw new Error("Accommodation gallery components must be used inside AccommodationLightboxGallery.");
  }

  return context;
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) return [];

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    ),
  );
}

function getOrderedImages(images: AccommodationImage[]) {
  if (images.length === 0) return [];

  const coverIndex = Math.max(
    images.findIndex((image) => image.isCover),
    0,
  );

  return [images[coverIndex], ...images.filter((_, index) => index !== coverIndex)];
}

export function AccommodationLightboxGallery({
  images,
  locale,
  accommodationName,
  labels,
  children,
}: AccommodationLightboxGalleryProps) {
  const orderedImages = useMemo(() => getOrderedImages(images), [images]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const activeImage = activeIndex === null ? null : orderedImages[activeIndex] ?? null;
  const hasMultipleImages = orderedImages.length > 1;

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
      if (current === null || current === 0) return orderedImages.length - 1;
      return current - 1;
    });
  }

  function showNextImage() {
    if (!hasMultipleImages) return;

    setActiveIndex((current) => {
      if (current === null || current === orderedImages.length - 1) return 0;
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
  }, [activeIndex, hasMultipleImages, orderedImages.length]);

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

  return (
    <GalleryContext.Provider value={{ images: orderedImages, locale, labels, openLightbox }}>
      {children}

      {activeImage ? (
        <div
          className="accommodation-lightbox"
          role="dialog"
          aria-modal="true"
          aria-labelledby="accommodation-lightbox-title"
          ref={dialogRef}
          onKeyDown={handleFocusTrap}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeLightbox();
          }}
        >
          <header className="accommodation-lightbox__header">
            <h2 id="accommodation-lightbox-title">{accommodationName}</h2>
            <p>{(activeIndex ?? 0) + 1} / {orderedImages.length}</p>
            <button
              type="button"
              className="accommodation-lightbox__close"
              aria-label={labels.closeGallery}
              onClick={closeLightbox}
              ref={closeButtonRef}
            >
              <X aria-hidden="true" />
            </button>
          </header>

          <div
            className="accommodation-lightbox__stage"
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
                className="accommodation-lightbox__arrow accommodation-lightbox__arrow--previous"
                aria-label={labels.previousImage}
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
              className="accommodation-lightbox__image"
            />

            {hasMultipleImages ? (
              <button
                type="button"
                className="accommodation-lightbox__arrow accommodation-lightbox__arrow--next"
                aria-label={labels.nextImage}
                onClick={showNextImage}
              >
                <ChevronRight aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {hasMultipleImages ? (
            <div className="accommodation-lightbox__thumbnails" aria-label={labels.gallery}>
              {orderedImages.map((image, index) => (
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "accommodation-lightbox__thumbnail accommodation-lightbox__thumbnail--active"
                      : "accommodation-lightbox__thumbnail"
                  }
                  aria-current={index === activeIndex ? "true" : undefined}
                  aria-label={`${labels.gallery} ${index + 1}`}
                  key={image.id}
                  onClick={() => setActiveIndex(index)}
                >
                  <Image src={image.imagePath} alt="" width={112} height={78} sizes="112px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </GalleryContext.Provider>
  );
}

export function AccommodationHeroGallery() {
  const { images, locale, labels, openLightbox } = useAccommodationGallery();
  const visibleImages = images.slice(0, 4);
  const countClass = `accommodation-detail-mosaic--count-${Math.min(visibleImages.length, 4)}`;

  if (images.length === 0) {
    return (
      <section className="accommodation-detail-gallery" aria-label={labels.gallery}>
        <div className="accommodation-detail-image-placeholder">{labels.noImages}</div>
      </section>
    );
  }

  return (
    <section className="accommodation-detail-gallery" aria-label={labels.gallery}>
      <div className={`accommodation-detail-mosaic ${countClass}`}>
        {visibleImages.map((image, index) => (
          <button
            type="button"
            className={
              index === 0
                ? "accommodation-detail-image-button accommodation-detail-image-button--main"
                : "accommodation-detail-image-button"
            }
            aria-label={`${labels.gallery} ${index + 1}`}
            key={image.id}
            onClick={(event) => openLightbox(index, event.currentTarget)}
          >
            <Image
              src={image.imagePath}
              alt={image.alt[locale]}
              fill
              priority={index === 0}
              sizes={index === 0 ? "(max-width: 760px) 100vw, 70vw" : "(max-width: 760px) 72vw, 28vw"}
            />
          </button>
        ))}

        <button
          type="button"
          className="accommodation-detail-gallery-link"
          aria-label={labels.viewPhotosCount}
          onClick={(event) => openLightbox(0, event.currentTarget)}
        >
          <Images aria-hidden="true" size={17} strokeWidth={1.8} />
          <span>{images.length > 1 ? labels.viewPhotosCount : labels.viewPhotos}</span>
        </button>
      </div>
    </section>
  );
}

type AccommodationPhotoGalleryProps = {
  eyebrow: string;
  title: string;
};

export function AccommodationPhotoGallery({ eyebrow, title }: AccommodationPhotoGalleryProps) {
  const { images, locale, labels, openLightbox } = useAccommodationGallery();

  if (images.length < 2) return null;

  const visibleImages = images.slice(0, 5);

  return (
    <section className="accommodation-detail-photo-gallery" aria-labelledby="accommodation-photo-gallery-title">
      <div className="accommodation-detail-section-heading">
        <div>
          <p className="section-eyebrow">{eyebrow}</p>
          <h2 id="accommodation-photo-gallery-title">{title}</h2>
        </div>
        <button
          type="button"
          className="accommodation-detail-section-link"
          onClick={(event) => openLightbox(0, event.currentTarget)}
        >
          <span>{images.length > 1 ? labels.viewPhotosCount : labels.viewPhotos}</span>
          <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
        </button>
      </div>

      <div className={`accommodation-detail-photo-strip accommodation-detail-photo-strip--count-${visibleImages.length}`}>
        {visibleImages.map((image, index) => (
          <button
            type="button"
            className="accommodation-detail-photo-tile"
            aria-label={`${labels.gallery} ${index + 1}`}
            key={image.id}
            onClick={(event) => openLightbox(index, event.currentTarget)}
          >
            <Image
              src={image.imagePath}
              alt={image.alt[locale]}
              fill
              sizes="(max-width: 760px) 72vw, 20vw"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
