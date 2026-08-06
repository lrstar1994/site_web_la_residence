"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";
import {
  createVenueUsePresentationAction,
  deleteVenueUsePresentationAction,
  updateVenueUsePresentationAction,
} from "@/app/[locale]/admin/(protected)/salles/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import {
  AdminMultiImageField,
  type PendingAdminGalleryImage,
} from "@/components/admin/common/AdminMultiImageField";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import {
  emptyVenueUsePresentationFormValues,
  type AdminVenueDetail,
  type AdminVenueUsePresentation,
  type AdminVenueUsePresentationFormState,
  type AdminVenueUsePresentationFormValues,
  type AdminVenueUseType,
} from "@/lib/admin/venues/admin-venue-types";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { removeUploadedImages } from "@/lib/storage/remove-uploaded-images";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";

type Props = {
  mode: "create" | "edit";
  venue: AdminVenueDetail;
  useTypes: AdminVenueUseType[];
  selectedUseTypeId?: string;
  presentation?: AdminVenueUsePresentation;
};

function initialValues({
  venue,
  selectedUseTypeId,
  presentation,
}: {
  venue: AdminVenueDetail;
  selectedUseTypeId?: string;
  presentation?: AdminVenueUsePresentation;
}): AdminVenueUsePresentationFormValues {
  if (!presentation) {
    return {
      ...emptyVenueUsePresentationFormValues,
      venueId: venue.id,
      useTypeId: selectedUseTypeId ?? "",
    };
  }

  const cover = presentation.images.find((image) => image.isCover && image.isActive);
  return {
    venueId: venue.id,
    useTypeId: presentation.useTypeId,
    titleFr: presentation.titleFr,
    titleEn: presentation.titleEn,
    descriptionFr: presentation.descriptionFr,
    descriptionEn: presentation.descriptionEn,
    sortOrder: String(presentation.sortOrder),
    isActive: presentation.isActive,
    coverImageValue: cover ? `existing:${cover.id}` : "",
  };
}

function textField(
  name: string,
  label: string,
  value: string,
  error: string | undefined,
  onChange: (value: string) => void,
) {
  return (
    <label className="admin-news-form-field">
      <span>{label}</span>
      <input name={name} value={value} required onChange={(event) => onChange(event.target.value)} />
      {error ? <strong className="admin-news-form-error">{error}</strong> : null}
    </label>
  );
}

