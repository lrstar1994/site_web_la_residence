"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  addEventMomentImagesAction,
  deleteEventMomentImageAction,
} from "@/app/[locale]/admin/(protected)/evenements/galerie/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";
import type { EventMomentImage } from "@/types/event-moment";

type Props = {
  existingImages: EventMomentImage[];
  locale: Locale;
};

type UploadStatus =
  | "waiting"
  | "uploading"
  | "done"
  | "error";

type UploadPreview = {
  id: string;
  name: string;
  previewUrl: string;
  status: UploadStatus;
  originalSize: number;
  optimizedSize?: number;
  error?: string;
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} o`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} Ko`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function getUploadStatusLabel(status: UploadStatus) {
  switch (status) {
    case "waiting":
      return "En attente";

    case "uploading":
      return "Optimisation et envoi...";

    case "done":
      return "Envoyée";

    case "error":
      return "Erreur";
  }
}

export function AdminEventMomentsManager({
  existingImages,
  locale,
}: Props) {
  const router = useRouter();

  const inputRef =
    useRef<HTMLInputElement | null>(null);

  const previewsRef =
    useRef<UploadPreview[]>([]);

  const [previews, setPreviews] = useState<
    UploadPreview[]
  >([]);

  const [isUploading, setIsUploading] =
    useState(false);

  const [imageToDelete, setImageToDelete] =
    useState<EventMomentImage | null>(null);

  const [isDeleting, setIsDeleting] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      for (const preview of previewsRef.current) {
        URL.revokeObjectURL(
          preview.previewUrl,
        );
      }
    };
  }, []);

  function clearPreviews(
    items: UploadPreview[],
  ) {
    for (const preview of items) {
      URL.revokeObjectURL(
        preview.previewUrl,
      );
    }

    setPreviews([]);
  }

  async function handleFiles(
    files: FileList | null,
  ) {
    if (
      !files ||
      files.length === 0 ||
      isUploading ||
      isDeleting
    ) {
      return;
    }

    const selectedFiles =
      Array.from(files);

    setMessage(null);
    setError(null);
    setIsUploading(true);

    const previewItems: UploadPreview[] =
      selectedFiles.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        previewUrl:
          URL.createObjectURL(file),
        status: "waiting",
        originalSize: file.size,
      }));

    setPreviews(previewItems);

    const supabase =
      createSupabaseBrowserClient();

    const uploadedPublicUrls: string[] =
      [];

    const uploadedStoragePaths: string[] =
      [];

    try {
      for (
        let index = 0;
        index < selectedFiles.length;
        index += 1
      ) {
        const file =
          selectedFiles[index];

        const preview =
          previewItems[index];

        setPreviews((current) =>
          current.map((item) =>
            item.id === preview.id
              ? {
                  ...item,
                  status: "uploading",
                }
              : item,
          ),
        );

        const result =
          await uploadOptimizedImage({
            file,
            bucket: "site-news",
            folder: "event-moments",
            supabaseClient: supabase,
          });

        if (!result.ok) {
          setPreviews((current) =>
            current.map((item) =>
              item.id === preview.id
                ? {
                    ...item,
                    status: "error",
                    error:
                      result.message,
                  }
                : item,
            ),
          );

          throw new Error(
            result.message,
          );
        }

        uploadedPublicUrls.push(
          result.publicUrl,
        );

        uploadedStoragePaths.push(
          result.storagePath,
        );

        setPreviews((current) =>
          current.map((item) =>
            item.id === preview.id
              ? {
                  ...item,
                  status: "done",
                  optimizedSize:
                    result.optimizedSize,
                }
              : item,
          ),
        );
      }

      const saveResult =
        await addEventMomentImagesAction(
          locale,
          uploadedPublicUrls,
        );

      if (!saveResult.ok) {
        if (
          uploadedStoragePaths.length >
          0
        ) {
          const { error: cleanupError } =
            await supabase.storage
              .from("site-news")
              .remove(
                uploadedStoragePaths,
              );

          if (cleanupError) {
            console.error(
              "[admin-event-moments] Cleanup after failed save:",
              cleanupError.message,
            );
          }
        }

        throw new Error(
          saveResult.message,
        );
      }

      setMessage(
        selectedFiles.length === 1
          ? "L’image a été ajoutée à la galerie."
          : `${selectedFiles.length} images ont été ajoutées à la galerie.`,
      );

      clearPreviews(previewItems);

      if (inputRef.current) {
        inputRef.current.value = "";
      }

      router.refresh();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Impossible d’ajouter les images.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeleteImage() {
    if (
      !imageToDelete ||
      isDeleting ||
      isUploading
    ) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setError(null);

    try {
      const result =
        await deleteEventMomentImageAction(
          locale,
          imageToDelete.id,
        );

      if (!result.ok) {
        throw new Error(
          result.message,
        );
      }

      setMessage(
        "L’image a été supprimée définitivement.",
      );

      setImageToDelete(null);

      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer l’image.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="admin-event-moments-manager">
        {message ? (
          <div
            className="admin-news-form-alert"
            role="status"
          >
            {message}
          </div>
        ) : null}

        {error ? (
          <div
            className="admin-news-form-alert"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <section className="admin-news-form-card">
          <div className="admin-news-form-section-heading">
            <p>Galerie publique</p>
            <h2>Ajouter des images</h2>
          </div>

          <label className="admin-restaurant-image-dropzone">
            <span>
              {isUploading
                ? "Optimisation et envoi en cours..."
                : "Sélectionner des images"}
            </span>

            <small>
              JPG, PNG ou WebP — 5 Mo
              maximum par image. Les
              images seront
              automatiquement optimisées
              en WebP. Vous pouvez ajouter
              autant d’images que vous le
              souhaitez.
            </small>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={
                isUploading ||
                isDeleting
              }
              onChange={(event) => {
                void handleFiles(
                  event.target.files,
                );
              }}
            />
          </label>
        </section>

        {previews.length > 0 ? (
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>En cours</p>
              <h2>
                Images sélectionnées
              </h2>
            </div>

            <div className="admin-restaurant-images-grid">
              {previews.map(
                (preview) => (
                  <article
                    className="admin-restaurant-image-item"
                    key={preview.id}
                  >
                    <div className="admin-restaurant-image-thumb">
                      <Image
                        src={
                          preview.previewUrl
                        }
                        alt={preview.name}
                        fill
                        sizes="180px"
                      />
                    </div>

                    <div className="admin-restaurant-image-origin">
                      <strong>
                        {preview.name}
                      </strong>

                      <small>
                        Original :{" "}
                        {formatFileSize(
                          preview.originalSize,
                        )}
                      </small>

                      {typeof preview.optimizedSize ===
                      "number" ? (
                        <small>
                          Optimisé :{" "}
                          {formatFileSize(
                            preview.optimizedSize,
                          )}
                        </small>
                      ) : null}

                      <small>
                        {getUploadStatusLabel(
                          preview.status,
                        )}
                      </small>

                      {preview.error ? (
                        <small
                          role="alert"
                          className="admin-news-form-error"
                        >
                          {
                            preview.error
                          }
                        </small>
                      ) : null}
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
        ) : null}

        <section className="admin-news-form-card">
          <div className="admin-news-form-section-heading">
            <p>Images actuelles</p>

            <h2>
              Galerie d’images
            </h2>
          </div>

          {existingImages.length === 0 ? (
            <p>
              Aucune image n’a encore été
              ajoutée à la galerie.
            </p>
          ) : (
            <div className="admin-restaurant-images-grid">
                {existingImages.map((image) => (
                    <article
                        className="admin-restaurant-image-item"
                        key={image.id}
                    >
                        <div className="admin-restaurant-image-thumb">
                        <Image
                            src={image.imagePath}
                            alt={
                            image.altFr ||
                            "Photo d’images événement"
                            }
                            fill
                            sizes="180px"
                        />
                        </div>

                        <div className="admin-restaurant-image-origin">
                        <button
                            className="admin-restaurant-remove-image"
                            type="button"
                            disabled={isUploading || isDeleting}
                            onClick={() => {
                            setMessage(null);
                            setError(null);
                            setImageToDelete(image);
                            }}
                        >
                            Supprimer
                        </button>
                        </div>
                    </article>
                ))}
            </div>
          )}
        </section>
      </div>

      {imageToDelete ? (
        <AdminConfirmDialog
          title="Supprimer cette image ?"
          description="Cette image sera supprimée définitivement de la galerie d’images et de Supabase Storage."
          confirmLabel="Supprimer définitivement"
          cancelLabel="Annuler"
          variant="danger"
          pending={isDeleting}
          pendingLabel="Suppression en cours..."
          confirmDisabled={isDeleting}
          onCancel={() => {
            if (!isDeleting) {
              setImageToDelete(null);
            }
          }}
          onConfirm={() => {
            void handleDeleteImage();
          }}
        >
          <div className="admin-event-moment-delete-preview">
            <Image
              src={
                imageToDelete.imagePath
              }
              alt={
                imageToDelete.altFr ||
                "Image à supprimer"
              }
              width={420}
              height={260}
            />
          </div>
        </AdminConfirmDialog>
      ) : null}
    </>
  );
}