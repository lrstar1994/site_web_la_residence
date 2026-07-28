import "server-only";

const storagePrefix = "/storage/v1/object/public/site-news/";

export function getRestaurantStoragePath(imagePath: string) {
  if (!imagePath || imagePath.startsWith("/")) {
    return null;
  }

  if (!/^https?:\/\//i.test(imagePath)) {
    return imagePath.startsWith("restaurant-menus/")
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
    return path.startsWith("restaurant-menus/")
      ? decodeURIComponent(path)
      : null;
  } catch {
    return null;
  }
}
