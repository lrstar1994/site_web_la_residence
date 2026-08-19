"use client";

import {
  useActionState,
  useMemo,
  useState,
  useTransition,
} from "react";
import type { FormEvent } from "react";

import {
  createEventServiceAction,
  deleteEventServiceAction,
  updateEventServiceAction,
} from "@/app/[locale]/admin/(protected)/evenements/actions";

import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { PendingAdminGalleryImage } from "@/components/admin/common/AdminMultiImageField";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import { AdminEventServiceImageField } from "@/components/admin/events/AdminEventServiceImageField";

import {
  emptyAdminEventServiceFormValues,
  type AdminEventService,
  type AdminEventServiceFormState,
  type AdminEventServiceFormValues,
} from "@/lib/admin/events/admin-event-service-types";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { removeUploadedImages } from "@/lib/storage/remove-uploaded-images";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";

type Props = {
  mode: "create" | "edit";
  service?: AdminEventService;
};

function initialValues(
  service?: AdminEventService,
): AdminEventServiceFormValues {
  if (!service) {
    return emptyAdminEventServiceFormValues;
  }

  const cover =
    service.images.find(
      (image) =>
        image.isCover &&
        image.isActive,
    ) ??
    service.images.find(
      (image) =>
        image.isActive,
    );

  return {
    code: service.code,

    titleFr: service.title.fr,
    titleEn: service.title.en,

    descriptionFr:
      service.description.fr,

    descriptionEn:
      service.description.en,

    /*
     * Conservé pour compatibilité avec
     * l'ancienne colonne event_services.image_path.
     */
    imagePath:
      service.imagePath ?? "",

    imageAltFr:
      service.imageAlt.fr,

    imageAltEn:
      service.imageAlt.en,

    sortOrder:
      String(service.sortOrder),

    isActive:
      service.isActive,

    coverImageValue:
      cover
        ? `existing:${cover.id}`
        : "",

    deletedImageIds: [],
  };
}

function Field({
  name,
  label,
  value,
  error,
  onChange,
}: {
  name:
    | "titleFr"
    | "titleEn";

  label: string;

  value: string;

  error?: string;

  onChange: (
    field: keyof AdminEventServiceFormValues,
    value: string,
  ) => void;
}) {
  const htmlName =
    name === "titleFr"
      ? "title_fr"
      : "title_en";

  return (
    <label className="admin-news-form-field">
      <span>
        {label}
      </span>

      <input
        name={htmlName}
        value={value}
        required
        onChange={(event) =>
          onChange(
            name,
            event.target.value,
          )
        }
      />

      {error ? (
        <strong className="admin-news-form-error">
          {error}
        </strong>
      ) : null}
    </label>
  );
}

function TextArea({
  name,
  label,
  value,
  error,
  onChange,
}: {
  name:
    | "descriptionFr"
    | "descriptionEn";

  label: string;

  value: string;

  error?: string;

  onChange: (
    field: keyof AdminEventServiceFormValues,
    value: string,
  ) => void;
}) {
  const htmlName =
    name === "descriptionFr"
      ? "description_fr"
      : "description_en";

  return (
    <label className="admin-news-form-field">
      <span>
        {label}
      </span>

      <textarea
        name={htmlName}
        value={value}
        rows={5}
        required
        onChange={(event) =>
          onChange(
            name,
            event.target.value,
          )
        }
      />

      {error ? (
        <strong className="admin-news-form-error">
          {error}
        </strong>
      ) : null}
    </label>
  );
}

