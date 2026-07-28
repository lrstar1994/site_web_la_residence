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
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(
    now.getUTCHours(),
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
}

export function getAccommodationImageFilesFromFormData(formData: FormData) {
  return formData
    .getAll("image_files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function uploadAccommodationImage(file: File, accommodationCode: string) {
  const validation = validateNewsImageFile(file);

  if (!validation.ok) {
    return { ok: false as const, message: validation.message };
  }

  const cleanCode = slugify(accommodationCode) || "hebergement";
  const cleanName = validation.normalizedName || slugify(file.name) || "image.jpg";
  const path = `accommodations/${cleanCode}/${timestamp()}-${crypto.randomUUID()}-${cleanName}`;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("[admin-accommodations] Image upload failed:", error.message);
    return { ok: false as const, message: "Impossible de téléverser l'image." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true as const, imagePath: data.publicUrl, objectPath: path };
}
