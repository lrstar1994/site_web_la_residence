"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { createVenueAction, deleteVenueAction, updateVenueAction } from "@/app/[locale]/admin/(protected)/salles/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import { VenueSetupIcon } from "@/components/venues/VenueSetupIcon";
import {
  emptyVenueFormValues,
  type AdminVenueDetail,
  type AdminVenueFormState,
  type AdminVenueFormValues,
  type AdminVenueSetup,
  type AdminVenueUseType,
} from "@/lib/admin/venues/admin-venue-types";
import { compressImage, formatImageSize, validateOriginalImage } from "@/lib/images/compress-image";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { removeUploadedImages } from "@/lib/storage/remove-uploaded-images";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";

type Props = { mode: "create" | "edit"; venue?: AdminVenueDetail; setups: AdminVenueSetup[]; useTypes?: AdminVenueUseType[] };

type PendingVenueImage = {
  clientId: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
  originalSize: number;
  compressedSize: number;
};

const MAX_IMAGES = 15;

function initialValues(venue?: AdminVenueDetail): AdminVenueFormValues {
  if (!venue) return emptyVenueFormValues;
  const cover = venue.images.find((image) => image.isCover && image.isActive);
  return {
    code: venue.code,
    name: venue.name,
    locationFr: venue.locationFr,
    locationEn: venue.locationEn,
    shortDescriptionFr: venue.shortDescriptionFr,
    shortDescriptionEn: venue.shortDescriptionEn,
    capacity: String(venue.capacity),
    surfaceM2: venue.surfaceM2,
    sortOrder: venue.sortOrder,
    isActive: venue.isActive,
    coverImageValue: cover ? `existing:${cover.id}` : "",
    deletedImageIds: [],
  };
}

function Field({ name, label, value, error, type = "text", onChange, required = true }: { name: string; label: string; value: string; error?: string; type?: "text" | "number"; required?: boolean; onChange: (value: string) => void }) {
  return <label className="admin-news-form-field"><span>{label}</span><input name={name} type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} />{error ? <strong className="admin-news-form-error">{error}</strong> : null}</label>;
}

function TextArea({ name, label, value, error, rows = 5, onChange }: { name: string; label: string; value: string; error?: string; rows?: number; onChange: (value: string) => void }) {
  return <label className="admin-news-form-field"><span>{label}</span><textarea name={name} value={value} rows={rows} required onChange={(event) => onChange(event.target.value)} />{error ? <strong className="admin-news-form-error">{error}</strong> : null}</label>;
}

