import "server-only";

import type { AdminRestaurantGalleryImageFormState } from "@/lib/admin/restaurant/admin-restaurant-gallery-types";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUploadedStoragePath } from "@/lib/storage/validate-uploaded-storage-path";

const MAX_GALLERY_IMAGES = 30;
const MAX_IMAGES_PER_UPLOAD = 20;
const MAX_FEATURED_IMAGES = 5;

type ExistingGalleryImageRow = {
  id: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
};

function formError(
  message: string,
  fieldErrors: Record<string, string> = {},
): AdminRestaurantGalleryImageFormState {
  return {
    ok: false,
    message,
    fieldErrors,
  };
}

/* ============================================================
   Conversion URL publique -> chemin Storage
   ============================================================ */

function getRestaurantGalleryStoragePath(imagePath: string) {
  if (!imagePath) {
    return null;
  }

  /*
   * Support éventuel d'un chemin déjà relatif.
   */
  if (imagePath.startsWith("gallery/")) {
    return imagePath;
  }

  try {
    const url = new URL(imagePath);

    const marker = "/storage/v1/object/public/restaurant-gallery/";

    const markerIndex = url.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return null;
    }

    const path = url.pathname.slice(markerIndex + marker.length);

    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

/* ============================================================
   Nettoyage Storage en cas d'erreur
   ============================================================ */

async function cleanupUploadedGalleryImages(imagePaths: string[]) {
  const storagePaths = imagePaths
    .map(getRestaurantGalleryStoragePath)
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.storage
    .from("restaurant-gallery")
    .remove(storagePaths);

  if (error) {
    console.error("[admin-restaurant-gallery] Uploaded image cleanup failed:", {
      storagePaths,
      message: error.message,
    });
  }
}

/* ============================================================
   État initial
   ============================================================ */

export function getDefaultRestaurantGalleryImageFormState(): AdminRestaurantGalleryImageFormState {
  return {
    ok: false,
    message: "",
    fieldErrors: {},
  };
}

/* ============================================================
   Sauvegarde d'un lot d'images
   ============================================================ */

export async function saveRestaurantGalleryImages({
  imagePaths,
}: {
  imagePaths: string[];
}): Promise<AdminRestaurantGalleryImageFormState> {
  await requireAdmin("fr");

  /*
   * Nettoyage des doublons.
   */
  const uniqueImagePaths = [
    ...new Set(imagePaths.map((imagePath) => imagePath.trim()).filter(Boolean)),
  ];

  /*
   * Vérification des chemins envoyés.
   */
  const validatedImagePaths = uniqueImagePaths.filter((imagePath) =>
    validateUploadedStoragePath({
      value: imagePath,

      bucket: "restaurant-gallery",

      allowedPrefix: "gallery/",
    }),
  );

  if (uniqueImagePaths.length === 0) {
    return formError("Ajoutez au moins une image.", {
      imagePath: "Sélectionnez au moins une image.",
    });
  }

  if (uniqueImagePaths.length > MAX_IMAGES_PER_UPLOAD) {
    await cleanupUploadedGalleryImages(validatedImagePaths);

    return formError("Trop d'images ont été sélectionnées.", {
      imagePath: `Vous pouvez ajouter au maximum ${MAX_IMAGES_PER_UPLOAD} images à la fois.`,
    });
  }

  if (validatedImagePaths.length !== uniqueImagePaths.length) {
    await cleanupUploadedGalleryImages(validatedImagePaths);

    return formError("Une ou plusieurs images envoyées ne sont pas valides.", {
      imagePath: "Les images doivent provenir du bucket restaurant-gallery.",
    });
  }

  const supabaseClient = await createSupabaseServerClient();

  const supabase = supabaseClient.schema("site");

  /* =========================================================
     Images actuellement enregistrées
     ========================================================= */

  const { data: existingData, error: existingError } = await supabase
    .from("restaurant_gallery_images")
    .select("id,sort_order,is_featured,is_active")
    .order("sort_order", {
      ascending: true,
    });

  if (existingError) {
    console.error(
      "[admin-restaurant-gallery] Existing images load failed:",
      existingError.message,
    );

    await cleanupUploadedGalleryImages(validatedImagePaths);

    return formError("Impossible de préparer la galerie.");
  }

  const existingImages = (existingData ?? []) as ExistingGalleryImageRow[];

  /* =========================================================
     Limite globale de la galerie
     ========================================================= */

  if (existingImages.length + validatedImagePaths.length > MAX_GALLERY_IMAGES) {
    await cleanupUploadedGalleryImages(validatedImagePaths);

    const remainingSlots = Math.max(
      0,
      MAX_GALLERY_IMAGES - existingImages.length,
    );

    return formError("La galerie a atteint sa capacité maximale.", {
      imagePath:
        remainingSlots > 0
          ? `Vous pouvez encore ajouter ${remainingSlots} image${remainingSlots > 1 ? "s" : ""}.`
          : `La galerie contient déjà ${MAX_GALLERY_IMAGES} images.`,
    });
  }

  /* =========================================================
     Ordre automatique
     ========================================================= */

  const currentMaxSortOrder = existingImages.reduce(
    (maximum, image) => Math.max(maximum, image.sort_order),
    0,
  );

  /* =========================================================
     Mise en avant automatique
     ========================================================= */

  const currentFeaturedCount = existingImages.filter(
    (image) => image.is_active && image.is_featured,
  ).length;

  const availableFeaturedSlots = Math.max(
    0,
    MAX_FEATURED_IMAGES - currentFeaturedCount,
  );

  /* =========================================================
     Construction des lignes
     ========================================================= */

  const rows = validatedImagePaths.map((imagePath, index) => {
    const imageNumber = existingImages.length + index + 1;

    return {
      image_path: imagePath,

      /*
       * Génération automatique des ALT.
       */
      alt_fr: `Restaurant Le Privilège à La Résidence Ankerana - image ${imageNumber}`,

      alt_en: `Le Privilège Restaurant at La Résidence Ankerana - image ${imageNumber}`,

      /*
       * Ordre automatique :
       * 10, 20, 30...
       */
      sort_order: currentMaxSortOrder + (index + 1) * 10,

      /*
       * On remplit automatiquement
       * les 5 premières places mises en avant.
       */
      is_featured: index < availableFeaturedSlots,

      /*
       * Toute nouvelle photo est active.
       */
      is_active: true,
    };
  });

  /* =========================================================
     INSERT
     ========================================================= */

  const { error: insertError } = await supabase
    .from("restaurant_gallery_images")
    .insert(rows);

  if (insertError) {
    console.error(
      "[admin-restaurant-gallery] Batch insert failed:",
      insertError.message,
    );

    await cleanupUploadedGalleryImages(validatedImagePaths);

    return formError("Impossible d'ajouter les images à la galerie.");
  }

  return {
    ok: true,
    message: "",
    fieldErrors: {},
  };
}
