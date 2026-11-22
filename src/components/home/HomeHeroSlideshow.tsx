"use client";

import NextImage from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type HomeHeroSlide = {
  id: string;
  src: string;
  alt: string;
};

type HomeHeroSlideshowProps = {
  images: HomeHeroSlide[];
  fallbackAlt: string;
};

const FALLBACK_IMAGE = "/hero-accueil5.jpeg";
const SLIDE_DURATION_MS = 10_000;
const FADE_DURATION_MS = 1100;

export function HomeHeroSlideshow({
  images,
  fallbackAlt,
}: HomeHeroSlideshowProps) {
  const slides = useMemo<HomeHeroSlide[]>(
    () =>
      images.length > 0
        ? images.slice(0, 6)
        : [{ id: "fallback", src: FALLBACK_IMAGE, alt: fallbackAlt }],
    [fallbackAlt, images],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [, setFailedIds] = useState<Set<string>>(() => new Set());
  const [forceFallback, setForceFallback] = useState(false);
  const clearPreviousTimer = useRef<number | null>(null);

  const visibleSlides = useMemo<HomeHeroSlide[]>(
    () =>
      forceFallback
        ? [{ id: "fallback", src: FALLBACK_IMAGE, alt: fallbackAlt }]
        : slides,
    [fallbackAlt, forceFallback, slides],
  );
  const safeCurrentIndex = currentIndex % visibleSlides.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(query.matches);
    const updateVisibility = () => setIsPageVisible(!document.hidden);

    updatePreference();
    updateVisibility();
    query.addEventListener("change", updatePreference);
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      query.removeEventListener("change", updatePreference);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    if (visibleSlides.length <= 1 || prefersReducedMotion || !isPageVisible) {
      return;
    }

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => {
        const next = (current + 1) % visibleSlides.length;
        setPreviousIndex(current % visibleSlides.length);
        return next;
      });
    }, SLIDE_DURATION_MS);

    return () => window.clearInterval(interval);
  }, [isPageVisible, prefersReducedMotion, visibleSlides.length]);

  useEffect(() => {
    if (previousIndex === null) return;

    if (clearPreviousTimer.current !== null) {
      window.clearTimeout(clearPreviousTimer.current);
    }

    clearPreviousTimer.current = window.setTimeout(() => {
      setPreviousIndex(null);
      clearPreviousTimer.current = null;
    }, FADE_DURATION_MS);

    return () => {
      if (clearPreviousTimer.current !== null) {
        window.clearTimeout(clearPreviousTimer.current);
        clearPreviousTimer.current = null;
      }
    };
  }, [previousIndex]);

  useEffect(() => {
    if (visibleSlides.length <= 1 || forceFallback) return;
    const nextIndex = (safeCurrentIndex + 1) % visibleSlides.length;
    const preload = new window.Image();
    preload.src = visibleSlides[nextIndex].src;
  }, [forceFallback, safeCurrentIndex, visibleSlides]);

  function handleImageError(slideId: string) {
    setFailedIds((current) => {
      const next = new Set(current);
      next.add(slideId);

      if (next.size >= slides.length) {
        setForceFallback(true);
        setCurrentIndex(0);
        setPreviousIndex(null);
      } else {
        setPreviousIndex(null);
        setCurrentIndex((currentIndexValue) => {
          for (let offset = 1; offset <= slides.length; offset += 1) {
            const candidate = (currentIndexValue + offset) % slides.length;
            if (!next.has(slides[candidate].id)) return candidate;
          }
          return 0;
        });
      }

      return next;
    });
  }

  const currentSlide = visibleSlides[safeCurrentIndex];
  const previousSlide =
    previousIndex !== null && visibleSlides[previousIndex]
      ? visibleSlides[previousIndex]
      : null;

  return (
    <div className="home-hero-slideshow" aria-live="off">
      {previousSlide ? (
        <div className="home-hero-slide home-hero-slide--previous" aria-hidden="true">
          <NextImage
            src={previousSlide.src}
            alt=""
            fill
            sizes="100vw"
            className="hero-img"
          />
        </div>
      ) : null}
      <div
        className={`home-hero-slide ${previousSlide ? "home-hero-slide--entering" : "home-hero-slide--current"}`}
        key={currentSlide.id}
      >
        <NextImage
          src={currentSlide.src}
          alt={currentSlide.alt || fallbackAlt}
          fill
          priority={safeCurrentIndex === 0}
          sizes="100vw"
          className="hero-img"
          onError={() => handleImageError(currentSlide.id)}
        />
      </div>
    </div>
  );
}
