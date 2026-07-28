import "server-only";

import { getAccommodationStoragePath } from "@/lib/admin/accommodations/get-accommodation-storage-path";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteAccommodationResult = {
  ok: boolean;
  message: string;
};

type AccommodationImageRow = {
  id: string;
  accommodation_id: string;
  image_path: string;
  is_cover: boolean;
};

export async function deleteAdminAccommodation(accommodationId: string): Promise<DeleteAccommodationResult> {
  await requireAdmin("fr");

  if (!isValidUuid(accommodationId)) {
    return { ok: false, message: "Cet hebergement n'existe plus." };
  }

  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");

  const { data: accommodation, error: accommodationError } = await supabase
    .from("accommodations")
    .select("id,code,name_fr")
    .eq("id", accommodationId)
    .maybeSingle();

  if (accommodationError) {
    console.error("[admin-accommodation-delete] Accommodation load failed:", {
      accommodationId,
      message: accommodationError.message,
    });
    return { ok: false, message: "Impossible de supprimer cet hebergement." };
  }

  if (!accommodation) {
    return { ok: false, message: "Cet hebergement n'existe plus." };
  }

  const { data: images, error: imagesError } = await supabase
    .from("accommodation_images")
    .select("id,accommodation_id,image_path,is_cover")
    .eq("accommodation_id", accommodationId);

  if (imagesError) {
    console.error("[admin-accommodation-delete] Images load failed:", {
      accommodationId,
      message: imagesError.message,
    });
    return { ok: false, message: "Impossible de charger les images associees a cet hebergement." };
  }

  const imageRows = (images ?? []) as AccommodationImageRow[];
  const storagePaths = [
    ...new Set(
      imageRows
        .map((image) => getAccommodationStoragePath(image.image_path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabaseClient.storage.from("site-news").remove(storagePaths);

    if (storageError) {
      console.error("[admin-accommodation-delete] Storage deletion failed:", {
        accommodationId,
        imageIds: imageRows.map((image) => image.id),
        paths: storagePaths,
        message: storageError.message,
      });
      return { ok: false, message: "Impossible de supprimer les fichiers associes a cet hebergement." };
    }
  }

  if (imageRows.length > 0) {
    const { error: deleteImagesError } = await supabase
      .from("accommodation_images")
      .delete()
      .eq("accommodation_id", accommodationId)
      .in("id", imageRows.map((image) => image.id));

    if (deleteImagesError) {
      console.error("[admin-accommodation-delete] Image row deletion failed:", {
        accommodationId,
        imageIds: imageRows.map((image) => image.id),
        paths: storagePaths,
        message: deleteImagesError.message,
      });
      return {
        ok: false,
        message: "Les fichiers ont ete supprimes, mais les references des images n'ont pas pu etre supprimees.",
      };
    }
  }

  const { error: deleteLinksError } = await supabase
    .from("accommodation_feature_links")
    .delete()
    .eq("accommodation_id", accommodationId);

  if (deleteLinksError) {
    console.error("[admin-accommodation-delete] Feature link deletion failed:", {
      accommodationId,
      message: deleteLinksError.message,
    });
    return { ok: false, message: "Les images ont ete supprimees, mais les caracteristiques liees n'ont pas pu etre supprimees." };
  }

  const { error: deleteAccommodationError } = await supabase.from("accommodations").delete().eq("id", accommodationId);

  if (deleteAccommodationError) {
    console.error("[admin-accommodation-delete] Accommodation row deletion failed:", {
      accommodationId,
      imageIds: imageRows.map((image) => image.id),
      message: deleteAccommodationError.message,
    });
    return { ok: false, message: "Les images ont ete supprimees, mais l'hebergement n'a pas pu etre supprime." };
  }

  return { ok: true, message: "L'hebergement a ete supprime definitivement." };
}