export function AdminVenueUsePresentationForm({
  mode,
  venue,
  useTypes,
  selectedUseTypeId,
  presentation,
}: Props) {
  const values = useMemo(() => initialValues({ venue, selectedUseTypeId, presentation }), [presentation, selectedUseTypeId, venue]);
  const initialState = useMemo<AdminVenueUsePresentationFormState>(() => ({ ok: false, message: "", fieldErrors: {}, values }), [values]);
  const action = mode === "create" ? createVenueUsePresentationAction : updateVenueUsePresentationAction.bind(null, presentation?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminVenueUsePresentationFormValues>(state.values);
  const [pendingImages, setPendingImages] = useState<PendingAdminGalleryImage[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const selectedUseType = useTypes.find((useType) => useType.id === formValues.useTypeId);
  const fallbackHref = `/fr/admin/salles/${venue.id}/modifier`;

  function update(field: keyof AdminVenueUsePresentationFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setImageError(null);
    setImageStatus(null);
    const uploadedStoragePaths: string[] = [];

    try {
      const formData = new FormData(event.currentTarget);
      const uploadedImagePaths: string[] = [];
      const supabase = createSupabaseBrowserClient();
      const folder = `venue-uses/${venue.code || venue.name || "salle"}/${selectedUseType?.code || "usage"}`;

      for (const image of pendingImages) {
        setImageStatus(`Envoi de l'image "${image.file.name}"...`);
        const upload = await uploadOptimizedImage({
          file: image.file,
          bucket: "site-news",
          folder,
          supabaseClient: supabase,
          alreadyOptimized: true,
        });

        if (!upload.ok) throw new Error(upload.message);

        uploadedImagePaths.push(upload.publicUrl);
        uploadedStoragePaths.push(upload.storagePath);
      }

      formData.delete("image_files");
      formData.delete("uploaded_image_paths");
      uploadedImagePaths.forEach((imagePath) => formData.append("uploaded_image_paths", imagePath));

      startSavingTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      if (uploadedStoragePaths.length > 0) {
        await removeUploadedImages({
          supabaseClient: createSupabaseBrowserClient(),
          bucket: "site-news",
          storagePaths: uploadedStoragePaths,
        });
      }
      setImageError(error instanceof Error ? error.message : "Impossible d'envoyer les images.");
    } finally {
      setImageStatus(null);
    }
  }

  function handleDeletePresentation() {
    if (!presentation || deleteConfirmation.trim() !== "SUPPRIMER") return;
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteVenueUsePresentationAction(venue.id, presentation.id);
      if (!result.ok) setDeleteError(result.message);
    });
  }

  return (
    <form className="admin-news-form" onSubmit={handleSubmit}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref={fallbackHref} />
        <div>
          <p className="admin-section-kicker">Usages de la salle</p>
          <h1>{mode === "create" ? "Ajouter un usage" : "Modifier cet usage"}</h1>
          <p>{venue.name} reste une seule salle, avec une presentation et une galerie dediees a cet usage.</p>
        </div>
      </header>

      {state.message ? <section className="admin-news-form-alert" role="alert">{state.message}</section> : null}
      {imageStatus ? <section className="admin-news-form-note" role="status">{imageStatus}</section> : null}
      {imageError ? <section className="admin-news-form-alert" role="alert">{imageError}</section> : null}

      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Presentation</p>
              <h2>Contenu de l&apos;usage</h2>
            </div>
            <label className="admin-news-form-field">
              <span>Type d&apos;usage</span>
              <select
                name="use_type_id"
                value={formValues.useTypeId}
                required
                disabled={mode === "edit"}
                onChange={(event) => update("useTypeId", event.target.value)}
              >
                <option value="">Choisir un usage</option>
                {useTypes.map((useType) => (
                  <option key={useType.id} value={useType.id}>
                    {useType.nameFr}
                  </option>
                ))}
              </select>
              {mode === "edit" ? <input type="hidden" name="use_type_id" value={formValues.useTypeId} /> : null}
              {state.fieldErrors.useTypeId ? <strong className="admin-news-form-error">{state.fieldErrors.useTypeId}</strong> : null}
            </label>
            {textField("title_fr", "Titre francais", formValues.titleFr, state.fieldErrors.titleFr, (value) => update("titleFr", value))}
            {textField("title_en", "Titre anglais", formValues.titleEn, state.fieldErrors.titleEn, (value) => update("titleEn", value))}
            <label className="admin-news-form-field">
              <span>Description francaise</span>
              <textarea name="description_fr" rows={5} value={formValues.descriptionFr} required onChange={(event) => update("descriptionFr", event.target.value)} />
              {state.fieldErrors.descriptionFr ? <strong className="admin-news-form-error">{state.fieldErrors.descriptionFr}</strong> : null}
            </label>
            <label className="admin-news-form-field">
              <span>Description anglaise</span>
              <textarea name="description_en" rows={5} value={formValues.descriptionEn} required onChange={(event) => update("descriptionEn", event.target.value)} />
              {state.fieldErrors.descriptionEn ? <strong className="admin-news-form-error">{state.fieldErrors.descriptionEn}</strong> : null}
            </label>
          </section>

          <AdminMultiImageField
            title="Galerie de cet usage"
            eyebrow="Images"
            existingImages={presentation?.images ?? []}
            coverImageValue={formValues.coverImageValue}
            deletedImageIds={deletedImageIds}
            fieldError={state.fieldErrors.imagePath}
            disabled={isSaving}
            emptyLabel="Aucune image specifique. Le site utilisera la galerie generale en fallback."
            deleteConfirmDescription="Cette photo sera supprimee definitivement de Supabase Storage apres l'enregistrement de l'usage."
            maxImagesMessage="Un usage peut contenir au maximum 15 images."
            onCoverChange={(value) => update("coverImageValue", value)}
            onDeletedImageIdsChange={setDeletedImageIds}
            onPendingImagesChange={setPendingImages}
          />
        </div>

        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Visibilite</p>
              <h2>Affichage</h2>
            </div>
            <input type="hidden" name="venue_id" value={venue.id} />
            <input type="hidden" name="sort_order" value={formValues.sortOrder} />
            <AdminVisibilityField
              checked={formValues.isActive}
              label="Afficher cet usage sur le site"
              onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))}
            />
          </section>

          {mode === "edit" && presentation ? (
            <section className="admin-danger-zone">
              <div>
                <p>Zone dangereuse</p>
                <h2>Retirer cet usage de la salle</h2>
                <span>La presentation et ses images seront supprimees. La salle et ses autres usages seront conserves.</span>
              </div>
              {deleteError ? <strong className="admin-news-form-error">{deleteError}</strong> : null}
              <button className="admin-danger-zone-button" type="button" disabled={isDeleting} onClick={() => setDeleteDialogOpen(true)}>
                {isDeleting ? "Suppression en cours..." : "Supprimer cet usage"}
              </button>
            </section>
          ) : null}

          <div className="admin-news-form-actions">
            <button className="admin-news-form-button primary" type="submit" disabled={isSaving}>
              {isSaving ? "Enregistrement..." : mode === "create" ? "Ajouter cet usage" : "Enregistrer cet usage"}
            </button>
          </div>
        </div>
      </div>

      {deleteDialogOpen && presentation ? (
        <AdminConfirmDialog
          title="Supprimer cet usage ?"
          description="Toutes les images specifiques a cet usage seront supprimees de Supabase Storage. Cette action est irreversible."
          confirmLabel="Supprimer definitivement"
          cancelLabel="Annuler"
          variant="danger"
          pending={isDeleting}
          pendingLabel="Suppression en cours..."
          confirmDisabled={deleteConfirmation.trim() !== "SUPPRIMER"}
          onConfirm={handleDeletePresentation}
          onCancel={() => {
            if (isDeleting) return;
            setDeleteDialogOpen(false);
            setDeleteConfirmation("");
          }}
        >
          <label className="admin-confirm-dialog-field">
            <span>Tapez SUPPRIMER pour confirmer</span>
            <input value={deleteConfirmation} disabled={isDeleting} onChange={(event) => setDeleteConfirmation(event.target.value)} />
            <small>{deleteConfirmation.trim() === "SUPPRIMER" ? "Confirmation validee." : "Tapez SUPPRIMER pour activer le bouton."}</small>
          </label>
        </AdminConfirmDialog>
      ) : null}
    </form>
  );
}
