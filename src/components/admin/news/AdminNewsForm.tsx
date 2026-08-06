"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import {
  createAdminNewsArticle,
  deleteAdminNewsArticleAction,
  updateAdminNewsArticle,
} from "@/app/[locale]/admin/(protected)/actualites/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { PendingAdminGalleryImage } from "@/components/admin/common/AdminMultiImageField";
import { AdminNewsFormActions } from "@/components/admin/news/AdminNewsFormActions";
import { AdminNewsFormFields } from "@/components/admin/news/AdminNewsFormFields";
import { AdminNewsStatusPanel } from "@/components/admin/news/AdminNewsStatusPanel";
import {
  type AdminNewsArticle,
  type AdminNewsCategory,
  emptyAdminNewsFormValues,
  type AdminNewsFormState,
  type AdminNewsFormValues,
} from "@/lib/admin/news/admin-news-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { removeUploadedImages } from "@/lib/storage/remove-uploaded-images";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";

type AdminNewsFormProps = {
  mode: "create" | "edit";
  categories: AdminNewsCategory[];
  article?: AdminNewsArticle;
};

function toMadagascarDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const madagascarDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const year = madagascarDate.getUTCFullYear();
  const month = String(madagascarDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(madagascarDate.getUTCDate()).padStart(2, "0");
  const hour = String(madagascarDate.getUTCHours()).padStart(2, "0");
  const minute = String(madagascarDate.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function getStatusLabel(article?: AdminNewsArticle) {
  if (!article) {
    return "Brouillon";
  }

  if (
    article.status === "published" &&
    article.publishedAt &&
    new Date(article.publishedAt).getTime() > Date.now()
  ) {
    return `Programmé pour le ${new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Indian/Antananarivo",
    }).format(new Date(article.publishedAt))}`;
  }

  if (article.status === "published") {
    return "Publié";
  }

  if (article.status === "archived") {
    return "Archivé";
  }

  return "Brouillon";
}

function getInitialValues(article?: AdminNewsArticle): AdminNewsFormValues {
  if (!article) {
    return emptyAdminNewsFormValues;
  }
  const cover = article.images.find((image) => image.isCover && image.isActive) ??
    article.images.find((image) => image.isActive);

  return {
    code: article.code,
    categoryId: article.categoryId,
    imagePath: article.imagePath,
    imageAltFr: article.imageAltFr,
    imageAltEn: article.imageAltEn,
    titleFr: article.titleFr,
    titleEn: article.titleEn,
    excerptFr: article.excerptFr,
    excerptEn: article.excerptEn,
    contentFr: article.contentFr,
    contentEn: article.contentEn,
    scheduledAt: toMadagascarDateTimeLocal(article.publishedAt),
    coverImageValue: cover ? `existing:${cover.id}` : "",
    deletedImageIds: [],
  };
}

export function AdminNewsForm({ mode, categories, article }: AdminNewsFormProps) {
  const initialValues = useMemo(() => getInitialValues(article), [article]);
  const initialState = useMemo<AdminNewsFormState>(
    () => ({
      ok: false,
      message: "",
      fieldErrors: {},
      values: initialValues,
    }),
    [initialValues],
  );
  const action =
    mode === "create"
      ? createAdminNewsArticle
      : updateAdminNewsArticle.bind(null, article?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [values, setValues] = useState<AdminNewsFormValues>(initialValues);
  const [selectedIntent, setSelectedIntent] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingAdminGalleryImage[]>([]);
  const [imageSubmitError, setImageSubmitError] = useState<string | null>(null);
  const [imageSubmitStatus, setImageSubmitStatus] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function updateField(field: keyof AdminNewsFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!(form instanceof HTMLFormElement)) {
      setImageSubmitError("Impossible de preparer le formulaire.");
      return;
    }

    if (isSaving) return;

    setImageSubmitError(null);
    setImageSubmitStatus(null);
    const uploadedPaths: string[] = [];

    try {
      const formData = new FormData(form);
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      if (submitter instanceof HTMLButtonElement && submitter.name) {
        formData.set(submitter.name, submitter.value);
      }

      const supabase = createSupabaseBrowserClient();
      const uploadedImagePaths: string[] = [];

      for (const image of pendingImages) {
        setImageSubmitStatus(`Envoi de l'image "${image.file.name}"...`);
        const upload = await uploadOptimizedImage({
          file: image.file,
          bucket: "site-news",
          folder: `articles/${values.code || values.titleFr || "article"}`,
          supabaseClient: supabase,
          alreadyOptimized: true,
        });

        if (!upload.ok) throw new Error(upload.message);

        uploadedPaths.push(upload.storagePath);
        uploadedImagePaths.push(upload.publicUrl);
      }

      formData.delete("uploaded_image_path");
      formData.delete("uploaded_image_paths");
      formData.delete("image_file");
      formData.delete("image_files");
      uploadedImagePaths.forEach((imagePath) => formData.append("uploaded_image_paths", imagePath));

      startSavingTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await removeUploadedImages({
          supabaseClient: createSupabaseBrowserClient(),
          bucket: "site-news",
          storagePaths: uploadedPaths,
        });
      }
      setImageSubmitError(error instanceof Error ? error.message : "Impossible d'envoyer l'image.");
    } finally {
      setImageSubmitStatus(null);
    }
  }

  function handleDeleteArticle() {
    if (!article || deleteConfirmation.trim() !== "SUPPRIMER") return;

    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteAdminNewsArticleAction(article.id);
      if (!result.ok) setDeleteError(result.message);
    });
  }

  return (
    <form className="admin-news-form" onSubmit={handleSubmit}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/actualites" />
        <div>
          <p className="admin-section-kicker">Actualités</p>
          <h2>{mode === "create" ? "Nouvel article" : "Modifier l'article"}</h2>
          <p>
            Renseignez les contenus français et anglais, puis choisissez le mode de
            publication.
          </p>
        </div>
      </header>

      {state.message ? (
        <section className="admin-news-form-alert" role="alert">
          {state.message}
        </section>
      ) : null}
      {imageSubmitError ? <section className="admin-news-form-alert" role="alert">{imageSubmitError}</section> : null}
      {imageSubmitStatus ? <section className="admin-news-form-alert" role="status">{imageSubmitStatus}</section> : null}

      <div className="admin-news-form-grid">
        <AdminNewsFormFields
          values={values}
          images={article?.images ?? []}
          errors={state.fieldErrors}
          disabled={isSaving}
          onChange={updateField}
          onCoverChange={(value) => setValues((current) => ({ ...current, coverImageValue: value }))}
          onDeletedImageIdsChange={(ids) =>
            setValues((current) => ({ ...current, deletedImageIds: ids }))
          }
          onPendingImagesChange={setPendingImages}
        />
        <div className="admin-news-form-sticky">
          <AdminNewsStatusPanel
            mode={mode}
            values={values}
            errors={state.fieldErrors}
            categories={categories}
            article={article}
            statusLabel={getStatusLabel(article)}
            selectedIntent={selectedIntent}
            onChange={updateField}
          />
          <AdminNewsFormActions mode={mode} onIntentChange={setSelectedIntent} disabled={isSaving} />
          {mode === "edit" ? (
            <section className="admin-danger-zone">
              <div>
                <p>Zone dangereuse</p>
                <h2>Supprimer definitivement cet article</h2>
                <span>Toutes les donnees, toutes les images et les fichiers associes seront supprimes.</span>
              </div>
              {deleteError ? <strong className="admin-news-form-error">{deleteError}</strong> : null}
              <button
                className="admin-danger-zone-button"
                type="button"
                aria-haspopup="dialog"
                disabled={isDeleting}
                onClick={() => setDeleteDialogOpen(true)}
              >
                {isDeleting ? "Suppression en cours..." : "Supprimer cet article"}
              </button>
            </section>
          ) : null}
        </div>
      </div>
      {deleteDialogOpen && article ? (
        <AdminConfirmDialog
          title="Supprimer definitivement cet article ?"
          description="Toutes les images associees seront supprimees de Supabase Storage. L'article disparaitra du site et du back-office. Cette action est irreversible."
          confirmLabel="Supprimer definitivement"
          cancelLabel="Annuler"
          variant="danger"
          pending={isDeleting}
          pendingLabel="Suppression en cours..."
          confirmDisabled={deleteConfirmation.trim() !== "SUPPRIMER"}
          onConfirm={handleDeleteArticle}
          onCancel={() => {
            if (isDeleting) return;
            setDeleteDialogOpen(false);
            setDeleteConfirmation("");
          }}
        >
          <label className="admin-confirm-dialog-field">
            <span>Tapez SUPPRIMER pour confirmer</span>
            <input
              value={deleteConfirmation}
              disabled={isDeleting}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
            />
            <small>
              {deleteConfirmation.trim() === "SUPPRIMER"
                ? "Confirmation validee."
                : "Tapez SUPPRIMER pour activer le bouton."}
            </small>
          </label>
        </AdminConfirmDialog>
      ) : null}
    </form>
  );
}
