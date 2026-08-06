"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteAdminAccommodation } from "@/lib/admin/accommodations/delete-admin-accommodation";
import {
  getAccommodationFormValues,
  getDefaultAccommodationFormState,
  getDefaultFeatureFormState,
  getFeatureFormValues,
  saveAccommodation,
  saveAccommodationFeature,
} from "@/lib/admin/accommodations/save-admin-accommodation";
import { getAccommodationUploadedImagePathsFromFormData } from "@/lib/admin/accommodations/upload-accommodation-image";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function featureIds(formData: FormData) {
  return formData.getAll("feature_ids").filter((value): value is string => typeof value === "string");
}

function deletedAccommodationImageIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("deleted_image_ids")
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];
}

function revalidateAccommodationPaths(id?: string) {
  revalidatePath("/fr/hebergement");
  revalidatePath("/en/accommodation");
  revalidatePath("/fr/admin/hebergements");
  revalidatePath("/fr/admin/hebergements/caracteristiques");

  if (id) {
    revalidatePath(`/fr/admin/hebergements/${id}/modifier`);
  }
}

export async function createAccommodationAction(
  previousState = getDefaultAccommodationFormState(),
  formData: FormData,
) {
  void previousState;
  const result = await saveAccommodation({
    mode: "create",
    values: getAccommodationFormValues(formData),
    imagePaths: getAccommodationUploadedImagePathsFromFormData(formData),
    deletedImageIds: [],
    featureIds: featureIds(formData),
  });

  if (!result.ok) return result;

  revalidateAccommodationPaths();
  redirect("/fr/admin/hebergements?notice=created");
}

export async function updateAccommodationAction(
  accommodationId: string,
  previousState = getDefaultAccommodationFormState(),
  formData: FormData,
) {
  void previousState;
  const result = await saveAccommodation({
    mode: "update",
    accommodationId,
    values: getAccommodationFormValues(formData),
    imagePaths: getAccommodationUploadedImagePathsFromFormData(formData),
    deletedImageIds: deletedAccommodationImageIds(formData),
    featureIds: featureIds(formData),
  });

  if (!result.ok) return result;

  revalidateAccommodationPaths(accommodationId);
  redirect("/fr/admin/hebergements?notice=updated");
}

export async function deleteAccommodationAction(accommodationId: string) {
  const result = await deleteAdminAccommodation(accommodationId);

  if (!result.ok) return result;

  revalidateAccommodationPaths(accommodationId);
  redirect("/fr/admin/hebergements?notice=deleted");
}

export async function toggleAccommodationAction(accommodationId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase
    .from("accommodations")
    .update({ is_active: nextActive })
    .eq("id", accommodationId);

  if (error) {
    console.error("[admin-accommodations] Toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier son état." };
  }

  revalidateAccommodationPaths(accommodationId);
  return {
    ok: true,
    message: nextActive ? "Hébergement activé avec succès." : "Hébergement désactivé avec succès.",
  };
}

export async function toggleAccommodationImageAction(imageId: string, accommodationId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase
    .from("accommodation_images")
    .update({ is_active: nextActive })
    .eq("id", imageId);

  if (error) {
    console.error("[admin-accommodations] Image toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier l'image." };
  }

  revalidateAccommodationPaths(accommodationId);
  return { ok: true, message: nextActive ? "Image activée." : "Image désactivée." };
}

export async function setAccommodationCoverAction(imageId: string, accommodationId: string) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  await supabase
    .from("accommodation_images")
    .update({ is_cover: false })
    .eq("accommodation_id", accommodationId)
    .eq("is_cover", true);
  const { error } = await supabase
    .from("accommodation_images")
    .update({ is_cover: true, is_active: true })
    .eq("id", imageId);

  if (error) {
    console.error("[admin-accommodations] Cover update failed:", error.message);
    return { ok: false, message: "Impossible de définir l'image de couverture." };
  }

  revalidateAccommodationPaths(accommodationId);
  return { ok: true, message: "Image de couverture mise à jour." };
}

export async function createAccommodationFeatureAction(
  previousState = getDefaultFeatureFormState(),
  formData: FormData,
) {
  void previousState;
  const result = await saveAccommodationFeature({
    mode: "create",
    values: getFeatureFormValues(formData),
  });

  if (!result.ok) return result;

  revalidateAccommodationPaths();
  redirect("/fr/admin/hebergements/caracteristiques?notice=created");
}

export async function updateAccommodationFeatureAction(
  featureId: string,
  previousState = getDefaultFeatureFormState(),
  formData: FormData,
) {
  void previousState;
  const result = await saveAccommodationFeature({
    mode: "update",
    featureId,
    values: getFeatureFormValues(formData),
  });

  if (!result.ok) return result;

  revalidateAccommodationPaths();
  redirect("/fr/admin/hebergements/caracteristiques?notice=updated");
}

export async function toggleAccommodationFeatureAction(featureId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase
    .from("accommodation_features")
    .update({ is_active: nextActive })
    .eq("id", featureId);

  if (error) {
    console.error("[admin-accommodations] Feature toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier la caractéristique." };
  }

  revalidateAccommodationPaths();
  return {
    ok: true,
    message: nextActive ? "Caractéristique activée." : "Caractéristique désactivée.",
  };
}
