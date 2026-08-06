"use client";

import Image from "next/image";
import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import {
  createRestaurantMenuAction,
  deleteRestaurantMenuAction,
  updateRestaurantMenuAction,
} from "@/app/[locale]/admin/(protected)/restaurant/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import {
  formatImageSize,
  compressRestaurantImage,
  validateOriginalRestaurantImage,
} from "@/lib/images/compress-image";
import {
  emptyRestaurantMenuFormValues,
  type AdminRestaurantCategory,
  type AdminRestaurantFormState,
  type AdminRestaurantMenuDetail,
  type AdminRestaurantMenuFormValues,
} from "@/lib/admin/restaurant/admin-restaurant-types";
import {
  removeRestaurantMenuImagesFromBrowser,
  uploadRestaurantMenuImageFromBrowser,
} from "@/lib/admin/restaurant/upload-restaurant-menu-image-client";

type Props = {
  mode: "create" | "edit";
  menu?: AdminRestaurantMenuDetail;
  categories: AdminRestaurantCategory[];
};

type PendingRestaurantImage = {
  clientId: string;
  file: File;
  previewUrl: string;
  isCover: boolean;
  originalSize: number;
  compressedSize: number;
};

const MAX_IMAGES = 15;

function initialValues(menu?: AdminRestaurantMenuDetail): AdminRestaurantMenuFormValues {
  if (!menu) return emptyRestaurantMenuFormValues;
  const cover = menu.images.find((image) => image.isCover && image.isActive);
  return {
    code: menu.code,
    categoryId: menu.categoryId,
    titleFr: menu.titleFr,
    titleEn: menu.titleEn,
    shortDescriptionFr: menu.shortDescriptionFr,
    shortDescriptionEn: menu.shortDescriptionEn,
    sortOrder: menu.sortOrder,
    isActive: menu.isActive,
    coverImageValue: cover ? `existing:${cover.id}` : "",
    deletedImageIds: [],
  };
}

function Field({
  name,
  label,
  value,
  error,
  required = true,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-news-form-field">
      <span>{label}</span>
      <input name={name} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
      {error ? <strong className="admin-news-form-error">{error}</strong> : null}
    </label>
  );
}

function TextArea({
  name,
  label,
  value,
  error,
  rows = 4,
  required = true,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  error?: string;
  rows?: number;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-news-form-field">
      <span>{label}</span>
      <textarea name={name} value={value} rows={rows} required={required} onChange={(event) => onChange(event.target.value)} />
      {error ? <strong className="admin-news-form-error">{error}</strong> : null}
    </label>
  );
}

