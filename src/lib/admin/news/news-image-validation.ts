export const NEWS_IMAGE_BUCKET = "site-news";
export const NEWS_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const NEWS_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const NEWS_IMAGE_ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export type NewsImageFileLike = {
  name: string;
  size: number;
  type: string;
};

export type NewsImageValidationResult =
  | {
      ok: true;
      normalizedName: string;
    }
  | {
      ok: false;
      message: string;
    };

function removeAccents(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function getExtension(name: string) {
  const lowerName = name.toLowerCase();
  const lastDot = lowerName.lastIndexOf(".");

  if (lastDot <= 0 || lastDot === lowerName.length - 1) {
    return "";
  }

  return lowerName.slice(lastDot);
}

export function normalizeNewsImageFileName(name: string) {
  const extension = getExtension(name);
  const baseName = extension ? name.slice(0, -extension.length) : name;
  const normalizedBase = removeAccents(baseName)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${normalizedBase || "image"}${extension}`;
}

export function validateNewsImageFile(file: NewsImageFileLike): NewsImageValidationResult {
  const extension = getExtension(file.name);
  const normalizedName = normalizeNewsImageFileName(file.name);

  if (!file.name || !extension) {
    return {
      ok: false,
      message: "Le fichier sélectionné n'est pas une image valide.",
    };
  }

  if (!(NEWS_IMAGE_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)) {
    return {
      ok: false,
      message: "Le format de l'image n'est pas autorisé.",
    };
  }

  if (!(NEWS_IMAGE_ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      message: "Le format de l'image n'est pas autorisé.",
    };
  }

  if (file.size > NEWS_IMAGE_MAX_SIZE) {
    return {
      ok: false,
      message: "L'image ne doit pas dépasser 5 Mo.",
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      message: "Le fichier sélectionné n'est pas une image valide.",
    };
  }

  return {
    ok: true,
    normalizedName,
  };
}

export function createNewsStorageObjectPath(articleCode: string, fileName: string) {
  const safeCode = removeAccents(articleCode)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const timestamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace(/[-:T]/g, "");

  return `articles/${safeCode || "article"}/${timestamp}-${fileName}`;
}

export function isUsableNewsImagePath(value: string) {
  if (!value) {
    return false;
  }

  if (/^javascript:/i.test(value) || /<[^>]+>/.test(value)) {
    return false;
  }

  return value.startsWith("/") || value.startsWith("https://");
}
