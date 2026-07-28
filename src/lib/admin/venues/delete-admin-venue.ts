import "server-only";

import { getVenueStoragePath } from "@/lib/admin/venues/get-venue-storage-path";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteVenueResult = {
  ok: boolean;
  message: string;
};

type VenueImageRow = {
  id: string;
  venue_id: string;
  image_path: string;
  is_cover: boolean;
};

export async function deleteAdminVenue(venueId: string): Promise<DeleteVenueResult> {
  await requireAdmin("fr");

  if (!isValidUuid(venueId)) {
    return { ok: false, message: "Cette salle n'existe plus." };
  }

  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("id,code,name")
    .eq("id", venueId)
    .maybeSingle();

  if (venueError) {
    console.error("[admin-venue-delete] Venue load failed:", {
      venueId,
      message: venueError.message,
    });
    return { ok: false, message: "Impossible de supprimer cette salle." };
  }

  if (!venue) {
    return { ok: false, message: "Cette salle n'existe plus." };
  }

  const { data: images, error: imagesError } = await supabase
    .from("venue_images")
    .select("id,venue_id,image_path,is_cover")
    .eq("venue_id", venueId);

  if (imagesError) {
    console.error("[admin-venue-delete] Images load failed:", {
      venueId,
      message: imagesError.message,
    });
    return { ok: false, message: "Impossible de charger les images associees a cette salle." };
  }

  const imageRows = (images ?? []) as VenueImageRow[];
  const storagePaths = [
    ...new Set(
      imageRows
        .map((image) => getVenueStoragePath(image.image_path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabaseClient.storage.from("site-news").remove(storagePaths);

    if (storageError) {
      console.error("[admin-venue-delete] Storage deletion failed:", {
        venueId,
        imageIds: imageRows.map((image) => image.id),
        paths: storagePaths,
        message: storageError.message,
      });
      return { ok: false, message: "Impossible de supprimer les fichiers associes a cette salle." };
    }
  }

  if (imageRows.length > 0) {
    const { error: deleteImagesError } = await supabase
      .from("venue_images")
      .delete()
      .eq("venue_id", venueId)
      .in("id", imageRows.map((image) => image.id));

    if (deleteImagesError) {
      console.error("[admin-venue-delete] Image row deletion failed:", {
        venueId,
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

  const { error: deleteVenueError } = await supabase.from("venues").delete().eq("id", venueId);

  if (deleteVenueError) {
    console.error("[admin-venue-delete] Venue row deletion failed:", {
      venueId,
      imageIds: imageRows.map((image) => image.id),
      message: deleteVenueError.message,
    });
    return { ok: false, message: "Les images ont ete supprimees, mais la salle n'a pas pu etre supprimee." };
  }

  return { ok: true, message: "La salle a ete supprimee definitivement." };
}
