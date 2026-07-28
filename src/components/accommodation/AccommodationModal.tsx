"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { KeyboardEvent } from "react";
import type { Locale } from "@/lib/i18n/routing";
import { AccommodationFeatureIcon } from "@/components/accommodation/AccommodationFeatureIcon";
import type { AccommodationModalLabels } from "@/components/accommodation/AccommodationExplorer";
import { getAccommodationGalleryImageAlt } from "@/lib/seo/accommodation-alt";
import type { AccommodationCardModel, AccommodationFeature } from "@/types/accommodation";

type AccommodationModalProps = {
  accommodation: AccommodationCardModel;
  locale: Locale;
  labels: AccommodationModalLabels;
  whatsappBaseUrl: string;
  onlineBookingUrl: string;
  onClose: () => void;
};

function buildWhatsAppUrl(
  baseUrl: string,
  message: string,
) {
  const separator = baseUrl.includes("?") ? "&" : "?";

  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}

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

function getGroupFeatures(accommodation: AccommodationCardModel, code: "assets" | "essentials" | "residence-benefits") {
  return accommodation.featureGroups?.find((group) => group.code === code)?.features ?? [];
}

function getFeatureLabel(feature: AccommodationFeature, locale: Locale) {
  return feature.customLabel[locale] ?? feature.name[locale];
}

