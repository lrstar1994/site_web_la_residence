"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Locale } from "@/lib/i18n/routing";
import type { RestaurantGalleryImage } from "@/types/restaurant-gallery";

type RestaurantGalleryProps = {
  locale: Locale;
  images: RestaurantGalleryImage[];
  featuredImages: RestaurantGalleryImage[];
};

export function RestaurantGallery({
  locale,
  images,
  featuredImages,
}: RestaurantGalleryProps) {
  const content =
    locale === "fr"
      ? {
          eyebrow: "L’ambiance du Privilège",
          title: "Le Privilège en images",
          description:
            "Découvrez l’atmosphère de notre restaurant, nos espaces et quelques-unes des saveurs préparées par notre équipe.",
          empty:
            "La galerie du restaurant sera bientôt disponible.",
          viewAll: "Voir toute la galerie",
          close: "Fermer la galerie",
          previous: "Image précédente",
          next: "Image suivante",
          thumbnails: "Miniatures de la galerie",
        }
      : {
          eyebrow: "The atmosphere of Le Privilège",
          title: "Le Privilège in pictures",
          description:
            "Discover the atmosphere of our restaurant, our spaces and some of the flavours prepared by our team.",
          empty:
            "The restaurant gallery will be available soon.",
          viewAll: "View full gallery",
          close: "Close gallery",
          previous: "Previous image",
          next: "Next image",
          thumbnails: "Gallery thumbnails",
        };

  const activeImages = useMemo(
    () =>
      [...images]
        .filter((image) => image.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [images],
  );

  const previewImages = useMemo(() => {
    const featured = [...featuredImages]
      .filter((image) => image.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return featured.length > 0
      ? featured.slice(0, 5)
      : activeImages.slice(0, 5);
  }, [featuredImages, activeImages]);

  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentImage =
    activeImages[currentIndex] ?? null;

  const openGallery = useCallback(
    (index = 0) => {
      if (activeImages.length === 0) {
        return;
      }

      setCurrentIndex(
        Math.max(
          0,
          Math.min(
            index,
            activeImages.length - 1,
          ),
        ),
      );

      setIsOpen(true);
    },
    [activeImages.length],
  );

  const closeGallery = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showPrevious = useCallback(() => {
    setCurrentIndex((current) =>
      current === 0
        ? activeImages.length - 1
        : current - 1,
    );
  }, [activeImages.length]);

  const showNext = useCallback(() => {
    setCurrentIndex((current) =>
      current === activeImages.length - 1
        ? 0
        : current + 1,
    );
  }, [activeImages.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeGallery();
      }

      if (event.key === "ArrowLeft") {
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        showNext();
      }
    }

    document.body.style.overflow = "hidden";

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.body.style.overflow = "";

      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    isOpen,
    closeGallery,
    showPrevious,
    showNext,
  ]);

  if (activeImages.length === 0) {
    return (
      <section
        className="restaurant-gallery-section"
        aria-labelledby="restaurant-gallery-title"
      >
        <div className="container">
          <div className="section-header center restaurant-gallery-heading">
            <p className="subtitle">
              {content.eyebrow}
            </p>

            <h2 id="restaurant-gallery-title">
              {content.title}
            </h2>

            <p className="description">
              {content.description}
            </p>
          </div>

          <div className="restaurant-gallery-empty">
            <p>{content.empty}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className="restaurant-gallery-section"
        aria-labelledby="restaurant-gallery-title"
      >
        <div className="container">
          <div className="section-header center restaurant-gallery-heading">
            <p className="subtitle">
              {content.eyebrow}
            </p>

            <h2 id="restaurant-gallery-title">
              {content.title}
            </h2>

            <p className="description">
              {content.description}
            </p>
          </div>

          <div className="restaurant-gallery-grid">
            {previewImages.map(
              (image, index) => {
                const realIndex =
                  activeImages.findIndex(
                    (item) =>
                      item.id === image.id,
                  );

                return (
                  <button
                    type="button"
                    key={image.id}
                    className={`restaurant-gallery-item restaurant-gallery-item-${index + 1}`}
                    onClick={() =>
                      openGallery(
                        realIndex >= 0
                          ? realIndex
                          : 0,
                      )
                    }
                  >
                    <Image
                      src={image.imagePath}
                      alt={image.alt[locale]}
                      fill
                      sizes={
                        index === 0
                          ? "(max-width: 768px) 92vw, 50vw"
                          : "(max-width: 768px) 72vw, 25vw"
                      }
                      className="restaurant-gallery-image"
                    />

                    <span
                      className="restaurant-gallery-item-overlay"
                      aria-hidden="true"
                    />
                  </button>
                );
              },
            )}
          </div>

          {activeImages.length > 5 ? (
            <div className="restaurant-gallery-actions">
              <button
                className="restaurant-gallery-view-all"
                type="button"
                onClick={() => openGallery(0)}
              >
                {content.viewAll}

                <span aria-hidden="true">
                  →
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {isOpen && currentImage ? (
        <div
          className="restaurant-gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={content.title}
        >
          <div
            className="restaurant-gallery-lightbox-backdrop"
            onClick={closeGallery}
            aria-hidden="true"
          />

          <div className="restaurant-gallery-lightbox-panel">
            <button
              type="button"
              className="restaurant-gallery-lightbox-close"
              aria-label={content.close}
              onClick={closeGallery}
            >
              ×
            </button>

            <div className="restaurant-gallery-lightbox-main">
              {activeImages.length > 1 ? (
                <button
                  type="button"
                  className="restaurant-gallery-lightbox-arrow previous"
                  aria-label={content.previous}
                  onClick={showPrevious}
                >
                  ‹
                </button>
              ) : null}

              <div className="restaurant-gallery-lightbox-image-wrap">
                <Image
                  src={currentImage.imagePath}
                  alt={currentImage.alt[locale]}
                  fill
                  sizes="100vw"
                  className="restaurant-gallery-lightbox-image"
                  priority
                />
              </div>

              {activeImages.length > 1 ? (
                <button
                  type="button"
                  className="restaurant-gallery-lightbox-arrow next"
                  aria-label={content.next}
                  onClick={showNext}
                >
                  ›
                </button>
              ) : null}
            </div>

            <div className="restaurant-gallery-lightbox-counter">
              {currentIndex + 1} /{" "}
              {activeImages.length}
            </div>

            {activeImages.length > 1 ? (
              <div
                className="restaurant-gallery-lightbox-thumbnails"
                aria-label={content.thumbnails}
              >
                {activeImages.map(
                  (image, index) => (
                    <button
                      type="button"
                      key={image.id}
                      className={`restaurant-gallery-lightbox-thumb ${
                        currentIndex === index
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() =>
                        setCurrentIndex(index)
                      }
                      aria-label={`${index + 1} / ${activeImages.length}`}
                    >
                      <Image
                        src={image.imagePath}
                        alt=""
                        fill
                        sizes="90px"
                        className="restaurant-gallery-lightbox-thumb-image"
                      />
                    </button>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}