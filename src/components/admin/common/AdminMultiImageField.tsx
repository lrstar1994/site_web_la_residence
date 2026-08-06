"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import { compressImage, formatImageSize, validateOriginalImage } from "@/lib/images/compress-image";

export type AdminGalleryImage = {
  id: string;
  imagePath: string;
  altFr: string;
  altEn: string;
  sortOrder: number;
  isCover: boolean;
  isActive: boolean;
};

export type PendingAdminGalleryImage = {
  clientId: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedSize: number;
};

type AdminMultiImageFieldProps = {
  title: string;
  eyebrow: string;
  existingImages: AdminGalleryImage[];
  coverImageValue: string;
  deletedImageIds: string[];
  fieldError?: string;
  disabled?: boolean;
  maxImages?: number;
  emptyLabel?: string;
  deleteConfirmDescription: string;
  maxImagesMessage: string;
  onCoverChange: (value: string) => void;
  onDeletedImageIdsChange: (ids: string[]) => void;
  onPendingImagesChange: (images: PendingAdminGalleryImage[]) => void;
};

const DEFAULT_MAX_IMAGES = 15;

function syncInputFiles(input: HTMLInputElement | null, images: PendingAdminGalleryImage[]) {
  if (!input) return;
  const transfer = new DataTransfer();
  images.forEach((image) => transfer.items.add(image.file));
  input.files = transfer.files;
}

