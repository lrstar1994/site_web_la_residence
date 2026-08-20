"use client";

import Image from "next/image";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import type {
  FormEvent,
} from "react";

import {
  createRestaurantGalleryImageAction,
} from "@/app/[locale]/admin/(protected)/restaurant/galerie/actions";

import {
  AdminBackButton,
} from "@/components/admin/common/AdminBackButton";

import type {
  AdminRestaurantGalleryImageFormState,
} from "@/lib/admin/restaurant/admin-restaurant-gallery-types";

import {
  compressImage,
  formatImageSize,
  validateOriginalImage,
} from "@/lib/images/compress-image";

import {
  createSupabaseBrowserClient,
} from "@/lib/supabase/browser";

import {
  removeUploadedImages,
} from "@/lib/storage/remove-uploaded-images";

import {
  uploadOptimizedImage,
} from "@/lib/storage/upload-optimized-image";

type PendingGalleryImage = {
  clientId: string;

  file: File;

  previewUrl: string;

  originalSize: number;

  compressedSize: number;
};

const MAX_IMAGES_PER_UPLOAD =
  20;

export function AdminRestaurantGalleryForm() {
  const initialState:
    AdminRestaurantGalleryImageFormState =
      {
        ok: false,
        message: "",
        fieldErrors: {},
      };

  const [
    state,
    formAction,
  ] = useActionState(
    createRestaurantGalleryImageAction,
    initialState,
  );

  const [
    pendingImages,
    setPendingImages,
  ] =
    useState<
      PendingGalleryImage[]
    >([]);

  const [
    imageError,
    setImageError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    imageStatus,
    setImageStatus,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isSaving,
    startSavingTransition,
  ] = useTransition();

  const pendingImagesRef =
    useRef<
      PendingGalleryImage[]
    >([]);

  useEffect(() => {
    pendingImagesRef.current =
      pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach(
        (image) => {
          URL.revokeObjectURL(
            image.previewUrl,
          );
        },
      );
    };
  }, []);

  /* =========================================================
     SUPPRESSION D'UNE IMAGE AVANT UPLOAD
     ========================================================= */

  function removePendingImage(
    clientId: string,
  ) {
    setPendingImages(
      (current) => {
        const image =
          current.find(
            (item) =>
              item.clientId ===
              clientId,
          );

        if (image) {
          URL.revokeObjectURL(
            image.previewUrl,
          );
        }

        return current.filter(
          (item) =>
            item.clientId !==
            clientId,
        );
      },
    );
  }

  /* =========================================================
     SÉLECTION + COMPRESSION MULTIPLE
     ========================================================= */

  async function handleFiles(
    files: File[],
  ) {
    setImageError(
      null,
    );

    setImageStatus(
      null,
    );

    if (
      files.length === 0
    ) {
      return;
    }

    if (
      pendingImages.length +
        files.length >
      MAX_IMAGES_PER_UPLOAD
    ) {
      setImageError(
        `Vous pouvez ajouter au maximum ${MAX_IMAGES_PER_UPLOAD} images à la fois.`,
      );

      return;
    }

    const accepted:
      PendingGalleryImage[] =
      [];

    try {
      for (
        let index = 0;
        index <
        files.length;
        index += 1
      ) {
        const file =
          files[index];

        setImageStatus(
          `Optimisation de l'image ${index + 1} / ${files.length}...`,
        );

        const validation =
          validateOriginalImage(
            file,
          );

        if (
          !validation.ok
        ) {
          throw new Error(
            `${file.name} : ${validation.message}`,
          );
        }

        const compressed =
          await compressImage(
            file,
          );

        accepted.push({
          clientId:
            crypto.randomUUID(),

          file:
            compressed.file,

          previewUrl:
            URL.createObjectURL(
              compressed.file,
            ),

          originalSize:
            compressed.originalSize,

          compressedSize:
            compressed.compressedSize,
        });
      }

      setPendingImages(
        (current) => [
          ...current,
          ...accepted,
        ],
      );
    } catch (error) {
      accepted.forEach(
        (image) => {
          URL.revokeObjectURL(
            image.previewUrl,
          );
        },
      );

      setImageError(
        error instanceof Error
          ? error.message
          : "Impossible d'optimiser les images.",
      );
    } finally {
      setImageStatus(
        null,
      );
    }
  }

  /* =========================================================
     SUBMIT
     ========================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isSaving
    ) {
      return;
    }

    if (
      pendingImages.length ===
      0
    ) {
      setImageError(
        "Sélectionnez au moins une image.",
      );

      return;
    }

    setImageError(
      null,
    );

    setImageStatus(
      null,
    );

    const form =
      event.currentTarget;

    const uploadedStoragePaths:
      string[] = [];

    try {
      const formData =
        new FormData(
          form,
        );

      const supabase =
        createSupabaseBrowserClient();

      const uploadedImagePaths:
        string[] = [];

      for (
        let index = 0;
        index <
        pendingImages.length;
        index += 1
      ) {
        const image =
          pendingImages[index];

        setImageStatus(
          `Envoi de l'image ${index + 1} / ${pendingImages.length}...`,
        );

        const upload =
          await uploadOptimizedImage({
            file:
              image.file,

            bucket:
              "restaurant-gallery",

            folder:
              "gallery",

            supabaseClient:
              supabase,

            alreadyOptimized:
              true,
          });

        if (
          !upload.ok
        ) {
          throw new Error(
            upload.message,
          );
        }

        uploadedImagePaths.push(
          upload.publicUrl,
        );

        uploadedStoragePaths.push(
          upload.storagePath,
        );
      }

      formData.delete(
        "uploaded_image_path",
      );

      formData.delete(
        "uploaded_image_paths",
      );

      uploadedImagePaths.forEach(
        (imagePath) => {
          formData.append(
            "uploaded_image_paths",
            imagePath,
          );
        },
      );

      startSavingTransition(
        () => {
          formAction(
            formData,
          );
        },
      );
    } catch (error) {
      /*
       * Si l'un des uploads échoue avant
       * l'appel à l'action serveur,
       * on nettoie les fichiers déjà envoyés.
       */
      if (
        uploadedStoragePaths.length >
        0
      ) {
        await removeUploadedImages({
          supabaseClient:
            createSupabaseBrowserClient(),

          bucket:
            "restaurant-gallery",

          storagePaths:
            uploadedStoragePaths,
        });
      }

      setImageError(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer les images.",
      );
    } finally {
      setImageStatus(
        null,
      );
    }
  }

  return (
    <form
      className="admin-news-form"
      onSubmit={
        handleSubmit
      }
    >
      {/* =====================================================
          HEADER
         ===================================================== */}

      <header className="admin-news-form-header">
        <AdminBackButton
          fallbackHref="/fr/admin/restaurant/galerie"
        />

        <div>
          <p className="admin-section-kicker">
            Restaurant
          </p>

          <h1>
            Ajouter des images
          </h1>

          <p>
            Ajoutez plusieurs photos à la galerie du restaurant Le Privilège.
          </p>
        </div>
      </header>

      {/* =====================================================
          ALERTES
         ===================================================== */}

      {state.message ? (
        <section
          className="admin-news-form-alert"
          role="alert"
        >
          {state.message}
        </section>
      ) : null}

      {imageError ? (
        <section
          className="admin-news-form-alert"
          role="alert"
        >
          {imageError}
        </section>
      ) : null}

      {state.fieldErrors
        .imagePath ? (
        <section
          className="admin-news-form-alert"
          role="alert"
        >
          {
            state.fieldErrors
              .imagePath
          }
        </section>
      ) : null}

      {imageStatus ? (
        <section
          className="admin-news-form-alert"
          role="status"
        >
          {imageStatus}
        </section>
      ) : null}

      {/* =====================================================
          CONTENU
         ===================================================== */}

      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>
                Galerie
              </p>

              <h2>
                Photos du restaurant
              </h2>
            </div>

            <p className="admin-news-form-note">
              Vous pouvez sélectionner jusqu&apos;à{" "}
              {MAX_IMAGES_PER_UPLOAD} images en une seule fois.
              Les images seront automatiquement optimisées,
              ordonnées et référencées.
            </p>

            {/* ===============================================
                APERÇUS
               =============================================== */}

            {pendingImages.length >
            0 ? (
              <>
                <p className="admin-section-kicker">
                  {
                    pendingImages.length
                  }{" "}
                  image
                  {pendingImages.length >
                  1
                    ? "s"
                    : ""}{" "}
                  sélectionnée
                  {pendingImages.length >
                  1
                    ? "s"
                    : ""}
                </p>

                <div className="admin-restaurant-images-grid">
                  {pendingImages.map(
                    (
                      image,
                      index,
                    ) => (
                      <article
                        className="admin-restaurant-image-item"
                        key={
                          image.clientId
                        }
                      >
                        <div className="admin-restaurant-image-thumb">
                          <Image
                            src={
                              image.previewUrl
                            }
                            alt={`Aperçu ${index + 1}`}
                            fill
                            sizes="180px"
                            unoptimized
                          />

                          <span className="admin-restaurant-image-origin">
                            Nouvelle
                          </span>
                        </div>

                        <p>
                          Image{" "}
                          {index +
                            1}
                        </p>

                        <small>
                          Originale :{" "}
                          {formatImageSize(
                            image.originalSize,
                          )}
                          <br />
                          Optimisée :{" "}
                          {formatImageSize(
                            image.compressedSize,
                          )}
                        </small>

                        <button
                          className="admin-restaurant-remove-image"
                          type="button"
                          aria-label={`Retirer l'image ${index + 1}`}
                          disabled={
                            isSaving
                          }
                          onClick={() =>
                            removePendingImage(
                              image.clientId,
                            )
                          }
                        >
                          ×
                        </button>
                      </article>
                    ),
                  )}
                </div>
              </>
            ) : null}

            {/* ===============================================
                DROPZONE
               =============================================== */}

            <label className="admin-restaurant-image-dropzone">
              <span>
                + Sélectionner des images
              </span>

              <small>
                JPG, PNG ou WebP.
                <br />
                Taille originale maximale : 5 Mo par image.
                <br />
                Jusqu&apos;à {MAX_IMAGES_PER_UPLOAD} images par ajout.
              </small>

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={
                  isSaving
                }
                onChange={(
                  event,
                ) => {
                  const files =
                    Array.from(
                      event.target.files ??
                        [],
                    );

                  /*
                   * Permet de sélectionner ensuite
                   * les mêmes fichiers si nécessaire.
                   */
                  event.target.value =
                    "";

                  void handleFiles(
                    files,
                  );
                }}
              />
            </label>
          </section>
        </div>

        {/* ===================================================
            COLONNE DROITE
           =================================================== */}

        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>
                Automatisation
              </p>

              <h2>
                Gestion automatique
              </h2>
            </div>

            <div className="admin-news-form-note">
              <p>
                À l&apos;enregistrement :
              </p>

              <p>
                ✓ ordre d&apos;affichage généré automatiquement
              </p>

              <p>
                ✓ textes alternatifs FR / EN générés automatiquement
              </p>

              <p>
                ✓ photos activées automatiquement
              </p>

              <p>
                ✓ les 5 premières photos sont mises en avant
              </p>
            </div>
          </section>

          <div className="admin-news-form-actions">
            <button
              className="admin-news-form-button primary"
              type="submit"
              disabled={
                isSaving ||
                pendingImages.length ===
                  0
              }
            >
              {isSaving
                ? "Enregistrement..."
                : pendingImages.length >
                    1
                  ? `Ajouter les ${pendingImages.length} images`
                  : "Ajouter l'image"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}