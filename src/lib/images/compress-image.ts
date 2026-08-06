"use client";

import imageCompression from "browser-image-compression";

const MAX_COMPRESSED_IMAGE_SIZE = 1024 * 1024;
const TARGET_IMAGE_SIZE_MB = 0.8;
const MAX_WIDTH_OR_HEIGHT = 1600;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type CompressImageOptions = {
  maxOriginalSizeMB?: number;
  maxOutputSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
};

export type CompressedImageResult = {
  file: File;
  originalSize: number;
  compressedSize: number;
};

function cleanFileName(name: string) {
  const baseName = name.replace(/\.[^.]+$/, "");
  const cleaned = baseName
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleaned || "image"}.webp`;
}

export function validateOriginalImage(file: File, options: CompressImageOptions = {}) {
  const maxOriginalSize = (options.maxOriginalSizeMB ?? 5) * 1024 * 1024;

  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return {
      ok: false as const,
      message: `Le fichier "${file.name}" n'est pas une image valide.`,
    };
  }

  if (file.size > maxOriginalSize) {
    return {
      ok: false as const,
      message: `L'image "${file.name}" dépasse 5 Mo.`,
    };
  }

  return { ok: true as const };
}

export function validateOriginalRestaurantImage(file: File) {
  return validateOriginalImage(file);
}

export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<CompressedImageResult> {
  const validation = validateOriginalImage(file, options);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const maxOutputSizeMB = options.maxOutputSizeMB ?? TARGET_IMAGE_SIZE_MB;
  const maxOutputSize = (options.maxOutputSizeMB ? options.maxOutputSizeMB : 1) * 1024 * 1024;

  const compressedBlob = await imageCompression(file, {
    maxSizeMB: maxOutputSizeMB,
    maxWidthOrHeight: options.maxWidthOrHeight ?? MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: options.quality ?? 0.82,
  });

  const compressedFile = new File([compressedBlob], cleanFileName(file.name), {
    type: "image/webp",
    lastModified: Date.now(),
  });

  if (compressedFile.size > Math.max(maxOutputSize, MAX_COMPRESSED_IMAGE_SIZE)) {
    throw new Error(`L'image "${file.name}" reste trop lourde apres optimisation.`);
  }

  return {
    file: compressedFile,
    originalSize: file.size,
    compressedSize: compressedFile.size,
  };
}

export async function compressRestaurantImage(file: File): Promise<CompressedImageResult> {
  return compressImage(file);
}

export function formatImageSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} Ko`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} Mo`;
}