export function AdminMultiImageField({
  title,
  eyebrow,
  existingImages,
  coverImageValue,
  deletedImageIds,
  fieldError,
  disabled = false,
  maxImages = DEFAULT_MAX_IMAGES,
  emptyLabel = "Aucune image",
  deleteConfirmDescription,
  maxImagesMessage,
  onCoverChange,
  onDeletedImageIdsChange,
  onPendingImagesChange,
}: AdminMultiImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRef = useRef<PendingAdminGalleryImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingAdminGalleryImage[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const activeExistingImages = existingImages.filter(
    (image) => image.isActive && !deletedImageIds.includes(image.id),
  );
  const visibleImageCount =
    existingImages.filter((image) => !deletedImageIds.includes(image.id)).length +
    pendingImages.length;
  const deleteCandidate = existingImages.find((image) => image.id === deleteCandidateId) ?? null;

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function applyPendingImages(images: PendingAdminGalleryImage[]) {
    pendingRef.current = images;
    setPendingImages(images);
    syncInputFiles(inputRef.current, images);
    onPendingImagesChange(images);
  }

  function setCover(value: string) {
    onCoverChange(value);
  }

  function removePendingImage(clientId: string) {
    const current = pendingRef.current;
    const removed = current.find((image) => image.clientId === clientId);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    const next = current.filter((image) => image.clientId !== clientId);
    const removedIndex = current.findIndex((image) => image.clientId === clientId);
    const removedCover = coverImageValue === `pending:${removedIndex}`;

    if (removedCover) {
      onCoverChange(activeExistingImages[0] ? `existing:${activeExistingImages[0].id}` : next[0] ? "pending:0" : "");
    } else if (coverImageValue.startsWith("pending:")) {
      const coverIndex = Number(coverImageValue.replace("pending:", ""));
      const nextCoverIndex = current
        .filter((image) => image.clientId !== clientId)
        .findIndex((image) => image.clientId === current[coverIndex]?.clientId);
      onCoverChange(nextCoverIndex >= 0 ? `pending:${nextCoverIndex}` : coverImageValue);
    }

    applyPendingImages(next);
  }

  function markExistingImageForDeletion(imageId: string) {
    const nextDeleted = deletedImageIds.includes(imageId)
      ? deletedImageIds
      : [...deletedImageIds, imageId];
    const remainingExisting = existingImages.filter(
      (image) => image.isActive && image.id !== imageId && !nextDeleted.includes(image.id),
    );

    onDeletedImageIdsChange(nextDeleted);

    if (coverImageValue === `existing:${imageId}`) {
      onCoverChange(remainingExisting[0] ? `existing:${remainingExisting[0].id}` : pendingImages[0] ? "pending:0" : "");
    }

    setDeleteCandidateId(null);
  }

  function undoExistingImageDeletion(imageId: string) {
    onDeletedImageIdsChange(deletedImageIds.filter((id) => id !== imageId));
  }

  async function handleFiles(files: File[]) {
    setLocalError(null);
    setStatus(null);

    const total = activeExistingImages.length + pendingImages.length + files.length;
    if (total > maxImages) {
      setLocalError(maxImagesMessage);
      syncInputFiles(inputRef.current, pendingImages);
      return;
    }

    const accepted: PendingAdminGalleryImage[] = [];
    setStatus("Optimisation de l'image...");

    try {
      for (const file of files) {
        const validation = validateOriginalImage(file);
        if (!validation.ok) {
          setLocalError(validation.message);
          syncInputFiles(inputRef.current, pendingImages);
          return;
        }

        const compressed = await compressImage(file);
        accepted.push({
          clientId: `${compressed.file.name}-${compressed.file.size}-${crypto.randomUUID()}`,
          file: compressed.file,
          previewUrl: URL.createObjectURL(compressed.file),
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        });
      }
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Impossible d'optimiser l'image.");
      syncInputFiles(inputRef.current, pendingImages);
      return;
    } finally {
      setStatus(null);
    }

    const shouldCover = !coverImageValue && activeExistingImages.length === 0 && pendingImages.length === 0;
    const next = [...pendingImages, ...accepted];
    if (shouldCover && next[0]) onCoverChange("pending:0");
    applyPendingImages(next);
  }

  return (
    <section className="admin-news-form-card">
      <div className="admin-news-form-section-heading">
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <p className="admin-section-kicker">
        {visibleImageCount} / {maxImages} images
      </p>
      {localError || fieldError ? (
        <strong className="admin-news-form-error">{localError || fieldError}</strong>
      ) : null}
      {status ? (
        <p className="admin-news-form-note" role="status">
          {status}
        </p>
      ) : null}
      <div className="admin-restaurant-images-grid">
        {existingImages.map((image) => {
          const isDeleted = deletedImageIds.includes(image.id);
          const coverValue = `existing:${image.id}`;

          return (
            <article
              className={`admin-restaurant-image-item ${isDeleted ? "is-deleted" : ""}`}
              key={image.id}
            >
              <div className="admin-restaurant-image-thumb">
                <Image src={image.imagePath} alt={image.altFr} fill sizes="160px" />
                <span className="admin-restaurant-image-origin">
                  {isDeleted ? "A supprimer" : "Existante"}
                </span>
              </div>
              <p>{image.isActive ? "Image enregistree" : "Image masquee"}</p>
              <label className="admin-restaurant-cover-choice">
                <input
                  type="radio"
                  name="cover_choice"
                  disabled={disabled || isDeleted}
                  checked={coverImageValue === coverValue}
                  onChange={() => setCover(coverValue)}
                />
                {coverImageValue === coverValue ? (
                  <span className="admin-restaurant-cover-badge">Couverture</span>
                ) : (
                  <span>Definir comme couverture</span>
                )}
              </label>
              {isDeleted ? (
                <button
                  className="admin-restaurant-undo-delete"
                  type="button"
                  disabled={disabled}
                  onClick={() => undoExistingImageDeletion(image.id)}
                >
                  Annuler la suppression
                </button>
              ) : (
                <button
                  className="admin-restaurant-remove-image"
                  type="button"
                  aria-label={`Supprimer ${image.altFr || "cette image"}`}
                  disabled={disabled}
                  onClick={() => setDeleteCandidateId(image.id)}
                >
                  x
                </button>
              )}
            </article>
          );
        })}
        {pendingImages.map((image, index) => {
          const coverValue = `pending:${index}`;

          return (
            <article className="admin-restaurant-image-item" key={image.clientId}>
              <div className="admin-restaurant-image-thumb">
                <Image src={image.previewUrl} alt={image.file.name} fill sizes="160px" unoptimized />
                <span className="admin-restaurant-image-origin">Nouvelle</span>
              </div>
              <p>{image.file.name}</p>
              <small>
                Taille originale : {formatImageSize(image.originalSize)}
                <br />
                Image optimisee : {formatImageSize(image.compressedSize)}
              </small>
              <label className="admin-restaurant-cover-choice">
                <input
                  type="radio"
                  name="cover_choice"
                  disabled={disabled}
                  checked={coverImageValue === coverValue}
                  onChange={() => setCover(coverValue)}
                />
                {coverImageValue === coverValue ? (
                  <span className="admin-restaurant-cover-badge">Couverture</span>
                ) : (
                  <span>Definir comme couverture</span>
                )}
              </label>
              <button
                className="admin-restaurant-remove-image"
                type="button"
                aria-label={`Retirer ${image.file.name}`}
                disabled={disabled}
                onClick={() => removePendingImage(image.clientId)}
              >
                x
              </button>
            </article>
          );
        })}
      </div>
      {visibleImageCount === 0 ? <p className="admin-news-form-note">{emptyLabel}</p> : null}
      <label className="admin-restaurant-image-dropzone">
        <span>+ Ajouter des images</span>
        <small>
          Formats acceptes : JPG, PNG ou WebP.
          <br />
          Taille originale maximale : 5 Mo.
          <br />
          L&apos;image sera automatiquement optimisee avant l&apos;envoi.
        </small>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled}
          onChange={(event) => {
            void handleFiles(Array.from(event.target.files ?? []));
          }}
        />
      </label>
      <input type="hidden" name="cover_image_value" value={coverImageValue} />
      {deletedImageIds.map((id) => (
        <input key={id} type="hidden" name="deleted_image_ids" value={id} />
      ))}
      {deleteCandidate ? (
        <AdminConfirmDialog
          title="Supprimer cette photo ?"
          description={deleteConfirmDescription}
          confirmLabel="Supprimer la photo"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={() => markExistingImageForDeletion(deleteCandidate.id)}
          onCancel={() => setDeleteCandidateId(null)}
        >
          <div className="admin-confirm-dialog-media">
            <Image
              src={deleteCandidate.imagePath}
              alt={deleteCandidate.altFr || "Photo a supprimer"}
              fill
              sizes="96px"
            />
          </div>
        </AdminConfirmDialog>
      ) : null}
    </section>
  );
}
