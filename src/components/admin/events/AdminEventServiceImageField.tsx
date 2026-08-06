"use client";

import {
  AdminMultiImageField,
  type PendingAdminGalleryImage,
} from "@/components/admin/common/AdminMultiImageField";
import type {
  AdminEventServiceImage,
  AdminEventServiceFormState,
  AdminEventServiceFormValues,
} from "@/lib/admin/events/admin-event-service-types";

type Props = {
  images: AdminEventServiceImage[];
  values: AdminEventServiceFormValues;
  error?: AdminEventServiceFormState["fieldErrors"]["imagePath"];
  disabled?: boolean;
  onCoverChange: (value: string) => void;
  onDeletedImageIdsChange: (ids: string[]) => void;
  onPendingImagesChange: (images: PendingAdminGalleryImage[]) => void;
};

export function AdminEventServiceImageField({
  images,
  values,
  error,
  disabled = false,
  onCoverChange,
  onDeletedImageIdsChange,
  onPendingImagesChange,
}: Props) {
  return (
    <AdminMultiImageField
      title="Galerie"
      eyebrow="Images"
      existingImages={images}
      coverImageValue={values.coverImageValue}
      deletedImageIds={values.deletedImageIds}
      fieldError={error}
      disabled={disabled}
      emptyLabel="Ajoutez au moins une image pour afficher cette prestation."
      deleteConfirmDescription="Cette photo sera supprimee definitivement de Supabase Storage apres l'enregistrement de la prestation."
      maxImagesMessage="Une prestation peut contenir au maximum 15 images."
      onCoverChange={onCoverChange}
      onDeletedImageIdsChange={onDeletedImageIdsChange}
      onPendingImagesChange={onPendingImagesChange}
    />
  );
}
