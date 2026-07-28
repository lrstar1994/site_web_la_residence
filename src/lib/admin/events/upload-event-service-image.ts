import "server-only";

import {
  NEWS_IMAGE_BUCKET,
  validateNewsImageFile,
} from "@/lib/admin/news/news-image-validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeCode(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildObjectPath(code: string, fileName: string) {
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[-:T]/g, "");

  return `event-services/${normalizeCode(code) || "service"}/${timestamp}-${crypto.randomUUID()}-${fileName}`;
}

export function getEventServiceImageFileFromFormData(formData: FormData) {
  const file = formData.get("event_service_image");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

export async function uploadEventServiceImage(file: File, code: string) {
  await requireAdmin("fr");

  const validation = validateNewsImageFile(file);

  if (!validation.ok) {
    return validation;
  }

  const objectPath = buildObjectPath(code, validation.normalizedName);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(NEWS_IMAGE_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("[admin-events-storage] Upload failed:", {
      bucket: NEWS_IMAGE_BUCKET,
      path: objectPath,
      code: error.message,
    });

    return {
      ok: false as const,
      message: "Impossible de téléverser l'image.",
    };
  }

  const { data } = supabase.storage.from(NEWS_IMAGE_BUCKET).getPublicUrl(objectPath);

  return {
    ok: true as const,
    publicUrl: data.publicUrl,
    objectPath,
  };
}
