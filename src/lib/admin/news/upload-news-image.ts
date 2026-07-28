import "server-only";

import {
  NEWS_IMAGE_BUCKET,
  createNewsStorageObjectPath,
  validateNewsImageFile,
} from "@/lib/admin/news/news-image-validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type NewsImageUploadResult =
  | {
      ok: true;
      publicUrl: string;
      objectPath: string;
    }
  | {
      ok: false;
      message: string;
    };

export function getNewsImageFileFromFormData(formData: FormData) {
  const file = formData.get("news_image");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

export async function uploadNewsImage(
  file: File,
  articleCode: string,
): Promise<NewsImageUploadResult> {
  await requireAdmin("fr");

  const validation = validateNewsImageFile(file);

  if (!validation.ok) {
    return validation;
  }

  const objectPath = createNewsStorageObjectPath(articleCode, validation.normalizedName);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage
    .from(NEWS_IMAGE_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("[admin-news-storage] Upload failed:", {
      bucket: NEWS_IMAGE_BUCKET,
      path: objectPath,
      code: error.message,
    });

    return {
      ok: false,
      message:
        error.message === "The resource already exists"
          ? "Impossible de téléverser l'image."
          : "Impossible de téléverser l'image.",
    };
  }

  const { data } = supabase.storage.from(NEWS_IMAGE_BUCKET).getPublicUrl(objectPath);

  return {
    ok: true,
    publicUrl: data.publicUrl,
    objectPath,
  };
}
