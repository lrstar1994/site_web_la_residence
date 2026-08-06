"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import {
  createAccommodationAction,
  deleteAccommodationAction,
  updateAccommodationAction,
} from "@/app/[locale]/admin/(protected)/hebergements/actions";
import { AccommodationFeatureIcon } from "@/components/accommodation/AccommodationFeatureIcon";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import {
  emptyAccommodationFormValues,
  type AdminAccommodationDetail,
  type AdminAccommodationFeature,
  type AdminAccommodationFeatureGroup,
  type AdminAccommodationFormState,
  type AdminAccommodationFormValues,
} from "@/lib/admin/accommodations/admin-accommodation-types";
import { compressImage, formatImageSize, validateOriginalImage } from "@/lib/images/compress-image";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { removeUploadedImages } from "@/lib/storage/remove-uploaded-images";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";

type Props = {
  mode: "create" | "edit";
  accommodation?: AdminAccommodationDetail;
  groups: AdminAccommodationFeatureGroup[];
  features: AdminAccommodationFeature[];
};

type PendingAccommodationImage = {
  clientId: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
  originalSize: number;
  compressedSize: number;
};

const MAX_IMAGES = 15;

function initialValues(accommodation?: AdminAccommodationDetail): AdminAccommodationFormValues {
  if (!accommodation) return emptyAccommodationFormValues;
  const cover = accommodation.images.find((image) => image.isCover && image.isActive) ?? accommodation.images.find((image) => image.isActive);

  return {
    code: accommodation.code,
    nameFr: accommodation.nameFr,
    nameEn: accommodation.nameEn,
    categoryFr: accommodation.categoryFr,
    categoryEn: accommodation.categoryEn,
    shortDescriptionFr: accommodation.shortDescriptionFr,
    shortDescriptionEn: accommodation.shortDescriptionEn,
    capacity: String(accommodation.capacity),
    surfaceM2: accommodation.surfaceM2,
    priceFrom: accommodation.priceFrom,
    sortOrder: accommodation.sortOrder,
    isActive: accommodation.isActive,
    coverImageValue: cover ? `existing:${cover.id}` : "",
    deletedImageIds: [],
  };
}

function inputName(name: keyof AdminAccommodationFormValues) {
  const names: Record<keyof AdminAccommodationFormValues, string> = {
    code: "code",
    nameFr: "name_fr",
    nameEn: "name_en",
    categoryFr: "category_fr",
    categoryEn: "category_en",
    shortDescriptionFr: "short_description_fr",
    shortDescriptionEn: "short_description_en",
    capacity: "capacity",
    surfaceM2: "surface_m2",
    priceFrom: "price_from",
    sortOrder: "sort_order",
    isActive: "is_active",
    coverImageValue: "cover_image_value",
    deletedImageIds: "deleted_image_ids",
  };

  return names[name];
}

function Field({
  name,
  label,
  value,
  error,
  type = "text",
  onChange,
  required = true,
}: {
  name: keyof AdminAccommodationFormValues;
  label: string;
  value: string;
  error?: string;
  type?: "text" | "number";
  required?: boolean;
  onChange: (field: keyof AdminAccommodationFormValues, value: string) => void;
}) {
  return (
    <label className="admin-news-form-field">
      <span>{label}</span>
      <input name={inputName(name)} type={type} value={value} required={required} onChange={(event) => onChange(name, event.target.value)} />
      {error ? <strong className="admin-news-form-error">{error}</strong> : null}
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
  name: "shortDescriptionFr" | "shortDescriptionEn";
  label: string;
  value: string;
  error?: string;
  onChange: (field: keyof AdminAccommodationFormValues, value: string) => void;
}) {
  return (
    <label className="admin-news-form-field">
      <span>{label}</span>
      <textarea name={inputName(name)} value={value} rows={3} required onChange={(event) => onChange(name, event.target.value)} />
      {error ? <strong className="admin-news-form-error">{error}</strong> : null}
    </label>
  );
}

