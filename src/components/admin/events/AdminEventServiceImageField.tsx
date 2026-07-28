"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type {
  AdminEventServiceFormState,
  AdminEventServiceFormValues,
} from "@/lib/admin/events/admin-event-service-types";
import { validateNewsImageFile } from "@/lib/admin/news/news-image-validation";

type Props = {
  values: AdminEventServiceFormValues;
  error?: AdminEventServiceFormState["fieldErrors"]["imagePath"];
};

function canPreview(value: string) {
  return (value.startsWith("/") || value.startsWith("https://")) && !value.includes("<");
}

export function AdminEventServiceImageField({ values, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileLabel, setFileLabel] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearPreview() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    setFileLabel("");
    setLocalError("");
  }

  function clearSelectedFile() {
    clearPreview();

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFile(file: File | null) {
    clearPreview();

    if (!file) {
      return;
    }

    const validation = validateNewsImageFile(file);

    if (!validation.ok) {
      setLocalError(validation.message);
      return;
    }

    setFileLabel(`${validation.normalizedName} (${(file.size / (1024 * 1024)).toFixed(2)} Mo)`);
    setPreviewUrl(URL.createObjectURL(file));
  }

  const imageSource = previewUrl || values.imagePath;

  return (
    <section className="admin-news-form-card">
      <div className="admin-news-form-section-heading">
        <p>Image</p>
        <h2>Image principale</h2>
      </div>
      <div className="admin-news-image-field">
        <div className="admin-news-form-image-preview" aria-label="Previsualisation de l'image">
          {previewUrl || canPreview(values.imagePath) ? (
            <Image
              src={imageSource}
              alt={values.imageAltFr || "Previsualisation de l'image"}
              fill
              unoptimized={imageSource.startsWith("blob:")}
              sizes="(max-width: 900px) 100vw, 420px"
            />
          ) : (
            <span>Image non renseignee</span>
          )}
        </div>
        <div className="admin-news-image-controls">
          <label className="admin-news-file-picker">
            <span>Choisir une image</span>
            <input
              ref={inputRef}
              name="event_service_image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <p className="admin-news-form-note">
            Formats acceptes : JPG, PNG ou WebP. Taille maximale : 5 Mo.
          </p>
          <div className="admin-news-upload-state" aria-live="polite">
            {fileLabel || "Vous pouvez conserver l'image actuelle."}
          </div>
          {previewUrl ? (
            <button className="admin-news-form-cancel" type="button" onClick={clearSelectedFile}>
              Retirer cette image
            </button>
          ) : null}
          {localError || error ? (
            <strong className="admin-news-form-error">{localError || error}</strong>
          ) : null}
        </div>
      </div>
      <input type="hidden" name="image_path" value={values.imagePath} />
    </section>
  );
}
