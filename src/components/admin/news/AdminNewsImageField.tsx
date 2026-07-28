"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { AdminNewsFormState, AdminNewsFormValues } from "@/lib/admin/news/admin-news-types";
import { validateNewsImageFile } from "@/lib/admin/news/news-image-validation";

type AdminNewsImageFieldProps = {
  values: AdminNewsFormValues;
  error?: AdminNewsFormState["fieldErrors"]["imagePath"];
  onChange: (field: keyof AdminNewsFormValues, value: string) => void;
};

function formatFileSize(size: number) {
  return `${(size / (1024 * 1024)).toFixed(2)} Mo`;
}

function canPreviewPath(path: string) {
  return (
    (path.startsWith("/") || path.startsWith("https://")) &&
    !path.includes("<") &&
    !path.includes(">")
  );
}

export function AdminNewsImageField({
  values,
  error,
  onChange,
}: AdminNewsImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleFileChange(file: File | null) {
    setLocalError("");
    setFileName("");
    setFileSize("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
    }

    if (!file) {
      return;
    }

    const validation = validateNewsImageFile(file);

    if (!validation.ok) {
      setLocalError(validation.message);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setFileName(validation.normalizedName);
    setFileSize(formatFileSize(file.size));
    setPreviewUrl(URL.createObjectURL(file));
  }

  const displayedPreview = previewUrl || values.imagePath;
  const canPreview = previewUrl || canPreviewPath(values.imagePath);

  return (
    <section className="admin-news-form-card">
      <div className="admin-news-form-section-heading">
        <p>Image</p>
        <h2>Image principale</h2>
      </div>
      <div className="admin-news-image-field">
        <div className="admin-news-form-image-preview" aria-label="Prévisualisation de l'image">
          {canPreview ? (
            <Image
              src={displayedPreview}
              alt={values.imageAltFr || "Prévisualisation de l'image"}
              fill
              unoptimized={displayedPreview.startsWith("blob:")}
              sizes="(max-width: 900px) 100vw, 420px"
            />
          ) : (
            <span>Image non renseignée</span>
          )}
        </div>

        <div className="admin-news-image-controls">
          <label className="admin-news-file-picker">
            <span>Choisir une image</span>
            <input
              ref={inputRef}
              name="news_image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby="admin-news-image-help admin-news-image-error"
              onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            />
          </label>
          <p id="admin-news-image-help" className="admin-news-form-note">
            Formats acceptés : JPG, PNG ou WebP. Taille maximale : 5 Mo.
            <br />
            Format recommandé : 1600 × 900 px ou ratio 16:9. Dimensions minimales
            recommandées : 1200 × 675 px.
          </p>
          <div className="admin-news-upload-state" aria-live="polite">
            {fileName ? (
              <span>
                Image sélectionnée : {fileName} ({fileSize})
              </span>
            ) : (
              <span>Vous pouvez conserver l&apos;image actuelle.</span>
            )}
          </div>
          {localError || error ? (
            <strong id="admin-news-image-error" className="admin-news-form-error">
              {localError || error}
            </strong>
          ) : null}
        </div>
      </div>

      <details className="admin-news-image-advanced">
        <summary>Utiliser une image existante</summary>
        <label className="admin-news-form-field">
          <span>Image existante</span>
          <input
            name="image_path"
            value={values.imagePath}
            maxLength={500}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "admin-news-image-error" : undefined}
            onChange={(event) => onChange("imagePath", event.target.value)}
          />
          <small>
            Conservez une image locale comme /restaurant.jpeg ou utilisez une URL publique
            existante.
          </small>
        </label>
      </details>
    </section>
  );
}
