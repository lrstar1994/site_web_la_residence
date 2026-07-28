import "server-only";

import { validateNewsImageFile } from "@/lib/admin/news/news-image-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export function getRestaurantMenuImageFileFromFormData(formData: FormData) {
  const value = formData.get("image_file");
  return value instanceof File && value.size > 0 ? value : null;
}

export function getRestaurantMenuImageFilesFromFormData(formData: FormData) {
  return formData
    .getAll("image_files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function uploadRestaurantMenuImage(file: File, menuCode: string) {
  const validation = validateNewsImageFile(file);
  if (!validation.ok) return { ok: false as const, message: `Le fichier "${file.name}" n'est pas une image valide.` };
  const path = `restaurant-menus/${slugify(menuCode) || "carte"}/${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}-${validation.normalizedName}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from("site-news").upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: false });
  if (error) {
    console.error("[admin-restaurant] Image upload failed:", error.message);
    return { ok: false as const, message: "Impossible de téléverser l'image." };
  }
  const { data } = supabase.storage.from("site-news").getPublicUrl(path);
  return { ok: true as const, imagePath: data.publicUrl };
}
