"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

type AdminNewsFormActionsProps = {
  mode: "create" | "edit";
  onIntentChange: (intent: string) => void;
};

function SubmitButton({
  value,
  children,
  tone = "secondary",
  onIntentChange,
}: {
  value: string;
  children: string;
  tone?: "primary" | "secondary" | "danger";
  onIntentChange: (intent: string) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`admin-news-form-button ${tone}`}
      type="submit"
      name="intent"
      value={value}
      disabled={pending}
      onClick={() => onIntentChange(value)}
    >
      {pending ? "Enregistrement..." : children}
    </button>
  );
}

export function AdminNewsFormActions({ mode, onIntentChange }: AdminNewsFormActionsProps) {
  const [archiveOpen, setArchiveOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (archiveOpen) cancelRef.current?.focus();
  }, [archiveOpen]);

  return (
    <div className="admin-news-form-actions">
      {mode === "create" ? (
        <>
          <SubmitButton value="draft" onIntentChange={onIntentChange}>
            Enregistrer comme brouillon
          </SubmitButton>
          <SubmitButton value="publish" tone="primary" onIntentChange={onIntentChange}>
            Publier maintenant
          </SubmitButton>
          <SubmitButton value="schedule" onIntentChange={onIntentChange}>
            Programmer
          </SubmitButton>
        </>
      ) : (
        <>
          <SubmitButton value="save" tone="primary" onIntentChange={onIntentChange}>
            Enregistrer les modifications
          </SubmitButton>
          <SubmitButton value="publish" onIntentChange={onIntentChange}>
            Publier maintenant
          </SubmitButton>
          <SubmitButton value="schedule" onIntentChange={onIntentChange}>
            Programmer
          </SubmitButton>
          <button
            className="admin-news-form-button danger"
            type="button"
            disabled={pending}
            onClick={() => setArchiveOpen(true)}
          >
            Archiver
          </button>
        </>
      )}
      {archiveOpen ? (
        <div className="admin-news-archive-layer" role="presentation">
          <button
            className="admin-news-archive-backdrop"
            type="button"
            aria-label="Annuler l'archivage"
            onClick={() => setArchiveOpen(false)}
          />
          <section
            className="admin-news-archive-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-news-archive-title"
          >
            <h2 id="admin-news-archive-title">Archiver cet article ?</h2>
            <p>Il ne sera plus visible sur le site public.</p>
            <div className="admin-news-archive-actions">
              <button
                className="admin-news-form-button danger"
                type="submit"
                name="intent"
                value="archive"
                disabled={pending}
                onClick={() => onIntentChange("archive")}
              >
                Confirmer l&apos;archivage
              </button>
              <button
                className="admin-news-form-button secondary"
                type="button"
                ref={cancelRef}
                onClick={() => setArchiveOpen(false)}
              >
                Annuler
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
