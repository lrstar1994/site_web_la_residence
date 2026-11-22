"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  ImagePlus,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import {
  createHomeHeroImageAction,
  deleteHomeHeroImageAction,
  reorderHomeHeroImagesAction,
  updateHomeHeroImageAction,
} from "@/app/[locale]/admin/(protected)/accueil/diaporama/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import { validateOriginalImage } from "@/lib/images/compress-image";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { removeUploadedImages } from "@/lib/storage/remove-uploaded-images";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";
import type { HomeHeroImage } from "@/types/home-hero";

type Labels = {
  addTitle: string;
  addDescription: string;
  chooseImage: string;
  replaceImage: string;
  altFr: string;
  altEn: string;
  active: string;
  inactive: string;
  activateOnAdd: string;
  add: string;
  adding: string;
  listTitle: string;
  listDescription: string;
  empty: string;
  order: string;
  save: string;
  saving: string;
  moveUp: string;
  moveDown: string;
  drag: string;
  delete: string;
  deleteTitle: string;
  deleteDescription: string;
  deleteConfirm: string;
  cancel: string;
  deleting: string;
  maxReached: string;
  invalidFile: string;
  altRequired: string;
  uploadFailed: string;
  reorderFailed: string;
};

type AdminHomeHeroManagerProps = {
  images: HomeHeroImage[];
  locale: Locale;
  labels: Labels;
};

type EditableImage = HomeHeroImage & {
  draftAltFr: string;
  draftAltEn: string;
  draftActive: boolean;
};

function toEditable(image: HomeHeroImage): EditableImage {
  return {
    ...image,
    draftAltFr: image.alt.fr,
    draftAltEn: image.alt.en,
    draftActive: image.isActive,
  };
}

