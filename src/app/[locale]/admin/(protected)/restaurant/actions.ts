"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getDefaultRestaurantCategoryFormState,
  getDefaultRestaurantMenuFormState,
  getRestaurantCategoryFormValues,
  getRestaurantMenuFormValues,
  saveRestaurantCategory,
  saveRestaurantMenu,
} from "@/lib/admin/restaurant/save-admin-restaurant";
import { deleteAdminRestaurantMenu } from "@/lib/admin/restaurant/delete-admin-restaurant";
import { getRestaurantMenuUploadedImagePathsFromFormData } from "@/lib/admin/restaurant/upload-restaurant-menu-image";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function revalidateRestaurantPaths(id?: string) {
  revalidatePath("/fr/restaurant");
  revalidatePath("/en/restaurant");
  revalidatePath("/fr/admin/restaurant");
  revalidatePath("/fr/admin/restaurant/categories");
  if (id) revalidatePath(`/fr/admin/restaurant/${id}/modifier`);
}

function getDeletedRestaurantImageIds(formData: FormData) {
  return [
    ...new Set(
      formData
        .getAll("deleted_image_ids")
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];
}

export async function createRestaurantMenuAction(previousState = getDefaultRestaurantMenuFormState(), formData: FormData) {
  void previousState;
  const result = await saveRestaurantMenu({
    mode: "create",
    values: getRestaurantMenuFormValues(formData),
    imagePaths: getRestaurantMenuUploadedImagePathsFromFormData(formData),
    deletedImageIds: [],
  });
  if (!result.ok) return result;
  revalidateRestaurantPaths();
  redirect("/fr/admin/restaurant?notice=created");
}

export async function updateRestaurantMenuAction(menuId: string, previousState = getDefaultRestaurantMenuFormState(), formData: FormData) {
  void previousState;
  const result = await saveRestaurantMenu({
    mode: "update",
    menuId,
    values: getRestaurantMenuFormValues(formData),
    imagePaths: getRestaurantMenuUploadedImagePathsFromFormData(formData),
    deletedImageIds: getDeletedRestaurantImageIds(formData),
  });
  if (!result.ok) return result;
  revalidateRestaurantPaths(menuId);
  redirect("/fr/admin/restaurant?notice=updated");
}

export async function deleteRestaurantMenuAction(menuId: string) {
  const result = await deleteAdminRestaurantMenu(menuId);
  if (!result.ok) return result;
  revalidateRestaurantPaths(menuId);
  redirect("/fr/admin/restaurant?deleted=1");
}

export async function toggleRestaurantMenuAction(menuId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("restaurant_menus").update({ is_active: nextActive }).eq("id", menuId);
  if (error) {
    console.error("[admin-restaurant] Menu toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier son état." };
  }
  revalidateRestaurantPaths(menuId);
  return { ok: true, message: nextActive ? "Carte activée avec succès." : "Carte désactivée avec succès." };
}

export async function toggleRestaurantMenuImageAction(imageId: string, menuId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("restaurant_menu_images").update({ is_active: nextActive }).eq("id", imageId);
  if (error) return { ok: false, message: "Impossible de modifier l'image." };
  revalidateRestaurantPaths(menuId);
  return { ok: true, message: nextActive ? "Image activée." : "Image désactivée." };
}

export async function setRestaurantMenuCoverAction(imageId: string, menuId: string) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  await supabase.from("restaurant_menu_images").update({ is_cover: false }).eq("menu_id", menuId).eq("is_cover", true);
  const { error } = await supabase.from("restaurant_menu_images").update({ is_cover: true, is_active: true }).eq("id", imageId);
  if (error) return { ok: false, message: "Impossible de définir l'image de couverture." };
  revalidateRestaurantPaths(menuId);
  return { ok: true, message: "Image de couverture mise à jour." };
}

export async function createRestaurantCategoryAction(previousState = getDefaultRestaurantCategoryFormState(), formData: FormData) {
  void previousState;
  const result = await saveRestaurantCategory({ mode: "create", values: getRestaurantCategoryFormValues(formData) });
  if (!result.ok) return result;
  revalidateRestaurantPaths();
  redirect("/fr/admin/restaurant/categories?notice=created");
}

export async function updateRestaurantCategoryAction(categoryId: string, previousState = getDefaultRestaurantCategoryFormState(), formData: FormData) {
  void previousState;
  const result = await saveRestaurantCategory({ mode: "update", categoryId, values: getRestaurantCategoryFormValues(formData) });
  if (!result.ok) return result;
  revalidateRestaurantPaths();
  redirect("/fr/admin/restaurant/categories?notice=updated");
}

export async function toggleRestaurantCategoryAction(categoryId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("restaurant_menu_categories").update({ is_active: nextActive }).eq("id", categoryId);
  if (error) {
    console.error("[admin-restaurant] Category toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier la catégorie." };
  }
  revalidateRestaurantPaths();
  return { ok: true, message: nextActive ? "Catégorie activée." : "Catégorie désactivée." };
}
