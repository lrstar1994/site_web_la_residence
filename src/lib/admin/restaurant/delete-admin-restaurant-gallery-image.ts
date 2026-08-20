import "server-only";

import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type GalleryImageRow = {
  id: string;
  image_path: string;
};

type RemainingGalleryImageRow = {
  id: string;
  sort_order: number;
  created_at: string;
};

/* ============================================================
   EXTRACTION DU CHEMIN STORAGE
   ============================================================ */

function getRestaurantGalleryStoragePath(imagePath: string) {
  if (!imagePath) {
    return null;
  }

  /*
   * Cas où le chemin serait déjà relatif.
   */
  if (imagePath.startsWith("gallery/")) {
    return imagePath;
  }

  try {
    const url = new URL(imagePath);

    const marker = "/storage/v1/object/public/restaurant-gallery/";

    const index = url.pathname.indexOf(marker);

    if (index === -1) {
      return null;
    }

    const path = url.pathname.slice(index + marker.length);

    if (!path) {
      return null;
    }

    return decodeURIComponent(path);
  } catch {
    return null;
  }
}

/* ============================================================
   NORMALISATION DES 5 PHOTOS MISES EN AVANT
   ============================================================ */

async function normalizeFeaturedImages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  const site = supabase.schema("site");

  /*
   * Charge les images actives restantes.
   */
  const { data, error } = await site
    .from("restaurant_gallery_images")
    .select("id,sort_order,created_at")
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error(
      "[admin-restaurant-gallery] Featured normalization load failed:",
      error.message,
    );

    return false;
  }

  const images = (data ?? []) as RemainingGalleryImageRow[];

  /*
   * On enlève d'abord toutes les mises en avant.
   */
  const reset = await site
    .from("restaurant_gallery_images")
    .update({
      is_featured: false,
    })
    .eq("is_featured", true);

  if (reset.error) {
    console.error(
      "[admin-restaurant-gallery] Featured reset failed:",
      reset.error.message,
    );

    return false;
  }

  /*
   * Puis on marque automatiquement
   * les 5 premières images.
   */
  const featuredIds = images.slice(0, 5).map((image) => image.id);

  if (featuredIds.length === 0) {
    return true;
  }

  const featured = await site
    .from("restaurant_gallery_images")
    .update({
      is_featured: true,
    })
    .in("id", featuredIds);

  if (featured.error) {
    console.error(
      "[admin-restaurant-gallery] Featured save failed:",
      featured.error.message,
    );

    return false;
  }

  return true;
}

/* ============================================================
   SUPPRESSION
   ============================================================ */

export async function deleteAdminRestaurantGalleryImage(imageId: string) {
  await requireAdmin("fr");

  if (!isValidUuid(imageId)) {
    return {
      ok: false as const,

      message: "Image introuvable.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const site = supabase.schema("site");

  /* =========================================================
     CHARGEMENT
     ========================================================= */

  const { data, error } = await site
    .from("restaurant_gallery_images")
    .select("id,image_path")
    .eq("id", imageId)
    .maybeSingle();

  if (error) {
    console.error(
      "[admin-restaurant-gallery] Image load before delete failed:",
      error.message,
    );

    return {
      ok: false as const,

      message: "Impossible de charger la photo.",
    };
  }

  if (!data) {
    return {
      ok: false as const,

      message: "Image introuvable.",
    };
  }

  const image = data as GalleryImageRow;

  /* =========================================================
     SUPPRESSION DU FICHIER STORAGE
     ========================================================= */

  const storagePath = getRestaurantGalleryStoragePath(image.image_path);

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("restaurant-gallery")
      .remove([storagePath]);

    if (storageError) {
      console.error("[admin-restaurant-gallery] Storage deletion failed:", {
        imageId,
        storagePath,
        message: storageError.message,
      });

      return {
        ok: false as const,

        message: "Impossible de supprimer le fichier de la photo.",
      };
    }
  }

  /* =========================================================
     SUPPRESSION DE LA LIGNE
     ========================================================= */

  const deleteRow = await site
    .from("restaurant_gallery_images")
    .delete()
    .eq("id", imageId);

  if (deleteRow.error) {
    console.error(
      "[admin-restaurant-gallery] Database deletion failed:",
      deleteRow.error.message,
    );

    return {
      ok: false as const,

      message:
        "Le fichier a été supprimé, mais la ligne n'a pas pu être retirée de la galerie.",
    };
  }

  /* =========================================================
     REMETTRE AUTOMATIQUEMENT LES 5 PREMIÈRES EN AVANT
     ========================================================= */

  const normalized = await normalizeFeaturedImages(supabase);

  if (!normalized) {
    console.error(
      "[admin-restaurant-gallery] Image deleted but featured images could not be normalized.",
    );
  }

  return {
    ok: true as const,

    message: "Photo supprimée avec succès.",
  };
}
