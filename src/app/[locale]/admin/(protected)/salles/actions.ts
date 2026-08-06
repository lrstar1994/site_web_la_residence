"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getDefaultVenueFormState,
  getDefaultVenueSetupFormState,
  getVenueFormValues,
  getVenueSetupFormValues,
  saveVenue,
  saveVenueSetup,
} from "@/lib/admin/venues/save-admin-venue";
import {
  deleteVenueUsePresentation,
  getDefaultVenueUsePresentationFormState,
  getDefaultVenueUseTypeFormState,
  getVenueUsePresentationFormValues,
  getVenueUseTypeFormValues,
  saveVenueUsePresentation,
  saveVenueUseType,
} from "@/lib/admin/venues/save-admin-venue-use";
import { deleteAdminVenue } from "@/lib/admin/venues/delete-admin-venue";
import { getVenueUploadedImagePathsFromFormData } from "@/lib/admin/venues/upload-venue-image";
import { getVenueUseUploadedImagePathsFromFormData } from "@/lib/admin/venues/upload-venue-use-image";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function setupIds(formData: FormData) {
  return formData.getAll("setup_ids").filter((value): value is string => typeof value === "string");
}

export async function createVenueUseTypeAction(previousState = getDefaultVenueUseTypeFormState(), formData: FormData) {
  void previousState;
  const result = await saveVenueUseType({ mode: "create", values: getVenueUseTypeFormValues(formData) });
  if (!result.ok) return result;
  revalidateVenuePaths();
  redirect("/fr/admin/salles/usages?notice=created");
}

export async function updateVenueUseTypeAction(
  useTypeId: string,
  previousState = getDefaultVenueUseTypeFormState(),
  formData: FormData,
) {
  void previousState;
  const result = await saveVenueUseType({ mode: "update", useTypeId, values: getVenueUseTypeFormValues(formData) });
  if (!result.ok) return result;
  revalidateVenuePaths();
  redirect("/fr/admin/salles/usages?notice=updated");
}

export async function toggleVenueUseTypeAction(useTypeId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("venue_use_types").update({ is_active: nextActive }).eq("id", useTypeId);
  if (error) {
    console.error("[admin-venue-uses] Use type toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier le type d'usage." };
  }
  revalidateVenuePaths();
  return { ok: true, message: nextActive ? "Type d'usage active." : "Type d'usage desactive." };
}

export async function createVenueUsePresentationAction(previousState = getDefaultVenueUsePresentationFormState(), formData: FormData) {
  void previousState;
  const values = getVenueUsePresentationFormValues(formData);
  const result = await saveVenueUsePresentation({
    mode: "create",
    values,
    imagePaths: getVenueUseUploadedImagePathsFromFormData(formData),
    deletedImageIds: [],
  });
  if (!result.ok) return result;
  revalidateVenuePaths(values.venueId);
  redirect(`/fr/admin/salles/${values.venueId}/modifier?notice=use-created`);
}

export async function updateVenueUsePresentationAction(
  presentationId: string,
  previousState = getDefaultVenueUsePresentationFormState(),
  formData: FormData,
) {
  void previousState;
  const values = getVenueUsePresentationFormValues(formData);
  const result = await saveVenueUsePresentation({
    mode: "update",
    presentationId,
    values,
    imagePaths: getVenueUseUploadedImagePathsFromFormData(formData),
    deletedImageIds: deletedImageIds(formData),
  });
  if (!result.ok) return result;
  revalidateVenuePaths(values.venueId);
  redirect(`/fr/admin/salles/${values.venueId}/modifier?notice=use-updated`);
}

export async function deleteVenueUsePresentationAction(venueId: string, presentationId: string) {
  const result = await deleteVenueUsePresentation(presentationId);
  if (!result.ok) return result;
  revalidateVenuePaths(venueId);
  redirect(`/fr/admin/salles/${venueId}/modifier?notice=use-deleted`);
}

function deletedImageIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("deleted_image_ids")
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];
}

