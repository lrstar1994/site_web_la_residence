"use server";

import { revalidatePath } from "next/cache";
import type { Locale } from "@/lib/i18n/routing";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

type AddEventMomentImagesResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export async function addEventMomentImagesAction(
  locale: Locale,
  imageUrls: string[],
): Promise<AddEventMomentImagesResult> {
  try {
    await requireAdmin(locale);

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return {
        ok: false,
        message: "Aucune image à enregistrer.",
      };
    }

    const validUrls = imageUrls.filter(
      (value) => typeof value === "string" && value.trim().length > 0,
    );

    if (validUrls.length === 0) {
      return {
        ok: false,
        message: "Aucune image valide à enregistrer.",
      };
    }

    const supabase = (await getSupabaseServerClient()).schema("site");

    const { data: lastImage, error: orderError } = await supabase
      .from("event_moment_images")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (orderError) {
      console.error("[admin-event-moments] Unable to determine sort order", {
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
      });

      return {
        ok: false,
        message: "Impossible de préparer l’enregistrement des images.",
      };
    }

    let nextSortOrder =
      typeof lastImage?.sort_order === "number"
        ? lastImage.sort_order + 10
        : 10;

    const rows = validUrls.map((imageUrl) => {
      const row = {
        image_path: imageUrl,
        alt_fr: "",
        alt_en: "",
        sort_order: nextSortOrder,
        is_active: true,
      };

      nextSortOrder += 10;

      return row;
    });

    const { error } = await supabase.from("event_moment_images").insert(rows);

    if (error) {
      console.error("[admin-event-moments] Image insertion failed", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return {
        ok: false,
        message:
          "Les images ont été envoyées, mais leur enregistrement a échoué.",
      };
    }

    revalidatePath(`/${locale}/admin/evenements/galerie`);

    if (locale === "fr") {
      revalidatePath("/fr/evenements");
    } else {
      revalidatePath("/en/events");
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error(
      "[admin-event-moments] Unexpected insertion error",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      ok: false,
      message: "Une erreur inattendue est survenue pendant l’enregistrement.",
    };
  }
}

export async function deleteEventMomentImageAction(
  locale: Locale,
  imageId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await requireAdmin(locale);

    if (!imageId || typeof imageId !== "string") {
      return {
        ok: false,
        message: "Image invalide.",
      };
    }

    const serverClient = await getSupabaseServerClient();
    const supabase = serverClient.schema("site");

    const { data: image, error: loadError } = await supabase
      .from("event_moment_images")
      .select("id,image_path")
      .eq("id", imageId)
      .maybeSingle();

    if (loadError) {
      console.error(
        "[admin-event-moments] Unable to load image before deletion",
        {
          code: loadError.code,
          message: loadError.message,
          details: loadError.details,
          hint: loadError.hint,
        },
      );

      return {
        ok: false,
        message: "Impossible de charger l’image à supprimer.",
      };
    }

    if (!image) {
      return {
        ok: true,
      };
    }

    const imagePath =
      typeof image.image_path === "string" ? image.image_path : "";

    let storagePath: string | null = null;

    try {
      const url = new URL(imagePath);

      const marker = "/storage/v1/object/public/site-news/";

      const markerIndex = url.pathname.indexOf(marker);

      if (markerIndex >= 0) {
        storagePath = decodeURIComponent(
          url.pathname.slice(markerIndex + marker.length),
        );
      }
    } catch {
      if (imagePath.startsWith("event-moments/")) {
        storagePath = imagePath;
      }
    }

    if (storagePath && storagePath.startsWith("event-moments/")) {
      const { error: storageError } = await serverClient.storage
        .from("site-news")
        .remove([storagePath]);

      if (storageError) {
        console.error("[admin-event-moments] Storage deletion failed", {
          imageId,
          storagePath,
          message: storageError.message,
        });

        return {
          ok: false,
          message: "Le fichier n’a pas pu être supprimé du stockage.",
        };
      }
    }

    const { error: deleteError } = await supabase
      .from("event_moment_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      console.error("[admin-event-moments] Row deletion failed", {
        imageId,
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
      });

      return {
        ok: false,
        message:
          "L’image a été supprimée du stockage, mais son enregistrement n’a pas pu être supprimé.",
      };
    }

    revalidatePath(`/${locale}/admin/evenements/galerie`);

    if (locale === "fr") {
      revalidatePath("/fr/evenements");
    } else {
      revalidatePath("/en/events");
    }

    return {
      ok: true,
    };
  } catch (error) {
    console.error(
      "[admin-event-moments] Unexpected deletion error",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      ok: false,
      message: "Une erreur inattendue est survenue pendant la suppression.",
    };
  }
}