export function AdminAccommodationForm({ mode, accommodation, groups, features }: Props) {
  const values = useMemo(() => initialValues(accommodation), [accommodation]);
  const initialState = useMemo<AdminAccommodationFormState>(() => ({ ok: false, message: "", fieldErrors: {}, values }), [values]);
  const action = mode === "create" ? createAccommodationAction : updateAccommodationAction.bind(null, accommodation?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminAccommodationFormValues>(state.values);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(() => new Set(accommodation?.selectedFeatureIds ?? []));
  const [pendingImages, setPendingImages] = useState<PendingAccommodationImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [deleteAccommodationDialogOpen, setDeleteAccommodationDialogOpen] = useState(false);
  const [deleteAccommodationConfirmation, setDeleteAccommodationConfirmation] = useState("");
  const [deleteAccommodationError, setDeleteAccommodationError] = useState<string | null>(null);
  const [isDeletingAccommodation, startDeleteAccommodationTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImagesRef = useRef<PendingAccommodationImage[]>([]);
  const existingImages = accommodation?.images ?? [];
  const activeExistingImages = existingImages.filter((image) => image.isActive && !deletedImageIds.includes(image.id));
  const deleteCandidate = existingImages.find((image) => image.id === deleteCandidateId) ?? null;
  const visibleImageCount = existingImages.filter((image) => !deletedImageIds.includes(image.id)).length + pendingImages.length;

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  function updateField(field: keyof AdminAccommodationFormValues, value: string) {
    setFormValues((current) => ({ ...current, [field]: value }));
  }

  function syncFileInput(images: PendingAccommodationImage[]) {
    pendingImagesRef.current = images;
    if (!fileInputRef.current) return;
    const transfer = new DataTransfer();
    images.forEach((image) => transfer.items.add(image.file));
    fileInputRef.current.files = transfer.files;
  }

  function setCover(value: string) {
    setFormValues((current) => ({ ...current, coverImageValue: value }));
    setPendingImages((current) => current.map((image, index) => ({ ...image, isCover: value === `pending:${index}` })));
  }

  function removePendingImage(clientId: string) {
    setPendingImages((current) => {
      const removed = current.find((image) => image.clientId === clientId);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = current.filter((image) => image.clientId !== clientId);
      setFormValues((currentValues) => {
        if (!currentValues.coverImageValue.startsWith("pending:")) return currentValues;
        const coverIndex = Number(currentValues.coverImageValue.replace("pending:", ""));
        const coverImage = current[coverIndex];
        if (coverImage?.clientId !== clientId) return currentValues;
        return { ...currentValues, coverImageValue: activeExistingImages[0] ? `existing:${activeExistingImages[0].id}` : next[0] ? "pending:0" : "" };
      });
      const normalized = next.map((image, index) => ({ ...image, isCover: formValues.coverImageValue === `pending:${index}` }));
      syncFileInput(normalized);
      return normalized;
    });
  }

  function markExistingImageForDeletion(imageId: string) {
    setDeletedImageIds((current) => (current.includes(imageId) ? current : [...current, imageId]));
    setFormValues((current) => {
      if (current.coverImageValue !== `existing:${imageId}`) return current;
      const fallbackExisting = existingImages.find((image) => image.isActive && image.id !== imageId && !deletedImageIds.includes(image.id));
      if (fallbackExisting) return { ...current, coverImageValue: `existing:${fallbackExisting.id}` };
      return { ...current, coverImageValue: pendingImages[0] ? "pending:0" : "" };
    });
    setDeleteCandidateId(null);
  }

  function undoExistingImageDeletion(imageId: string) {
    setDeletedImageIds((current) => current.filter((id) => id !== imageId));
  }

  async function handleFiles(files: File[]) {
    setImageError(null);
    setImageStatus(null);
    const total = activeExistingImages.length + pendingImages.length + files.length;
    if (total > MAX_IMAGES) {
      setImageError("Un hebergement peut contenir au maximum 15 images.");
      syncFileInput(pendingImages);
      return;
    }

    const accepted: PendingAccommodationImage[] = [];
    setImageStatus("Optimisation de l'image...");

    try {
      for (const file of files) {
        const validation = validateOriginalImage(file);
        if (!validation.ok) {
          setImageError(validation.message);
          syncFileInput(pendingImages);
          return;
        }

        const compressed = await compressImage(file);
        accepted.push({
          clientId: `${compressed.file.name}-${compressed.file.size}-${crypto.randomUUID()}`,
          file: compressed.file,
          previewUrl: URL.createObjectURL(compressed.file),
          isCover: false,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        });
      }
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "Impossible d'optimiser l'image.");
      syncFileInput(pendingImages);
      return;
    } finally {
      setImageStatus(null);
    }

    setPendingImages((current) => {
      const shouldCover = !formValues.coverImageValue && activeExistingImages.length === 0 && current.length === 0;
      const next = [...current, ...accepted.map((image, index) => ({ ...image, isCover: shouldCover && index === 0 }))];
      if (shouldCover && next[0]) setFormValues((currentValues) => ({ ...currentValues, coverImageValue: "pending:0" }));
      syncFileInput(next);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!(form instanceof HTMLFormElement)) {
      setImageError("Impossible de preparer le formulaire.");
      return;
    }

    if (isSaving) return;

    setImageError(null);
    setImageStatus(null);
    const uploadedStoragePaths: string[] = [];

    try {
      const formData = new FormData(form);
      const uploadedImagePaths: string[] = [];
      const supabase = createSupabaseBrowserClient();

      for (const image of pendingImages) {
        setImageStatus(`Envoi de l'image "${image.file.name}"...`);
        const upload = await uploadOptimizedImage({
          file: image.file,
          bucket: "site-news",
          folder: `accommodations/${formValues.code || formValues.nameFr || "hebergement"}`,
          supabaseClient: supabase,
          alreadyOptimized: true,
        });

        if (!upload.ok) throw new Error(upload.message);

        uploadedImagePaths.push(upload.publicUrl);
        uploadedStoragePaths.push(upload.storagePath);
      }

      formData.delete("image_files");
      formData.delete("image_file");
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

  function handleDeleteAccommodation() {
    if (!accommodation || deleteAccommodationConfirmation.trim() !== "SUPPRIMER") return;
    setDeleteAccommodationError(null);
    startDeleteAccommodationTransition(async () => {
      const result = await deleteAccommodationAction(accommodation.id);
      if (!result.ok) setDeleteAccommodationError(result.message);
    });
  }

  return (
    <form className="admin-news-form" onSubmit={handleSubmit}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/hebergements" />
        <div>
          <p className="admin-section-kicker">Hebergements</p>
          <h1>{mode === "create" ? "Nouvel hebergement" : "Modifier l'hebergement"}</h1>
          <p>Renseignez les contenus bilingues, le prix, la galerie et les caracteristiques.</p>
        </div>
      </header>

      {state.message ? <section className="admin-news-form-alert" role="alert">{state.message}</section> : null}

      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Images</p>
              <h2>Galerie</h2>
            </div>
            <p className="admin-section-kicker">{visibleImageCount} / {MAX_IMAGES} images</p>
            {imageError ? <strong className="admin-news-form-error">{imageError}</strong> : null}
            {imageStatus ? <p className="admin-news-form-note" role="status">{imageStatus}</p> : null}
            {state.fieldErrors.imagePath ? <strong className="admin-news-form-error">{state.fieldErrors.imagePath}</strong> : null}
            <div className="admin-restaurant-images-grid">
              {existingImages.map((image) => (
                <article className={`admin-restaurant-image-item ${deletedImageIds.includes(image.id) ? "is-deleted" : ""}`} key={image.id}>
                  <div className="admin-restaurant-image-thumb">
                    <Image src={image.imagePath} alt={image.altFr} fill sizes="160px" />
                    <span className="admin-restaurant-image-origin">{deletedImageIds.includes(image.id) ? "A supprimer" : "Existante"}</span>
                  </div>
                  <p>{image.isActive ? "Image enregistree" : "Image masquee"}</p>
                  <label className="admin-restaurant-cover-choice">
                    <input type="radio" name="cover_choice" disabled={deletedImageIds.includes(image.id)} checked={formValues.coverImageValue === `existing:${image.id}`} onChange={() => setCover(`existing:${image.id}`)} />
                    {formValues.coverImageValue === `existing:${image.id}` ? <span className="admin-restaurant-cover-badge">Couverture</span> : <span>Definir comme couverture</span>}
                  </label>
                  {deletedImageIds.includes(image.id) ? (
                    <button className="admin-restaurant-undo-delete" type="button" onClick={() => undoExistingImageDeletion(image.id)}>Annuler la suppression</button>
                  ) : (
                    <button className="admin-restaurant-remove-image" type="button" aria-label={`Supprimer ${image.altFr}`} onClick={() => setDeleteCandidateId(image.id)}>x</button>
                  )}
                </article>
              ))}
              {pendingImages.map((image, index) => (
                <article className="admin-restaurant-image-item" key={image.clientId}>
                  <div className="admin-restaurant-image-thumb">
                    <Image src={image.previewUrl} alt={image.file.name} fill sizes="160px" unoptimized />
                    <span className="admin-restaurant-image-origin">Nouvelle</span>
                  </div>
                  <p>{image.file.name}</p>
                  <small>
                    Taille originale : {formatImageSize(image.originalSize)}
                    <br />
                    Image optimisée : {formatImageSize(image.compressedSize)}
                  </small>
                  <label className="admin-restaurant-cover-choice">
                    <input type="radio" name="cover_choice" checked={formValues.coverImageValue === `pending:${index}`} onChange={() => setCover(`pending:${index}`)} />
                    {formValues.coverImageValue === `pending:${index}` ? <span className="admin-restaurant-cover-badge">Couverture</span> : <span>Definir comme couverture</span>}
                  </label>
                  <button className="admin-restaurant-remove-image" type="button" aria-label={`Retirer ${image.file.name}`} onClick={() => removePendingImage(image.clientId)}>x</button>
                </article>
              ))}
            </div>
            <label className="admin-restaurant-image-dropzone">
              <span>+ Ajouter des images</span>
              <small>
                Formats acceptés : JPG, PNG ou WebP.
                <br />
                Taille originale maximale : 5 Mo.
                <br />
                L&apos;image sera automatiquement optimisée avant l&apos;envoi.
              </small>
              <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={isSaving} onChange={(event) => { void handleFiles(Array.from(event.target.files ?? [])); }} />
            </label>
            <input type="hidden" name="cover_image_value" value={formValues.coverImageValue} />
            {deletedImageIds.map((id) => <input key={id} type="hidden" name="deleted_image_ids" value={id} />)}
          </section>

          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Informations principales</p><h2>Details</h2></div>
            <Field name="nameFr" label="Nom francais" value={formValues.nameFr} error={state.fieldErrors.nameFr} onChange={updateField} />
            <Field name="nameEn" label="Nom anglais" value={formValues.nameEn} error={state.fieldErrors.nameEn} onChange={updateField} />
            <Field name="categoryFr" label="Type ou categorie francaise" value={formValues.categoryFr} error={state.fieldErrors.categoryFr} onChange={updateField} required={false} />
            <Field name="categoryEn" label="Type ou categorie anglaise" value={formValues.categoryEn} error={state.fieldErrors.categoryEn} onChange={updateField} required={false} />
            <Field name="capacity" label="Capacite" value={formValues.capacity} error={state.fieldErrors.capacity} type="number" onChange={updateField} />
            <Field name="surfaceM2" label="Surface en m2" value={formValues.surfaceM2} error={state.fieldErrors.surfaceM2} type="number" onChange={updateField} required={false} />
            <Field name="priceFrom" label="Prix a partir de (MGA)" value={formValues.priceFrom} error={state.fieldErrors.priceFrom} type="number" onChange={updateField} />
          </section>

          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Contenu francais</p><h2>Version francaise</h2></div>
            <TextArea name="shortDescriptionFr" label="Courte description francaise" value={formValues.shortDescriptionFr} error={state.fieldErrors.shortDescriptionFr} onChange={updateField} />
          </section>

          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Contenu anglais</p><h2>Version anglaise</h2></div>
            <TextArea name="shortDescriptionEn" label="Courte description anglaise" value={formValues.shortDescriptionEn} error={state.fieldErrors.shortDescriptionEn} onChange={updateField} />
          </section>

          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Caracteristiques</p><h2>Groupes reutilisables</h2></div>
            <div className="admin-feature-checkboxes">
              {groups.map((group) => (
                <fieldset key={group.id} className="admin-feature-group">
                  <legend>{group.nameFr}</legend>
                  {features.filter((feature) => feature.groupId === group.id).map((feature) => (
                    <label key={feature.id} className="admin-checkbox-field">
                      <input name="feature_ids" type="checkbox" value={feature.id} checked={selectedFeatures.has(feature.id)} onChange={(event) => setSelectedFeatures((current) => { const next = new Set(current); if (event.target.checked) next.add(feature.id); else next.delete(feature.id); return next; })} />
                      <span className="admin-feature-option-label"><AccommodationFeatureIcon iconKey={feature.iconKey} className="admin-feature-icon" /><span>{feature.nameFr}{feature.isActive ? "" : " - inactive"}</span></span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </div>
          </section>
        </div>

        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Visibilite</p><h2>Affichage</h2></div>
            <input type="hidden" name="code" value={formValues.code} />
            <input type="hidden" name="sort_order" value={formValues.sortOrder} />
            <AdminVisibilityField checked={formValues.isActive} label="Afficher cet hebergement sur le site" onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))} />
          </section>
          {mode === "edit" ? (
            <section className="admin-danger-zone">
              <div><p>Zone dangereuse</p><h2>Supprimer definitivement cet hebergement</h2><span>Toutes les informations, toutes les images et tous les fichiers associes seront supprimes. Cette action est irreversible.</span></div>
              {deleteAccommodationError ? <strong className="admin-news-form-error">{deleteAccommodationError}</strong> : null}
              <button className="admin-danger-zone-button" type="button" aria-haspopup="dialog" disabled={isDeletingAccommodation} onClick={() => setDeleteAccommodationDialogOpen(true)}>{isDeletingAccommodation ? "Suppression en cours..." : "Supprimer cet hebergement"}</button>
            </section>
          ) : null}
          <div className="admin-news-form-actions">
            <button className="admin-news-form-button primary" type="submit" disabled={isSaving}>{isSaving ? "Enregistrement..." : mode === "create" ? "Creer l'hebergement" : "Enregistrer les modifications"}</button>
          </div>
        </div>
      </div>
      {deleteCandidate ? (
        <AdminConfirmDialog title="Supprimer cette photo ?" description="Cette photo sera supprimee definitivement de Supabase Storage apres l'enregistrement de l'hebergement." confirmLabel="Supprimer la photo" cancelLabel="Annuler" variant="danger" onConfirm={() => markExistingImageForDeletion(deleteCandidate.id)} onCancel={() => setDeleteCandidateId(null)}>
          <div className="admin-confirm-dialog-preview"><Image src={deleteCandidate.imagePath} alt={deleteCandidate.altFr} width={72} height={72} /><span>{deleteCandidate.altFr || "Photo de l'hebergement"}</span></div>
        </AdminConfirmDialog>
      ) : null}
      {deleteAccommodationDialogOpen && accommodation ? (
        <AdminConfirmDialog title="Supprimer definitivement cet hebergement ?" description="Toutes les images associees seront supprimees de Supabase Storage. L'hebergement disparaitra du site et du back-office. Cette action est irreversible." confirmLabel="Supprimer definitivement" cancelLabel="Annuler" variant="danger" pending={isDeletingAccommodation} pendingLabel="Suppression en cours..." confirmDisabled={deleteAccommodationConfirmation.trim() !== "SUPPRIMER"} onConfirm={handleDeleteAccommodation} onCancel={() => { if (isDeletingAccommodation) return; setDeleteAccommodationDialogOpen(false); setDeleteAccommodationConfirmation(""); }}>
          <label className="admin-confirm-dialog-field"><span>Tapez SUPPRIMER pour confirmer</span><input value={deleteAccommodationConfirmation} disabled={isDeletingAccommodation} onChange={(event) => setDeleteAccommodationConfirmation(event.target.value)} /><small>{deleteAccommodationConfirmation.trim() === "SUPPRIMER" ? "Confirmation validee." : "Tapez SUPPRIMER pour activer le bouton."}</small></label>
        </AdminConfirmDialog>
      ) : null}
    </form>
  );
}