export function AdminHomeHeroManager({
  images,
  locale,
  labels,
}: AdminHomeHeroManagerProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragSourceId = useRef<string | null>(null);
  const [items, setItems] = useState<EditableImage[]>(() => images.map(toEditable));
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altFr, setAltFr] = useState("");
  const [altEn, setAltEn] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditableImage | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearFeedback() {
    setMessage(null);
    setError(null);
  }

  function resetAddForm() {
    setFile(null);
    setAltFr("");
    setAltEn("");
    setIsActive(true);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    clearFeedback();
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) {
      resetAddForm();
      return;
    }

    const validation = validateOriginalImage(selectedFile, { maxOriginalSizeMB: 5 });
    if (!validation.ok) {
      setError(validation.message || labels.invalidFile);
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(selectedFile);
    });
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || items.length >= 6) return;
    clearFeedback();

    if (!file) {
      setError(labels.invalidFile);
      return;
    }

    if (isActive && (!altFr.trim() || !altEn.trim())) {
      setError(labels.altRequired);
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const upload = await uploadOptimizedImage({
        file,
        bucket: "site-news",
        folder: "home-hero",
        supabaseClient: supabase,
        compressOptions: {
          maxOriginalSizeMB: 5,
          maxOutputSizeMB: 0.9,
          maxWidthOrHeight: 1920,
          quality: 0.84,
        },
      });

      if (!upload.ok) {
        setError(upload.message || labels.uploadFailed);
        return;
      }

      const result = await createHomeHeroImageAction(locale, {
        storagePath: upload.storagePath,
        altFr,
        altEn,
        isActive,
      });

      if (!result.ok) {
        const cleanup = await removeUploadedImages({
          supabaseClient: supabase,
          bucket: "site-news",
          storagePaths: [upload.storagePath],
        });
        setError(
          cleanup.ok
            ? result.message
            : `${result.message} ${labels.uploadFailed}`,
        );
        return;
      }

      setMessage(result.message);
      resetAddForm();
      router.refresh();
    });
  }

  function updateDraft(
    imageId: string,
    field: "draftAltFr" | "draftAltEn" | "draftActive",
    value: string | boolean,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === imageId ? { ...item, [field]: value } : item,
      ),
    );
  }

  function handleSave(item: EditableImage) {
    if (isPending) return;
    clearFeedback();

    if (item.draftActive && (!item.draftAltFr.trim() || !item.draftAltEn.trim())) {
      setError(labels.altRequired);
      return;
    }

    setSavingId(item.id);
    startTransition(async () => {
      const result = await updateHomeHeroImageAction(locale, item.id, {
        altFr: item.draftAltFr,
        altEn: item.draftAltEn,
        isActive: item.draftActive,
      });

      if (!result.ok) {
        setError(result.message);
        setSavingId(null);
        return;
      }

      setMessage(result.message);
      setSavingId(null);
      router.refresh();
    });
  }

  function persistOrder(nextItems: EditableImage[], previousItems: EditableImage[]) {
    if (isPending) return;
    clearFeedback();
    setItems(nextItems);
    startTransition(async () => {
      const result = await reorderHomeHeroImagesAction(
        locale,
        nextItems.map((item) => item.id),
      );
      if (!result.ok) {
        setItems(previousItems);
        setError(result.message || labels.reorderFailed);
        return;
      }
      setMessage(result.message);
      router.refresh();
    });
  }

  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length || isPending) return;
    const previousItems = [...items];
    const nextItems = [...items];
    const [moved] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, moved);
    persistOrder(nextItems, previousItems);
  }

  function handleDrop(event: DragEvent<HTMLElement>, targetId: string) {
    event.preventDefault();
    const sourceId = dragSourceId.current;
    dragSourceId.current = null;
    if (!sourceId || sourceId === targetId || isPending) return;

    const sourceIndex = items.findIndex((item) => item.id === sourceId);
    const targetIndex = items.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const previousItems = [...items];
    const nextItems = [...items];
    const [moved] = nextItems.splice(sourceIndex, 1);
    nextItems.splice(targetIndex, 0, moved);
    persistOrder(nextItems, previousItems);
  }

  function handleDelete() {
    if (!deleteTarget || isPending) return;
    clearFeedback();
    startTransition(async () => {
      const result = await deleteHomeHeroImageAction(locale, deleteTarget.id);
      if (!result.ok) {
        setError(result.message);
        setDeleteTarget(null);
        router.refresh();
        return;
      }
      setMessage(result.message);
      setDeleteTarget(null);
      router.refresh();
    });
  }

  const atLimit = items.length >= 6;

  return (
    <div className="admin-home-hero-manager">
      {message ? <p className="admin-home-hero-alert success" role="status">{message}</p> : null}
      {error ? <p className="admin-home-hero-alert error" role="alert">{error}</p> : null}

      <section className="admin-home-hero-panel admin-home-hero-add">
        <div className="admin-home-hero-panel-heading">
          <div>
            <h2>{labels.addTitle}</h2>
            <p>{labels.addDescription}</p>
          </div>
          <ImagePlus aria-hidden="true" />
        </div>

        {atLimit ? (
          <p className="admin-home-hero-limit" role="status">{labels.maxReached}</p>
        ) : (
          <form className="admin-home-hero-add-form" onSubmit={handleAdd}>
            <div className="admin-home-hero-upload">
              {previewUrl ? (
                <div className="admin-home-hero-upload-preview">
                  <Image src={previewUrl} alt="" fill unoptimized sizes="(max-width: 720px) 100vw, 360px" />
                </div>
              ) : (
                <div className="admin-home-hero-upload-placeholder" aria-hidden="true">
                  <Upload />
                </div>
              )}
              <label className="admin-home-hero-file-button">
                <span>{file ? labels.replaceImage : labels.chooseImage}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isPending}
                  onChange={handleFileChange}
                />
              </label>
              {file ? <small>{file.name}</small> : null}
            </div>

            <div className="admin-home-hero-add-fields">
              <label>
                <span>{labels.altFr}</span>
                <input value={altFr} disabled={isPending} onChange={(event) => setAltFr(event.target.value)} />
              </label>
              <label>
                <span>{labels.altEn}</span>
                <input value={altEn} disabled={isPending} onChange={(event) => setAltEn(event.target.value)} />
              </label>
              <label className="admin-home-hero-checkbox">
                <input type="checkbox" checked={isActive} disabled={isPending} onChange={(event) => setIsActive(event.target.checked)} />
                <span>{labels.activateOnAdd}</span>
              </label>
              <button className="admin-home-hero-primary" type="submit" disabled={isPending || !file}>
                <Upload aria-hidden="true" />
                {isPending ? labels.adding : labels.add}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="admin-home-hero-list-section">
        <div className="admin-home-hero-list-heading">
          <div>
            <h2>{labels.listTitle}</h2>
            <p>{labels.listDescription}</p>
          </div>
          <span>{items.length} / 6</span>
        </div>

        {items.length === 0 ? (
          <div className="admin-home-hero-empty"><ImagePlus aria-hidden="true" /><p>{labels.empty}</p></div>
        ) : (
          <div className="admin-home-hero-list">
            {items.map((item, index) => (
              <article
                className="admin-home-hero-card"
                key={item.id}
                draggable={!isPending}
                onDragStart={() => { dragSourceId.current = item.id; }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, item.id)}
              >
                <div className="admin-home-hero-card-drag" title={labels.drag} aria-hidden="true">
                  <GripVertical />
                </div>
                <div className="admin-home-hero-card-preview">
                  <Image src={item.publicUrl} alt={item.draftAltFr || ""} fill sizes="(max-width: 720px) 100vw, 280px" />
                  <span className={item.draftActive ? "active" : "inactive"}>
                    {item.draftActive ? labels.active : labels.inactive}
                  </span>
                </div>
                <div className="admin-home-hero-card-fields">
                  <div className="admin-home-hero-card-meta">
                    <strong>{labels.order} {index + 1}</strong>
                    <div className="admin-home-hero-order-actions">
                      <button type="button" title={labels.moveUp} aria-label={labels.moveUp} disabled={isPending || index === 0} onClick={() => moveItem(index, -1)}><ArrowUp /></button>
                      <button type="button" title={labels.moveDown} aria-label={labels.moveDown} disabled={isPending || index === items.length - 1} onClick={() => moveItem(index, 1)}><ArrowDown /></button>
                    </div>
                  </div>
                  <label>
                    <span>{labels.altFr}</span>
                    <input value={item.draftAltFr} disabled={isPending} onChange={(event) => updateDraft(item.id, "draftAltFr", event.target.value)} />
                  </label>
                  <label>
                    <span>{labels.altEn}</span>
                    <input value={item.draftAltEn} disabled={isPending} onChange={(event) => updateDraft(item.id, "draftAltEn", event.target.value)} />
                  </label>
                  <label className="admin-home-hero-checkbox">
                    <input type="checkbox" checked={item.draftActive} disabled={isPending} onChange={(event) => updateDraft(item.id, "draftActive", event.target.checked)} />
                    <span>{item.draftActive ? labels.active : labels.inactive}</span>
                  </label>
                  <div className="admin-home-hero-card-actions">
                    <button className="admin-home-hero-save" type="button" disabled={isPending} onClick={() => handleSave(item)}>
                      <Save aria-hidden="true" />
                      {savingId === item.id && isPending ? labels.saving : labels.save}
                    </button>
                    <button className="admin-home-hero-delete" type="button" disabled={isPending} onClick={() => setDeleteTarget(item)}>
                      <Trash2 aria-hidden="true" />
                      {labels.delete}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {deleteTarget ? (
        <AdminConfirmDialog
          title={labels.deleteTitle}
          description={labels.deleteDescription}
          confirmLabel={labels.deleteConfirm}
          cancelLabel={labels.cancel}
          pendingLabel={labels.deleting}
          pending={isPending}
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => { if (!isPending) setDeleteTarget(null); }}
        />
      ) : null}
    </div>
  );
}
