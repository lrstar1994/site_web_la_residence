"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import type { NewsArticle } from "@/data/news";
import type { Locale } from "@/lib/i18n/routing";

type NewsModalProps = {
  article: NewsArticle;
  locale: Locale;
  categoryLabel: string;
  formattedDate: string;
  labels: {
    close: string;
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

export function NewsModal({
  article,
  locale,
  categoryLabel,
  formattedDate,
  labels,
  onClose,
}: NewsModalProps) {
  const modalRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = `news-modal-${article.id}`;
  const paragraphs = article.content[locale].split("\n\n");

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
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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
    <div className="news-modal-layer" onKeyDown={handleFocusTrap}>
      <button
        className="news-modal-backdrop"
        type="button"
        aria-label={labels.close}
        onClick={onClose}
      />
      <article
        className="news-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
      >
        <button
          className="news-modal-close"
          type="button"
          aria-label={labels.close}
          onClick={onClose}
          ref={closeButtonRef}
        >
          <span aria-hidden="true">×</span>
        </button>
        <div className="news-modal-hero">
          <Image
            src={article.image}
            alt={article.alt[locale]}
            fill
            sizes="(max-width: 900px) 92vw, 920px"
          />
        </div>
        <div className="news-modal-content">
          <span className="news-modal-category">{categoryLabel}</span>
          <time className="news-modal-date" dateTime={article.publishedAt}>
            {formattedDate}
          </time>
          <h2 className="news-modal-title" id={titleId}>
            {article.title[locale]}
          </h2>
          <p className="news-modal-lead">{article.excerpt[locale]}</p>
          <div className="news-modal-body">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
