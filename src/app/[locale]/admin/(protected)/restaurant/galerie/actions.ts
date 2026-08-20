"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { deleteAdminRestaurantGalleryImage } from "@/lib/admin/restaurant/delete-admin-restaurant-gallery-image";

import {
  getDefaultRestaurantGalleryImageFormState,
  saveRestaurantGalleryImages,
} from "@/lib/admin/restaurant/save-admin-restaurant-gallery";

/* ============================================================
   IMAGES UPLOADÉES
   ============================================================ */

function getUploadedImagePaths(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("uploaded_image_paths")
        .filter(
          (value): value is string =>
            typeof value === "string" && value.trim().length > 0,
        )
        .map((value) => value.trim()),
    ),
  ];
}

/* ============================================================
   REVALIDATION
   ============================================================ */

function revalidateRestaurantGalleryPaths() {
  revalidatePath("/fr/restaurant");

  revalidatePath("/en/restaurant");

  revalidatePath("/fr/admin/restaurant");

  revalidatePath("/fr/admin/restaurant/galerie");
}

/* ============================================================
   AJOUT MULTIPLE
   ============================================================ */

export async function createRestaurantGalleryImageAction(
  previousState = getDefaultRestaurantGalleryImageFormState(),

  formData: FormData,
) {
  void previousState;

  const result = await saveRestaurantGalleryImages({
    imagePaths: getUploadedImagePaths(formData),
  });

  if (!result.ok) {
    return result;
  }

  revalidateRestaurantGalleryPaths();

  redirect("/fr/admin/restaurant/galerie?notice=created");
}

/* ============================================================
   SUPPRESSION
   ============================================================ */

export async function deleteRestaurantGalleryImageAction(imageId: string) {
  const result = await deleteAdminRestaurantGalleryImage(imageId);

  if (!result.ok) {
    return result;
  }

  revalidateRestaurantGalleryPaths();

  return result;
}
