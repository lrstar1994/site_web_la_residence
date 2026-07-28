import "server-only";

const storagePrefix = "/storage/v1/object/public/site-news/";

export function getAccommodationStoragePath(imagePath: string) {
  if (!imagePath || imagePath.startsWith("/")) {
    return null;
  }

  if (!/^https?:\/\//i.test(imagePath)) {
    return imagePath.startsWith("accommodations/")
      ? decodeURIComponent(imagePath)
      : null;
  }

  try {
    const url = new URL(imagePath);
    const prefixIndex = url.pathname.indexOf(storagePrefix);

    if (prefixIndex === -1) {
      return null;
    }

    const path = url.pathname.slice(prefixIndex + storagePrefix.length);
    return path.startsWith("accommodations/")
      ? decodeURIComponent(path)
      : null;
  } catch {
    return null;
  }
}
