import "server-only";

import { getVenueUseStoragePath } from "@/lib/admin/venues/get-venue-use-storage-path";
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

type VenueUseImageRow = {
  id: string;
  venue_use_presentation_id: string;
  image_path: string;
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

  const { data: usePresentations, error: usePresentationsError } = await supabase
    .from("venue_use_presentations")
    .select("id")
    .eq("venue_id", venueId);

  if (usePresentationsError) {
    console.error("[admin-venue-delete] Use presentations load failed:", {
      venueId,
      message: usePresentationsError.message,
    });
    return { ok: false, message: "Impossible de charger les usages associes a cette salle." };
  }

  const usePresentationIds = ((usePresentations ?? []) as Array<{ id: string }>).map((use) => use.id);

  if (usePresentationIds.length > 0) {
    const { data: useImages, error: useImagesError } = await supabase
      .from("venue_use_images")
      .select("id,venue_use_presentation_id,image_path")
      .in("venue_use_presentation_id", usePresentationIds);

    if (useImagesError) {
      console.error("[admin-venue-delete] Use images load failed:", {
        venueId,
        presentationIds: usePresentationIds,
        message: useImagesError.message,
      });
      return { ok: false, message: "Impossible de charger les images des usages de cette salle." };
    }

    const useImageRows = (useImages ?? []) as VenueUseImageRow[];
    const useStoragePaths = [
      ...new Set(
        useImageRows
          .map((image) => getVenueUseStoragePath(image.image_path))
          .filter((path): path is string => Boolean(path)),
      ),
    ];

    if (useStoragePaths.length > 0) {
      const { error: storageError } = await supabaseClient.storage.from("site-news").remove(useStoragePaths);

      if (storageError) {
        console.error("[admin-venue-delete] Use storage deletion failed:", {
          venueId,
          presentationIds: usePresentationIds,
          imageIds: useImageRows.map((image) => image.id),
          paths: useStoragePaths,
          message: storageError.message,
        });
        return { ok: false, message: "Impossible de supprimer les fichiers des usages associes a cette salle." };
      }
    }

    if (useImageRows.length > 0) {
      const { error: deleteUseImagesError } = await supabase
        .from("venue_use_images")
        .delete()
        .in("venue_use_presentation_id", usePresentationIds);

      if (deleteUseImagesError) {
        console.error("[admin-venue-delete] Use image row deletion failed:", {
          venueId,
          presentationIds: usePresentationIds,
          message: deleteUseImagesError.message,
        });
        return {
          ok: false,
          message: "Les fichiers des usages ont ete supprimes, mais leurs references images n'ont pas pu etre supprimees.",
        };
      }
    }

    const { error: deletePresentationsError } = await supabase
      .from("venue_use_presentations")
      .delete()
      .eq("venue_id", venueId)
      .in("id", usePresentationIds);

    if (deletePresentationsError) {
      console.error("[admin-venue-delete] Use presentation deletion failed:", {
        venueId,
        presentationIds: usePresentationIds,
        message: deletePresentationsError.message,
      });
      return { ok: false, message: "Les images des usages ont ete supprimees, mais les usages n'ont pas pu etre supprimes." };
    }
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
