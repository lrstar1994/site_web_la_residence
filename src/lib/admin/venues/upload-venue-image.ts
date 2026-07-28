import "server-only";

import { validateNewsImageFile } from "@/lib/admin/news/news-image-validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BUCKET = "site-news";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
}

export function getVenueImageFileFromFormData(formData: FormData) {
  const value = formData.get("image_file");
  return value instanceof File && value.size > 0 ? value : null;
}

export function getVenueImageFilesFromFormData(formData: FormData) {
  return formData
    .getAll("image_files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function uploadVenueImage(file: File, venueCode: string) {
  const validation = validateNewsImageFile(file);
  if (!validation.ok) return { ok: false as const, message: validation.message };

  const path = `venues/${slugify(venueCode) || "salle"}/${timestamp()}-${validation.normalizedName}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[admin-venues] Image upload failed:", error.message);
    return { ok: false as const, message: "Impossible de téléverser l'image." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true as const, imagePath: data.publicUrl };
}
