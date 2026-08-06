const allowedExtensions = new Set([".webp"]);

type ValidateUploadedStoragePathInput = {
  value: string;
  bucket: string;
  allowedPrefix: string;
};

export function validateUploadedStoragePath({
  value,
  bucket,
  allowedPrefix,
}: ValidateUploadedStoragePathInput) {
  if (!value || value.includes("..") || value.startsWith("/") || /^blob:/i.test(value)) {
    return null;
  }

  const normalizedPrefix = allowedPrefix.endsWith("/") ? allowedPrefix : `${allowedPrefix}/`;
  const storagePrefix = `/storage/v1/object/public/${bucket}/`;
  let path = value;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      const prefixIndex = url.pathname.indexOf(storagePrefix);
      if (prefixIndex === -1) return null;
      path = url.pathname.slice(prefixIndex + storagePrefix.length);
    } catch {
      return null;
    }
  }

  const decodedPath = decodeURIComponent(path);
  const lowerPath = decodedPath.toLowerCase();
  const extensionIndex = lowerPath.lastIndexOf(".");
  const extension = extensionIndex >= 0 ? lowerPath.slice(extensionIndex) : "";

  if (!decodedPath.startsWith(normalizedPrefix)) return null;
  if (!allowedExtensions.has(extension)) return null;
  if (decodedPath.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) return null;

  return decodedPath;
}