function revalidateVenuePaths(id?: string) {
  revalidatePath("/fr/salles");
  revalidatePath("/en/venues");
  revalidatePath("/fr/admin/salles");
  revalidatePath("/fr/admin/salles/configurations");
  revalidatePath("/fr/admin/salles/usages");
  if (id) revalidatePath(`/fr/admin/salles/${id}/modifier`);
}

export async function createVenueAction(previousState = getDefaultVenueFormState(), formData: FormData) {
  void previousState;
  const result = await saveVenue({
    mode: "create",
    values: getVenueFormValues(formData),
    imagePaths: getVenueUploadedImagePathsFromFormData(formData),
    deletedImageIds: [],
    setupIds: setupIds(formData),
  });
  if (!result.ok) return result;
  revalidateVenuePaths();
  redirect("/fr/admin/salles?notice=created");
}

export async function updateVenueAction(
  venueId: string,
  previousState = getDefaultVenueFormState(),
  formData: FormData,
) {
  void previousState;
  const result = await saveVenue({
    mode: "update",
    venueId,
    values: getVenueFormValues(formData),
    imagePaths: getVenueUploadedImagePathsFromFormData(formData),
    deletedImageIds: deletedImageIds(formData),
    setupIds: setupIds(formData),
  });
  if (!result.ok) return result;
  revalidateVenuePaths(venueId);
  redirect("/fr/admin/salles?notice=updated");
}

export async function deleteVenueAction(venueId: string) {
  const result = await deleteAdminVenue(venueId);
  if (!result.ok) return result;
  revalidateVenuePaths(venueId);
  redirect("/fr/admin/salles?deleted=1");
}

export async function toggleVenueAction(venueId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("venues").update({ is_active: nextActive }).eq("id", venueId);
  if (error) {
    console.error("[admin-venues] Toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier son état." };
  }
  revalidateVenuePaths(venueId);
  return { ok: true, message: nextActive ? "Salle activée avec succès." : "Salle désactivée avec succès." };
}

export async function toggleVenueImageAction(imageId: string, venueId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("venue_images").update({ is_active: nextActive }).eq("id", imageId);
  if (error) return { ok: false, message: "Impossible de modifier l'image." };
  revalidateVenuePaths(venueId);
  return { ok: true, message: nextActive ? "Image activée." : "Image désactivée." };
}

export async function setVenueCoverAction(imageId: string, venueId: string) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  await supabase.from("venue_images").update({ is_cover: false }).eq("venue_id", venueId).eq("is_cover", true);
  const { error } = await supabase.from("venue_images").update({ is_cover: true, is_active: true }).eq("id", imageId);
  if (error) return { ok: false, message: "Impossible de définir l'image de couverture." };
  revalidateVenuePaths(venueId);
  return { ok: true, message: "Image de couverture mise à jour." };
}

export async function createVenueSetupAction(previousState = getDefaultVenueSetupFormState(), formData: FormData) {
  void previousState;
  const result = await saveVenueSetup({ mode: "create", values: getVenueSetupFormValues(formData) });
  if (!result.ok) return result;
  revalidateVenuePaths();
  redirect("/fr/admin/salles/configurations?notice=created");
}

export async function updateVenueSetupAction(
  setupId: string,
  previousState = getDefaultVenueSetupFormState(),
  formData: FormData,
) {
  void previousState;
  const result = await saveVenueSetup({ mode: "update", setupId, values: getVenueSetupFormValues(formData) });
  if (!result.ok) return result;
  revalidateVenuePaths();
  redirect("/fr/admin/salles/configurations?notice=updated");
}

export async function toggleVenueSetupAction(setupId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("venue_setup_types").update({ is_active: nextActive }).eq("id", setupId);
  if (error) {
    console.error("[admin-venues] Setup toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier la configuration." };
  }
  revalidateVenuePaths();
  return { ok: true, message: nextActive ? "Configuration activée." : "Configuration désactivée." };
}
