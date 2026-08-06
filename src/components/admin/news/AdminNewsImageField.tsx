"use client";

import {
  AdminMultiImageField,
  type PendingAdminGalleryImage,
} from "@/components/admin/common/AdminMultiImageField";
import type {
  AdminNewsArticleImage,
  AdminNewsFormState,
  AdminNewsFormValues,
} from "@/lib/admin/news/admin-news-types";

type AdminNewsImageFieldProps = {
  images: AdminNewsArticleImage[];
  values: AdminNewsFormValues;
  error?: AdminNewsFormState["fieldErrors"]["imagePath"];
  disabled?: boolean;
  onCoverChange: (value: string) => void;
  onDeletedImageIdsChange: (ids: string[]) => void;
  onPendingImagesChange: (images: PendingAdminGalleryImage[]) => void;
};

export function AdminNewsImageField({
  images,
  values,
  error,
  disabled = false,
  onCoverChange,
  onDeletedImageIdsChange,
  onPendingImagesChange,
}: AdminNewsImageFieldProps) {
  return (
    <AdminMultiImageField
      title="Galerie"
      eyebrow="Images"
      existingImages={images}
      coverImageValue={values.coverImageValue}
      deletedImageIds={values.deletedImageIds}
      fieldError={error}
      disabled={disabled}
      emptyLabel="Ajoutez au moins une image pour publier cet article."
      deleteConfirmDescription="Cette photo sera supprimee definitivement de Supabase Storage apres l'enregistrement de l'article."
      maxImagesMessage="Un article peut contenir au maximum 15 images."
      onCoverChange={onCoverChange}
      onDeletedImageIdsChange={onDeletedImageIdsChange}
      onPendingImagesChange={onPendingImagesChange}
    />
  );
}