export function AdminRestaurantMenuForm({ mode, menu, categories }: Props) {
  const values = useMemo(() => initialValues(menu), [menu]);
  const initialState = useMemo<AdminRestaurantFormState<AdminRestaurantMenuFormValues>>(
    () => ({ ok: false, message: "", fieldErrors: {}, values }),
    [values],
  );
  const action = mode === "create" ? createRestaurantMenuAction : updateRestaurantMenuAction.bind(null, menu?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminRestaurantMenuFormValues>(state.values);
  const [pendingImages, setPendingImages] = useState<PendingRestaurantImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageStatus, setImageStatus] = useState<string | null>(null);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [deleteMenuDialogOpen, setDeleteMenuDialogOpen] = useState(false);
  const [deleteMenuConfirmation, setDeleteMenuConfirmation] = useState("");
  const [deleteMenuError, setDeleteMenuError] = useState<string | null>(null);
  const [isDeletingMenu, startDeleteMenuTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();
  const [isProcessingImages, setIsProcessingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImagesRef = useRef<PendingRestaurantImage[]>([]);
  const existingImages = menu?.images ?? [];
  const activeExistingImages = existingImages.filter((image) => image.isActive && !deletedImageIds.includes(image.id));
  const deleteCandidate = existingImages.find((image) => image.id === deleteCandidateId) ?? null;

  useEffect(() => {
    return () => {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  const update = (field: keyof AdminRestaurantMenuFormValues, value: string) =>
    setFormValues((current) => ({ ...current, [field]: value }));

  function syncFileInput(images: PendingRestaurantImage[]) {
    pendingImagesRef.current = images;
    if (fileInputRef.current) fileInputRef.current.value = "";
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
        return {
          ...valuesNow,
          coverImageValue: activeExistingImages[0] ? `existing:${activeExistingImages[0].id}` : next[0] ? "pending:0" : "",
        };
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
      setImageError("Une carte peut contenir au maximum 15 images.");
      syncFileInput(pendingImages);
      return;
    }

    const accepted: PendingRestaurantImage[] = [];
    setIsProcessingImages(true);
    setImageStatus("Optimisation de l'image...");

    try {
      for (const file of files) {
        const validation = validateOriginalRestaurantImage(file);
        if (!validation.ok) {
          setImageError(validation.message);
          syncFileInput(pendingImages);
          return;
        }

        const compressed = await compressRestaurantImage(file);
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
      setIsProcessingImages(false);
      setImageStatus(null);
    }

    setPendingImages((current) => {
      const shouldCover = !formValues.coverImageValue && activeExistingImages.length === 0 && current.length === 0;
      const next = [
        ...current,
        ...accepted.map((image, index) => ({
          ...image,
          isCover: shouldCover && index === 0,
        })),
      ];
      if (shouldCover && next[0]) {
        setFormValues((currentValues) => ({ ...currentValues, coverImageValue: "pending:0" }));
      }
      syncFileInput(next);
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isProcessingImages || isSaving) return;

    setImageError(null);
    setImageStatus(null);
    setIsProcessingImages(true);
    const uploadedStoragePaths: string[] = [];

    try {
      const uploadedImagePaths: string[] = [];
      const folderHint = formValues.code || formValues.titleFr || "carte";

      for (const image of pendingImages) {
        setImageStatus(`Envoi de l'image "${image.file.name}"...`);
        const upload = await uploadRestaurantMenuImageFromBrowser(image.file, folderHint);
        if (!upload.ok) {
          throw new Error(upload.message);
        }
        uploadedImagePaths.push(upload.imagePath);
        uploadedStoragePaths.push(upload.storagePath);
      }

      const formData = new FormData(event.currentTarget);
      formData.delete("image_files");
      formData.delete("uploaded_image_paths");
      uploadedImagePaths.forEach((imagePath) => formData.append("uploaded_image_paths", imagePath));

      startSavingTransition(() => {
        formAction(formData);
      });
    } catch (error) {
      if (uploadedStoragePaths.length > 0) {
        await removeRestaurantMenuImagesFromBrowser(uploadedStoragePaths);
      }
      setImageError(error instanceof Error ? error.message : "Impossible d'envoyer l'image optimisée.");
    } finally {
      setImageStatus(null);
      setIsProcessingImages(false);
    }
  }

  function handleDeleteMenu() {
    if (!menu || deleteMenuConfirmation.trim() !== "SUPPRIMER") return;
    setDeleteMenuError(null);
    startDeleteMenuTransition(async () => {
      const result = await deleteRestaurantMenuAction(menu.id);
      if (!result.ok) setDeleteMenuError(result.message);
    });
  }

  return (
    <form className="admin-news-form" onSubmit={handleSubmit}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/restaurant" />
        <div>
          <p className="admin-section-kicker">Restaurant</p>
          <h1>{mode === "create" ? "Nouvelle carte" : "Modifier la carte"}</h1>
          <p>Renseignez les contenus bilingues, la categorie et les images.</p>
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
                    <input
                      type="radio"
                      name="cover_choice"
                      disabled={deletedImageIds.includes(image.id)}
                      checked={formValues.coverImageValue === `existing:${image.id}`}
                      onChange={() => setCover(`existing:${image.id}`)}
                    />
                    {formValues.coverImageValue === `existing:${image.id}` ? (
                      <span className="admin-restaurant-cover-badge">Couverture</span>
                    ) : (
                      <span>Definir comme couverture</span>
                    )}
                  </label>
                  {deletedImageIds.includes(image.id) ? (
                    <button className="admin-restaurant-undo-delete" type="button" onClick={() => undoExistingImageDeletion(image.id)}>
                      Annuler la suppression
                    </button>
                  ) : (
                    <button
                      className="admin-restaurant-remove-image"
                      type="button"
                      aria-label={`Supprimer ${image.altFr}`}
                      onClick={() => setDeleteCandidateId(image.id)}
                    >
                      x
                    </button>
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
                    <input
                      type="radio"
                      name="cover_choice"
                      checked={formValues.coverImageValue === `pending:${index}`}
                      onChange={() => setCover(`pending:${index}`)}
                    />
                    {formValues.coverImageValue === `pending:${index}` ? (
                      <span className="admin-restaurant-cover-badge">Couverture</span>
                    ) : (
                      <span>Definir comme couverture</span>
                    )}
                  </label>
                  <button className="admin-restaurant-remove-image" type="button" aria-label={`Retirer ${image.file.name}`} onClick={() => removePendingImage(image.clientId)}>
                    x
                  </button>
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
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                disabled={isProcessingImages || isSaving}
                onChange={(event) => handleFiles(Array.from(event.target.files ?? []))}
              />
            </label>

            <input type="hidden" name="cover_image_value" value={formValues.coverImageValue} />
            {deletedImageIds.map((id) => (
              <input key={id} type="hidden" name="deleted_image_ids" value={id} />
            ))}
          </section>

          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Contenu francais</p>
              <h2>Version francaise</h2>
            </div>
            <Field name="title_fr" label="Titre francais" value={formValues.titleFr} error={state.fieldErrors.titleFr} onChange={(value) => update("titleFr", value)} />
            <TextArea name="short_description_fr" label="Courte description francaise" value={formValues.shortDescriptionFr} error={state.fieldErrors.shortDescriptionFr} onChange={(value) => update("shortDescriptionFr", value)} />
          </section>
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Contenu anglais</p>
              <h2>Version anglaise</h2>
            </div>
            <Field name="title_en" label="Titre anglais" value={formValues.titleEn} error={state.fieldErrors.titleEn} onChange={(value) => update("titleEn", value)} />
            <TextArea name="short_description_en" label="Courte description anglaise" value={formValues.shortDescriptionEn} error={state.fieldErrors.shortDescriptionEn} onChange={(value) => update("shortDescriptionEn", value)} />
          </section>
        </div>
        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Informations principales</p>
              <h2>Categorie</h2>
            </div>
            <label className="admin-news-form-field">
              <span>Categorie</span>
              <select name="category_id" value={formValues.categoryId} required onChange={(event) => update("categoryId", event.target.value)}>
                <option value="">Choisir une categorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nameFr}
                    {category.isActive ? "" : " - inactive"}
                  </option>
                ))}
              </select>
              {state.fieldErrors.categoryId ? <strong className="admin-news-form-error">{state.fieldErrors.categoryId}</strong> : null}
            </label>
          </section>
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Visibilite</p>
              <h2>Affichage</h2>
            </div>
            <input type="hidden" name="code" value={formValues.code} />
            <input type="hidden" name="sort_order" value={formValues.sortOrder} />
            <AdminVisibilityField checked={formValues.isActive} label="Afficher cette carte sur le site" onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))} />
          </section>
          {mode === "edit" ? (
            <section className="admin-danger-zone">
              <div>
                <p>Zone dangereuse</p>
                <h2>Supprimer definitivement cette carte</h2>
                <span>La carte, ses images en base et tous les fichiers associes dans Supabase Storage seront supprimes definitivement.</span>
              </div>
              {deleteMenuError ? <strong className="admin-news-form-error">{deleteMenuError}</strong> : null}
              <button
                className="admin-danger-zone-button"
                type="button"
                aria-haspopup="dialog"
                disabled={isDeletingMenu}
                onClick={() => setDeleteMenuDialogOpen(true)}
              >
                {isDeletingMenu ? "Suppression en cours..." : "Supprimer cette carte"}
              </button>
            </section>
          ) : null}
          <div className="admin-news-form-actions">
            <button className="admin-news-form-button primary" type="submit" disabled={isProcessingImages || isSaving}>
              {isProcessingImages
                ? "Traitement des images..."
                : isSaving
                  ? "Enregistrement..."
                  : mode === "create"
                    ? "Creer la carte"
                    : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
      {deleteCandidate ? (
        <AdminConfirmDialog
          title="Supprimer cette photo ?"
          description="Cette photo sera supprimee definitivement. Cette action sera appliquee apres l'enregistrement de la carte."
          confirmLabel="Supprimer la photo"
          cancelLabel="Annuler"
          variant="danger"
          onConfirm={() => markExistingImageForDeletion(deleteCandidate.id)}
          onCancel={() => setDeleteCandidateId(null)}
        >
          <div className="admin-confirm-dialog-preview">
            <Image src={deleteCandidate.imagePath} alt={deleteCandidate.altFr} width={72} height={72} />
            <span>{deleteCandidate.altFr || "Photo de la carte"}</span>
          </div>
        </AdminConfirmDialog>
      ) : null}
      {deleteMenuDialogOpen && menu ? (
        <AdminConfirmDialog
          title="Supprimer definitivement cette carte ?"
          description="Toutes les images associees seront supprimees de Supabase Storage. La carte disparaitra du site et du back-office. Cette action est irreversible."
          confirmLabel="Supprimer definitivement"
          cancelLabel="Annuler"
          variant="danger"
          pending={isDeletingMenu}
          pendingLabel="Suppression en cours..."
          confirmDisabled={deleteMenuConfirmation.trim() !== "SUPPRIMER"}
          onConfirm={handleDeleteMenu}
          onCancel={() => {
            if (isDeletingMenu) return;
            setDeleteMenuDialogOpen(false);
            setDeleteMenuConfirmation("");
          }}
        >
          <label className="admin-confirm-dialog-field">
            <span>Tapez SUPPRIMER pour confirmer</span>
            <input value={deleteMenuConfirmation} disabled={isDeletingMenu} onChange={(event) => setDeleteMenuConfirmation(event.target.value)} />
            <small>{deleteMenuConfirmation.trim() === "SUPPRIMER" ? "Confirmation validee." : "Tapez SUPPRIMER pour activer le bouton."}</small>
          </label>
        </AdminConfirmDialog>
      ) : null}
    </form>
  );
}