export function AdminEventServiceForm({
  mode,
  service,
}: Props) {
  const values = useMemo(
    () =>
      initialValues(service),
    [service],
  );

  const initialState =
    useMemo<AdminEventServiceFormState>(
      () => ({
        ok: false,
        message: "",
        fieldErrors: {},
        values,
      }),
      [values],
    );

  const action =
    mode === "create"
      ? createEventServiceAction
      : updateEventServiceAction.bind(
          null,
          service?.id ?? "",
        );

  const [
    state,
    formAction,
  ] = useActionState(
    action,
    initialState,
  );

  const [
    formValues,
    setFormValues,
  ] =
    useState<AdminEventServiceFormValues>(
      state.values,
    );

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState("");

  const [
    deleteError,
    setDeleteError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isDeleting,
    startDeleteTransition,
  ] = useTransition();

  const [
    pendingImages,
    setPendingImages,
  ] =
    useState<
      PendingAdminGalleryImage[]
    >([]);

  const [
    imageSubmitError,
    setImageSubmitError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    imageSubmitStatus,
    setImageSubmitStatus,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isSaving,
    startSavingTransition,
  ] = useTransition();

  function updateField(
    field:
      keyof AdminEventServiceFormValues,
    value: string,
  ) {
    setFormValues(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );
  }

  function handleDeleteService() {
    if (
      !service ||
      deleteConfirmation.trim() !==
        "SUPPRIMER"
    ) {
      return;
    }

    setDeleteError(null);

    startDeleteTransition(
      async () => {
        const result =
          await deleteEventServiceAction(
            service.id,
          );

        if (!result.ok) {
          setDeleteError(
            result.message,
          );
        }
      },
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form =
      event.currentTarget;

    if (
      !(
        form instanceof
        HTMLFormElement
      )
    ) {
      setImageSubmitError(
        "Impossible de préparer le formulaire.",
      );

      return;
    }

    if (isSaving) {
      return;
    }

    setImageSubmitError(null);
    setImageSubmitStatus(null);

    const uploadedPaths:
      string[] = [];

    try {
      const formData =
        new FormData(form);

      const supabase =
        createSupabaseBrowserClient();

      const uploadedImagePaths:
        string[] = [];

      /*
       * Upload des nouvelles images.
       */
      for (
        const image of
        pendingImages
      ) {
        setImageSubmitStatus(
          `Envoi de l'image "${image.file.name}"...`,
        );

        const upload =
          await uploadOptimizedImage(
            {
              file:
                image.file,

              bucket:
                "site-news",

              folder:
                `event-services/${
                  formValues.code ||
                  formValues.titleFr ||
                  "prestation"
                }`,

              supabaseClient:
                supabase,

              alreadyOptimized:
                true,
            },
          );

        if (!upload.ok) {
          throw new Error(
            upload.message,
          );
        }

        uploadedPaths.push(
          upload.storagePath,
        );

        uploadedImagePaths.push(
          upload.publicUrl,
        );
      }

      /*
       * On retire les fichiers bruts du FormData.
       * Seules les URLs optimisées sont envoyées
       * à l'action serveur.
       */
      formData.delete(
        "uploaded_image_path",
      );

      formData.delete(
        "uploaded_image_paths",
      );

      formData.delete(
        "image_file",
      );

      formData.delete(
        "image_files",
      );

      uploadedImagePaths.forEach(
        (imagePath) => {
          formData.append(
            "uploaded_image_paths",
            imagePath,
          );
        },
      );

      /*
       * Sécurisation :
       * on garantit que ces valeurs correspondent
       * toujours à l'état React actuel.
       */

      formData.set(
        "cover_image_value",
        formValues.coverImageValue,
      );

      formData.delete(
        "deleted_image_ids",
      );

      formValues.deletedImageIds.forEach(
        (imageId) => {
          formData.append(
            "deleted_image_ids",
            imageId,
          );
        },
      );

      /*
       * Compatibilité avec l'ancienne image principale.
       */
      formData.set(
        "image_path",
        formValues.imagePath ?? "",
      );

      formData.set(
        "image_alt_fr",
        formValues.imageAltFr ?? "",
      );

      formData.set(
        "image_alt_en",
        formValues.imageAltEn ?? "",
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
       * Si l'upload a fonctionné mais que
       * l'enregistrement n'a pas pu démarrer,
       * on retire les nouvelles images de Storage.
       */
      if (
        uploadedPaths.length >
        0
      ) {
        await removeUploadedImages(
          {
            supabaseClient:
              createSupabaseBrowserClient(),

            bucket:
              "site-news",

            storagePaths:
              uploadedPaths,
          },
        );
      }

      setImageSubmitError(
        error instanceof Error
          ? error.message
          : "Impossible d'envoyer l'image.",
      );
    } finally {
      setImageSubmitStatus(
        null,
      );
    }
  }

  return (
    <form
      className="admin-news-form"
      onSubmit={handleSubmit}
    >
      <header className="admin-news-form-header">
        <AdminBackButton
          fallbackHref="/fr/admin/evenements"
        />

        <div>
          <p className="admin-section-kicker">
            Événements
          </p>

          <h2>
            {mode === "create"
              ? "Nouvelle prestation"
              : "Modifier la prestation"}
          </h2>

          <p>
            Renseignez les contenus bilingues et les images de la prestation.
          </p>
        </div>
      </header>

      {state.message ? (
        <section
          className="admin-news-form-alert"
          role="alert"
        >
          {state.message}
        </section>
      ) : null}

      {imageSubmitError ? (
        <section
          className="admin-news-form-alert"
          role="alert"
        >
          {imageSubmitError}
        </section>
      ) : null}

      {imageSubmitStatus ? (
        <section
          className="admin-news-form-alert"
          role="status"
        >
          {imageSubmitStatus}
        </section>
      ) : null}

      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <AdminEventServiceImageField
            images={
              service?.images ??
              []
            }
            values={
              formValues
            }
            error={
              state.fieldErrors
                .imagePath
            }
            disabled={
              isSaving
            }
            onCoverChange={(
              value,
            ) =>
              setFormValues(
                (current) => ({
                  ...current,
                  coverImageValue:
                    value,
                }),
              )
            }
            onDeletedImageIdsChange={(
              ids,
            ) =>
              setFormValues(
                (current) => ({
                  ...current,
                  deletedImageIds:
                    ids,
                }),
              )
            }
            onPendingImagesChange={
              setPendingImages
            }
          />

          {/* =================================================
              CHAMPS TECHNIQUES
             ================================================= */}

          <input
            type="hidden"
            name="code"
            value={
              formValues.code
            }
          />

          <input
            type="hidden"
            name="sort_order"
            value={
              formValues.sortOrder
            }
          />

          <input
            type="hidden"
            name="image_path"
            value={
              formValues.imagePath ??
              ""
            }
          />

          <input
            type="hidden"
            name="image_alt_fr"
            value={
              formValues.imageAltFr
            }
          />

          <input
            type="hidden"
            name="image_alt_en"
            value={
              formValues.imageAltEn
            }
          />

          <input
            type="hidden"
            name="cover_image_value"
            value={
              formValues.coverImageValue
            }
          />

          {formValues.deletedImageIds.map(
            (imageId) => (
              <input
                key={
                  imageId
                }
                type="hidden"
                name="deleted_image_ids"
                value={
                  imageId
                }
              />
            ),
          )}

          {/* =================================================
              FRANÇAIS
             ================================================= */}

          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>
                Contenu français
              </p>

              <h2>
                Version française
              </h2>
            </div>

            <Field
              name="titleFr"
              label="Titre français"
              value={
                formValues.titleFr
              }
              error={
                state.fieldErrors
                  .titleFr
              }
              onChange={
                updateField
              }
            />

            <TextArea
              name="descriptionFr"
              label="Description française"
              value={
                formValues.descriptionFr
              }
              error={
                state.fieldErrors
                  .descriptionFr
              }
              onChange={
                updateField
              }
            />
          </section>

          {/* =================================================
              ANGLAIS
             ================================================= */}

          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>
                Contenu anglais
              </p>

              <h2>
                Version anglaise
              </h2>
            </div>

            <Field
              name="titleEn"
              label="Titre anglais"
              value={
                formValues.titleEn
              }
              error={
                state.fieldErrors
                  .titleEn
              }
              onChange={
                updateField
              }
            />

            <TextArea
              name="descriptionEn"
              label="Description anglaise"
              value={
                formValues.descriptionEn
              }
              error={
                state.fieldErrors
                  .descriptionEn
              }
              onChange={
                updateField
              }
            />
          </section>
        </div>

        {/* ===================================================
            COLONNE DROITE
           =================================================== */}

        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>
                Visibilité
              </p>

              <h2>
                Publication
              </h2>
            </div>

            <AdminVisibilityField
              checked={
                formValues.isActive
              }
              label="Afficher cette prestation sur le site"
              onChange={(
                checked,
              ) =>
                setFormValues(
                  (current) => ({
                    ...current,
                    isActive:
                      checked,
                  }),
                )
              }
            />
          </section>

          {mode === "edit" ? (
            <section className="admin-danger-zone">
              <div>
                <p>
                  Zone dangereuse
                </p>

                <h2>
                  Supprimer définitivement cet événement
                </h2>

                <span>
                  Toutes les données ainsi que les images seront supprimées.
                </span>
              </div>

              {deleteError ? (
                <strong className="admin-news-form-error">
                  {deleteError}
                </strong>
              ) : null}

              <button
                className="admin-danger-zone-button"
                type="button"
                aria-haspopup="dialog"
                disabled={
                  isDeleting
                }
                onClick={() =>
                  setDeleteDialogOpen(
                    true,
                  )
                }
              >
                {isDeleting
                  ? "Suppression en cours..."
                  : "Supprimer cet événement"}
              </button>
            </section>
          ) : null}

          <div className="admin-news-form-actions">
            <button
              className="admin-news-form-button primary"
              type="submit"
              disabled={
                isSaving
              }
            >
              {isSaving
                ? "Enregistrement..."
                : mode ===
                    "create"
                  ? "Créer la prestation"
                  : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          CONFIRMATION SUPPRESSION
         ===================================================== */}

      {deleteDialogOpen &&
      service ? (
        <AdminConfirmDialog
          title="Supprimer définitivement cet événement ?"
          description="Toutes les données ainsi que les images seront supprimées. Cette action est irréversible."
          confirmLabel="Supprimer définitivement"
          cancelLabel="Annuler"
          variant="danger"
          pending={
            isDeleting
          }
          pendingLabel="Suppression en cours..."
          confirmDisabled={
            deleteConfirmation.trim() !==
            "SUPPRIMER"
          }
          onConfirm={
            handleDeleteService
          }
          onCancel={() => {
            if (
              isDeleting
            ) {
              return;
            }

            setDeleteDialogOpen(
              false,
            );

            setDeleteConfirmation(
              "",
            );
          }}
        >
          <label className="admin-confirm-dialog-field">
            <span>
              Tapez SUPPRIMER pour confirmer
            </span>

            <input
              value={
                deleteConfirmation
              }
              disabled={
                isDeleting
              }
              onChange={(
                event,
              ) =>
                setDeleteConfirmation(
                  event.target.value,
                )
              }
            />

            <small>
              {deleteConfirmation.trim() ===
              "SUPPRIMER"
                ? "Confirmation validée."
                : "Tapez SUPPRIMER pour activer le bouton."}
            </small>
          </label>
        </AdminConfirmDialog>
      ) : null}
    </form>
  );
}