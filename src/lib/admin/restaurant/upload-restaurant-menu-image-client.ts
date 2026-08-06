"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { removeUploadedImages } from "@/lib/storage/remove-uploaded-images";
import { uploadOptimizedImage } from "@/lib/storage/upload-optimized-image";

const RESTAURANT_IMAGE_BUCKET = "site-news";

export async function uploadRestaurantMenuImageFromBrowser(file: File, folderHint?: string) {
  const upload = await uploadOptimizedImage({
    file,
    bucket: RESTAURANT_IMAGE_BUCKET,
    folder: `restaurant-menus/${folderHint || "carte"}`,
    supabaseClient: createSupabaseBrowserClient(),
    alreadyOptimized: true,
  });

  if (!upload.ok) {
    return {
      ok: false as const,
      message: upload.message,
      storagePath: upload.storagePath ?? "",
    };
  }

  return {
    ok: true as const,
    imagePath: upload.publicUrl,
    storagePath: upload.storagePath,
  };
}

export async function removeRestaurantMenuImagesFromBrowser(storagePaths: string[]) {
  await removeUploadedImages({
    supabaseClient: createSupabaseBrowserClient(),
    bucket: RESTAURANT_IMAGE_BUCKET,
    storagePaths,
  });
}
