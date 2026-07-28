"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n/routing";
import type { RestaurantMenuCardModel } from "@/types/restaurant-menu";

type RestaurantMenuModalProps = {
  menu: RestaurantMenuCardModel;
  locale: Locale;
  labels: {
    close: string;
    previous: string;
    next: string;
    thumbnails: string;
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

export function RestaurantMenuModal({
  menu,
  locale,
  labels,
  onClose,
}: RestaurantMenuModalProps) {
  const t = useTranslations("restaurantPage.menus");
  const [currentIndex, setCurrentIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `restaurant-menu-modal-${menu.id}`;
  const images = menu.images;
  const currentImage = images[currentIndex] ?? images[0];
  const hasMultipleImages = images.length > 1;

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

  if (!currentImage) {
    return null;
  }

  return (
    <div
      className="menu-modal-overlay active"
      onKeyDown={handleFocusTrap}
      role="presentation"
    >
      <button
        type="button"
        className="menu-modal-backdrop"
        aria-label={labels.close}
        onClick={onClose}
      />
      <div
        className="menu-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
      >
        <button
          type="button"
          className="menu-modal-close"
          aria-label={labels.close}
          onClick={onClose}
          ref={closeButtonRef}
        >
          <span aria-hidden="true">x</span>
        </button>
        <div className="menu-modal-body">
          <Image
            src={currentImage.src}
            alt={`${currentImage.alt[locale]} - ${currentIndex + 1} / ${images.length}`}
            width={1100}
            height={1500}
            sizes="96vw"
          />
        </div>
        <div className="menu-modal-header">
          <span className="badge">{menu.label[locale]}</span>
          <h2 id={titleId}>{currentImage.title[locale]}</h2>
          <p>
            {t("modal.counter", {
              current: currentIndex + 1,
              total: images.length,
            })}
          </p>
          {hasMultipleImages ? (
            <div className="menu-modal-thumbs" aria-label={labels.thumbnails}>
              {images.map((image, index) => (
                <button
                  type="button"
                  className={index === currentIndex ? "active" : undefined}
                  key={image.id}
                  aria-label={t("modal.show_image", {
                    index: index + 1,
                  })}
                  aria-current={index === currentIndex ? "true" : undefined}
                  onClick={() => setCurrentIndex(index)}
                >
                  <Image
                    src={image.src}
                    alt=""
                    width={84}
                    height={108}
                    sizes="54px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {hasMultipleImages ? (
          <>
            <button
              type="button"
              className="menu-modal-nav prev"
              aria-label={labels.previous}
              onClick={() => navigate(-1)}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="menu-modal-nav next"
              aria-label={labels.next}
              onClick={() => navigate(1)}
            >
              <span aria-hidden="true">›</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