export function AdminVenueForm({ mode, venue, setups, useTypes = [] }: Props) {
  const values = useMemo(() => initialValues(venue), [venue]);
  const initialState = useMemo<AdminVenueFormState>(() => ({ ok: false, message: "", fieldErrors: {}, values }), [values]);
  const action = mode === "create" ? createVenueAction : updateVenueAction.bind(null, venue?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminVenueFormValues>(state.values);
  const [selectedSetups, setSelectedSetups] = useState<Set<string>>(() => new Set(venue?.selectedSetupIds ?? []));
  const [pendingImages, setPendingImages] = useState<PendingVenueImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [deleteVenueDialogOpen, setDeleteVenueDialogOpen] = useState(false);
  const [deleteVenueConfirmation, setDeleteVenueConfirmation] = useState("");
  const [deleteVenueError, setDeleteVenueError] = useState<string | null>(null);
  const [isDeletingVenue, startDeleteVenueTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImagesRef = useRef<PendingVenueImage[]>([]);
  const existingImages = venue?.images ?? [];
  const activeExistingImages = existingImages.filter((image) => image.isActive && !deletedImageIds.includes(image.id));
  const deleteCandidate = existingImages.find((image) => image.id === deleteCandidateId) ?? null;
  const visibleImageCount = activeExistingImages.length + pendingImages.length;
  const configuredUseTypeIds = new Set(venue?.usePresentations.map((presentation) => presentation.useTypeId) ?? []);
  const availableUseTypes = useTypes.filter((useType) => useType.isActive && !configuredUseTypeIds.has(useType.id));

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const update = (field: keyof AdminVenueFormValues, value: string) => setFormValues((current) => ({ ...current, [field]: value }));

  function syncFileInput(images: PendingVenueImage[]) {
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
      setFormValues((valuesNow) => {
        if (!valuesNow.coverImageValue.startsWith("pending:")) return valuesNow;
        const coverIndex = Number(valuesNow.coverImageValue.replace("pending:", ""));
        const coverImage = current[coverIndex];
        if (coverImage?.clientId !== clientId) return valuesNow;
        return { ...valuesNow, coverImageValue: activeExistingImages[0] ? `existing:${activeExistingImages[0].id}` : next[0] ? "pending:0" : "" };
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
      setImageError("Une salle peut contenir au maximum 15 images.");
      syncFileInput(pendingImages);
      return;
    }

    const accepted: PendingVenueImage[] = [];
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
      const next = [
        ...current,
        ...accepted.map((image, index) => ({ ...image, isCover: shouldCover && index === 0 })),
      ];
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
          folder: `venues/${formValues.code || formValues.name || "salle"}`,
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

  function handleDeleteVenue() {
    if (!venue || deleteVenueConfirmation.trim() !== "SUPPRIMER") return;
    setDeleteVenueError(null);
    startDeleteVenueTransition(async () => {
      const result = await deleteVenueAction(venue.id);
      if (!result.ok) setDeleteVenueError(result.message);
    });
  }

  return (
    <form className="admin-news-form" onSubmit={handleSubmit}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/salles" />
        <div>
          <p className="admin-section-kicker">Salles</p>
          <h1>{mode === "create" ? "Nouvelle salle" : "Modifier la salle"}</h1>
          <p>Renseignez les contenus bilingues, la capacite, les images et les configurations.</p>
        </div>
      </header>
      {state.message ? <section className="admin-news-form-alert" role="alert">{state.message}</section> : null}
      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Images</p><h2>Galerie</h2></div>
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
            <Field name="name" label="Nom de la salle" value={formValues.name} error={state.fieldErrors.name} onChange={(value) => update("name", value)} />
            <Field name="location_fr" label="Emplacement francais" value={formValues.locationFr} error={state.fieldErrors.locationFr} onChange={(value) => update("locationFr", value)} />
            <Field name="location_en" label="Emplacement anglais" value={formValues.locationEn} error={state.fieldErrors.locationEn} onChange={(value) => update("locationEn", value)} />
            <Field name="capacity" label="Capacite maximale" value={formValues.capacity} error={state.fieldErrors.capacity} type="number" onChange={(value) => update("capacity", value)} />
            <Field name="surface_m2" label="Surface en m2" value={formValues.surfaceM2} error={state.fieldErrors.surfaceM2} type="number" required={false} onChange={(value) => update("surfaceM2", value)} />
          </section>

          <section className="admin-news-form-card"><div className="admin-news-form-section-heading"><p>Contenu francais</p><h2>Version francaise</h2></div><TextArea name="short_description_fr" label="Courte description francaise" rows={3} value={formValues.shortDescriptionFr} error={state.fieldErrors.shortDescriptionFr} onChange={(value) => update("shortDescriptionFr", value)} /></section>
          <section className="admin-news-form-card"><div className="admin-news-form-section-heading"><p>Contenu anglais</p><h2>Version anglaise</h2></div><TextArea name="short_description_en" label="Courte description anglaise" rows={3} value={formValues.shortDescriptionEn} error={state.fieldErrors.shortDescriptionEn} onChange={(value) => update("shortDescriptionEn", value)} /></section>
          <section className="admin-news-form-card"><div className="admin-news-form-section-heading"><p>Configurations possibles</p><h2>Configurations</h2></div><div className="admin-feature-checkboxes">{setups.map((setup) => <label key={setup.id} className="admin-checkbox-field"><input name="setup_ids" type="checkbox" value={setup.id} checked={selectedSetups.has(setup.id)} onChange={(event) => setSelectedSetups((current) => { const next = new Set(current); if (event.target.checked) next.add(setup.id); else next.delete(setup.id); return next; })} /><span className="admin-feature-option-label"><VenueSetupIcon iconKey={setup.iconKey} className="admin-feature-icon" /><span>{setup.nameFr}{setup.isActive ? "" : " - inactive"}</span></span></label>)}</div></section>
          {mode === "edit" && venue ? (
            <section className="admin-news-form-card">
              <div className="admin-news-form-section-heading">
                <p>Usages de la salle</p>
                <h2>Presentations dediees</h2>
              </div>
              <p className="admin-news-form-note">
                Chaque usage peut avoir son propre titre, sa description, son statut et sa galerie.
              </p>
              {venue.usePresentations.length > 0 ? (
                <div className="admin-venue-use-list">
                  {venue.usePresentations.map((presentation) => (
                    <article className="admin-venue-use-item" key={presentation.id}>
                      <div>
                        <strong>{presentation.useTypeNameFr}</strong>
                        <span>{presentation.titleFr}</span>
                        <small>{presentation.imageCount} images · {presentation.isActive ? "Actif" : "Inactif"}</small>
                      </div>
                      <Link className="admin-news-action" href={`/fr/admin/salles/${venue.id}/usages/${presentation.id}/modifier`}>
                        Modifier
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="admin-news-form-note">Aucun usage specifique n&apos;est encore configure. Le site utilise la presentation generale.</p>
              )}
              {availableUseTypes.length > 0 ? (
                <div className="admin-venue-use-add-grid">
                  {availableUseTypes.map((useType) => (
                    <Link
                      className="admin-news-new admin-news-secondary"
                      href={`/fr/admin/salles/${venue.id}/usages/nouveau?useTypeId=${useType.id}`}
                      key={useType.id}
                    >
                      + Ajouter : {useType.nameFr}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="admin-news-form-note">Tous les types d&apos;usage actifs sont deja configures pour cette salle.</p>
              )}
            </section>
          ) : null}
        </div>
        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Visibilite</p><h2>Affichage</h2></div>
            <input type="hidden" name="code" value={formValues.code} />
            <input type="hidden" name="sort_order" value={formValues.sortOrder} />
            <AdminVisibilityField checked={formValues.isActive} label="Afficher cette salle sur le site" onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))} />
          </section>
          {mode === "edit" ? (
            <section className="admin-danger-zone">
              <div><p>Zone dangereuse</p><h2>Supprimer definitivement cette salle</h2><span>La salle, toutes ses images et tous les fichiers associes dans Supabase Storage seront supprimes definitivement.</span></div>
              {deleteVenueError ? <strong className="admin-news-form-error">{deleteVenueError}</strong> : null}
              <button className="admin-danger-zone-button" type="button" aria-haspopup="dialog" disabled={isDeletingVenue} onClick={() => setDeleteVenueDialogOpen(true)}>{isDeletingVenue ? "Suppression en cours..." : "Supprimer cette salle"}</button>
            </section>
          ) : null}
          <div className="admin-news-form-actions"><button className="admin-news-form-button primary" type="submit" disabled={isSaving}>{isSaving ? "Enregistrement..." : mode === "create" ? "Creer la salle" : "Enregistrer les modifications"}</button></div>
        </div>
      </div>
      {deleteCandidate ? (
        <AdminConfirmDialog title="Supprimer cette photo ?" description="Cette photo sera supprimee definitivement de Supabase Storage apres l'enregistrement de la salle." confirmLabel="Supprimer la photo" cancelLabel="Annuler" variant="danger" onConfirm={() => markExistingImageForDeletion(deleteCandidate.id)} onCancel={() => setDeleteCandidateId(null)}>
          <div className="admin-confirm-dialog-preview"><Image src={deleteCandidate.imagePath} alt={deleteCandidate.altFr} width={72} height={72} /><span>{deleteCandidate.altFr || "Photo de la salle"}</span></div>
        </AdminConfirmDialog>
      ) : null}
      {deleteVenueDialogOpen && venue ? (
        <AdminConfirmDialog title="Supprimer definitivement cette salle ?" description="Toutes les images associees seront supprimees de Supabase Storage. La salle disparaitra du site et du back-office. Cette action est irreversible." confirmLabel="Supprimer definitivement" cancelLabel="Annuler" variant="danger" pending={isDeletingVenue} pendingLabel="Suppression en cours..." confirmDisabled={deleteVenueConfirmation.trim() !== "SUPPRIMER"} onConfirm={handleDeleteVenue} onCancel={() => { if (isDeletingVenue) return; setDeleteVenueDialogOpen(false); setDeleteVenueConfirmation(""); }}>
          <label className="admin-confirm-dialog-field"><span>Tapez SUPPRIMER pour confirmer</span><input value={deleteVenueConfirmation} disabled={isDeletingVenue} onChange={(event) => setDeleteVenueConfirmation(event.target.value)} /><small>{deleteVenueConfirmation.trim() === "SUPPRIMER" ? "Confirmation validee." : "Tapez SUPPRIMER pour activer le bouton."}</small></label>
        </AdminConfirmDialog>
      ) : null}
    </form>
  );
}
