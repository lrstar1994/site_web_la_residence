"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { compressImage, type CompressImageOptions } from "@/lib/images/compress-image";

type UploadOptimizedImageInput = {
  file: File;
  bucket: string;
  folder: string;
  supabaseClient: SupabaseClient;
  compressOptions?: CompressImageOptions;
  alreadyOptimized?: boolean;
};

export type UploadOptimizedImageResult =
  | {
      ok: true;
      storagePath: string;
      publicUrl: string;
      originalSize: number;
      optimizedSize: number;
      mimeType: string;
      file: File;
    }
  | {
      ok: false;
      message: string;
      storagePath?: string;
    };

function cleanSegment(value: string, fallback: string) {
  const cleaned = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

function timestamp() {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export async function uploadOptimizedImage({
  file,
  bucket,
  folder,
  supabaseClient,
  compressOptions,
  alreadyOptimized = false,
}: UploadOptimizedImageInput): Promise<UploadOptimizedImageResult> {
  try {
    const optimized = alreadyOptimized
      ? { file, originalSize: file.size, compressedSize: file.size }
      : await compressImage(file, compressOptions);

    const cleanFolder = folder
      .split("/")
      .filter(Boolean)
      .map((segment, index) => cleanSegment(segment, index === 0 ? "images" : "element"))
      .join("/");
    const fileName = cleanSegment(optimized.file.name.replace(/\.[^.]+$/, ""), "image");
    const storagePath = `${cleanFolder}/${timestamp()}-${crypto.randomUUID()}-${fileName}.webp`;

    const { error } = await supabaseClient.storage.from(bucket).upload(storagePath, optimized.file, {
      cacheControl: "31536000",
      contentType: optimized.file.type,
      upsert: false,
    });

    if (error) {
      return {
        ok: false,
        message: `Impossible d'envoyer l'image "${file.name}".`,
        storagePath,
      };
    }

    const { data } = supabaseClient.storage.from(bucket).getPublicUrl(storagePath);

    return {
      ok: true,
      storagePath,
      publicUrl: data.publicUrl,
      originalSize: optimized.originalSize,
      optimizedSize: optimized.compressedSize,
      mimeType: optimized.file.type,
      file: optimized.file,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Impossible d'optimiser l'image.",
    };
  }
}
