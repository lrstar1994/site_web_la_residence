"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import type { KeyboardEvent } from "react";

type AdminConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: "default" | "danger";
  pendingLabel?: string;
  pending?: boolean;
  confirmDisabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
};

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

export function AdminConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "default",
  pendingLabel = "Traitement...",
  pending = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const pendingRef = useRef(pending);

  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!pendingRef.current) onCancel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [onCancel]);

  function handleFocusTrap(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(dialogRef.current);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="admin-confirm-layer" onKeyDown={handleFocusTrap}>
      <button
        className="admin-confirm-backdrop"
        type="button"
        aria-label={cancelLabel}
        disabled={pending}
        onClick={onCancel}
      />
      <section
        className={`admin-confirm-dialog ${variant}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        ref={dialogRef}
      >
        <div className={`admin-confirm-dialog-icon ${variant}`} aria-hidden="true">!</div>
        <div className="admin-confirm-dialog-content">
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
          {children}
        </div>
        <div className="admin-confirm-actions">
          <button
            className="admin-confirm-button secondary"
            type="button"
            disabled={pending}
            ref={cancelButtonRef}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={`admin-confirm-button ${variant} ${variant === "danger" ? "admin-confirm-dialog-danger" : ""}`}
            type="button"
            disabled={pending || confirmDisabled}
            onClick={onConfirm}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