export function AccommodationModal({
  accommodation,
  locale,
  labels,
  whatsappBaseUrl,
  onlineBookingUrl,
  onClose,
}: AccommodationModalProps) {
  const t = useTranslations("accommodationPage.modal");
  const images = accommodation.images.length
    ? accommodation.images
    : ["/hebergement.jpeg"];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `accommodation-modal-${accommodation.id}`;
  const hasMultipleImages = images.length > 1;
  const currentImage = images[currentImageIndex] ?? images[0];
  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl(
        whatsappBaseUrl,
        t("whatsapp_message", {
          name: accommodation.name[locale],
        }),
      ),
    [accommodation, locale, t, whatsappBaseUrl],
  );
  const assetFeatures = getGroupFeatures(accommodation, "assets");
  const essentialFeatures = getGroupFeatures(accommodation, "essentials");
  const benefitFeatures = getGroupFeatures(accommodation, "residence-benefits");

  const goToPreviousImage = useCallback(() => {
    setCurrentImageIndex((index) => (index - 1 + images.length) % images.length);
  }, [images.length]);

  const goToNextImage = useCallback(() => {
    setCurrentImageIndex((index) => (index + 1) % images.length);
  }, [images.length]);

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

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        event.preventDefault();
        goToPreviousImage();
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        event.preventDefault();
        goToNextImage();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNextImage, goToPreviousImage, hasMultipleImages, onClose]);

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
    <div
      className="bk-modal bk-premium-modal active"
      aria-hidden="false"
      onKeyDown={handleFocusTrap}
    >
      <button
        className="bk-backdrop"
        type="button"
        aria-label={labels.close}
        onClick={onClose}
      />
      <article
        className="bk-poster-card bk-premium-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
      >
        <button
          className="bk-close"
          type="button"
          aria-label={labels.close}
          onClick={onClose}
          ref={closeButtonRef}
        >
          ×
        </button>

        <div className="bk-modal-scroll bk-premium-layout">
          <section className="bk-gallery bk-premium-gallery" aria-label={labels.galleryLabel}>
            <div className="bk-main-stage">
              <Image
                className="bk-main-img"
                src={currentImage}
                alt={getAccommodationGalleryImageAlt(
                  accommodation,
                  locale,
                  currentImageIndex,
                  images.length,
                )}
                width={980}
                height={620}
                sizes="(max-width: 900px) 92vw, 72vw"
              />
              <div className="bk-logo-medallion" aria-hidden="true">
                <Image
                  src="/logo_la_residence_ankerana_transparent.png"
                  alt=""
                  width={210}
                  height={90}
                  className="bk-logo-img"
                />
              </div>
              {hasMultipleImages ? (
                <>
                  <button
                    className="bk-nav bk-prev"
                    type="button"
                    aria-label={labels.previousImage}
                    onClick={goToPreviousImage}
                  >
                    ‹
                  </button>
                  <button
                    className="bk-nav bk-next"
                    type="button"
                    aria-label={labels.nextImage}
                    onClick={goToNextImage}
                  >
                    ›
                  </button>
                </>
              ) : null}
              <div className="bk-img-counter" aria-live="polite">
                {t("image_counter", {
                  current: currentImageIndex + 1,
                  total: images.length,
                })}
              </div>
            </div>
            {hasMultipleImages ? (
              <div className="bk-thumbs" aria-label={labels.galleryLabel}>
                {images.map((image, index) => (
                  <button
                    className={
                      index === currentImageIndex
                        ? "bk-thumb active"
                        : "bk-thumb"
                    }
                    type="button"
                    key={`${accommodation.id}-${image}-${index}`}
                    aria-label={getAccommodationGalleryImageAlt(
                      accommodation,
                      locale,
                      index,
                      images.length,
                    )}
                    onClick={() => setCurrentImageIndex(index)}
                  >
                    <Image
                      src={image}
                      alt=""
                      width={140}
                      height={100}
                      sizes="120px"
                    />
                  </button>
                ))}
              </div>
            ) : null}
            <a
              className="bk-online-booking"
              href={onlineBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels.bookOnline}
            >
              <span>{labels.bookOnline}</span>
              <small>{labels.bookOnlineDescription}</small>
            </a>
          </section>

          <div className="bk-info-panel bk-premium-info-panel">
            <div className="bk-info-scroll">
              <div className="bk-poster-body">
                <div className="bk-poster-intro">
                  <span className="bk-fiche-cat">{accommodation.category[locale]}</span>
                  <div className="bk-fiche-sep" aria-hidden="true">
                    <span className="bk-fiche-sep-line" />
                    <span className="bk-fiche-sep-diamond" />
                    <span className="bk-fiche-sep-line" />
                  </div>
                  <h2 className="bk-fiche-title" id={titleId}>
                    {accommodation.name[locale]}
                  </h2>
                  <div className="bk-fiche-specs" aria-label={accommodation.name[locale]}>
                    <span className="bk-fiche-spec">
                      <span aria-hidden="true">01</span>
                      {accommodation.subtitle[locale]}
                    </span>
                    <span className="bk-fiche-spec">
                      <span aria-hidden="true">02</span>
                      {accommodation.capacity[locale]}
                    </span>
                    <span className="bk-fiche-spec">
                      <span aria-hidden="true">03</span>
                      {accommodation.surface}
                    </span>
                  </div>
                </div>

                <section className="bk-info-section">
                  <div className="bk-atouts-header">{labels.highlights}</div>
                  <div className="bk-atouts-list">
                    {assetFeatures.length > 0
                      ? assetFeatures.map((feature) => (
                          <div className="bk-atout-row" key={feature.id}>
                            <AccommodationFeatureIcon iconKey={feature.iconKey} className="bk-atout-ico" />
                            <span>{getFeatureLabel(feature, locale)}</span>
                          </div>
                        ))
                      : accommodation.atouts.map((item) => (
                          <div className="bk-atout-row" key={item[locale]}>
                            <AccommodationFeatureIcon className="bk-atout-ico" />
                            <span>{item[locale]}</span>
                          </div>
                        ))}
                  </div>
                </section>
              </div>

              <div className="bk-poster-amenities">
                <section className="bk-info-section">
                  <div className="bk-essentiels-title">{labels.essentials}</div>
                  <div className="bk-essentiels-grid">
                    {essentialFeatures.length > 0
                      ? essentialFeatures.map((feature) => (
                          <div className="bk-ess-item" key={feature.id}>
                            <AccommodationFeatureIcon iconKey={feature.iconKey} className="bk-amenity-icon" />
                            <span>{getFeatureLabel(feature, locale)}</span>
                          </div>
                        ))
                      : accommodation.essentials.map((item) => (
                          <div className="bk-ess-item" key={item[locale]}>
                            <AccommodationFeatureIcon className="bk-amenity-icon" />
                            <span>{item[locale]}</span>
                          </div>
                        ))}
                  </div>
                </section>

                <section className="bk-info-section">
                  <div className="bk-plus-title">{labels.residenceBenefits}</div>
                  <div className="bk-plus-grid">
                    {benefitFeatures.length > 0
                      ? benefitFeatures.map((feature) => (
                          <div className="bk-plus-item" key={feature.id}>
                            <AccommodationFeatureIcon iconKey={feature.iconKey} className="bk-amenity-icon" />
                            <span>{getFeatureLabel(feature, locale)}</span>
                          </div>
                        ))
                      : accommodation.plus.map((item) => (
                          <div className="bk-plus-item" key={item[locale]}>
                            <AccommodationFeatureIcon className="bk-amenity-icon" />
                            <span>{item[locale]}</span>
                          </div>
                        ))}
                  </div>
                </section>
              </div>
            </div>

            <div className="bk-booking-bar">
              <div className="bk-booking-price">
                <span>{labels.from}</span>
                <strong>{accommodation.price}</strong>
                <span>{labels.unit}</span>
              </div>
              <a
                className="bk-whatsapp-cta"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={labels.whatsappButton}
              >
                <span className="bk-wa-left">
                  <span className="bk-wa-icon" aria-hidden="true">
                    wa
                  </span>
                  <span>{labels.whatsappButton}</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
