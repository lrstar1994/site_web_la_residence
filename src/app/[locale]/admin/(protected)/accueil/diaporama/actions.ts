"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUploadedStoragePath } from "@/lib/storage/validate-uploaded-storage-path";

type ActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string; partial?: boolean };

type ImageValues = {
  altFr: string;
  altEn: string;
  isActive: boolean;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const storagePathPattern = /^home-hero\/[a-z0-9][a-z0-9._-]*\.webp$/;

function translate(locale: Locale, fr: string, en: string) {
  return locale === "fr" ? fr : en;
}

async function authorize(locale: Locale): Promise<ActionResult | null> {
  const admin = await getCurrentAdmin();

  if (!admin || admin.role !== "admin") {
    return {
      ok: false,
      message: translate(
        locale,
        "Cette action est réservée aux administrateurs.",
        "This action is restricted to administrators.",
      ),
    };
  }

  return null;
}

function validateValues(locale: Locale, values: ImageValues): ActionResult | null {
  if (values.isActive && (!values.altFr.trim() || !values.altEn.trim())) {
    return {
      ok: false,
      message: translate(
        locale,
        "Les textes alternatifs français et anglais sont obligatoires avant activation.",
        "French and English alternative texts are required before activation.",
      ),
    };
  }

  return null;
}

function validateStoragePath(value: string) {
  const path = validateUploadedStoragePath({
    value,
    bucket: "site-news",
    allowedPrefix: "home-hero",
  });

  return path && storagePathPattern.test(path) && !path.includes("..") ? path : null;
}

function revalidateHomeHero(locale: Locale) {
  revalidatePath("/fr");
  revalidatePath("/en");
  revalidatePath(`/${locale}/admin/accueil/diaporama`);
}

export async function createHomeHeroImageAction(
  locale: Locale,
  input: ImageValues & { storagePath: string },
): Promise<ActionResult> {
  const authorization = await authorize(locale);
  if (authorization) return authorization;

  const valuesError = validateValues(locale, input);
  if (valuesError) return valuesError;

  const storagePath = validateStoragePath(input.storagePath);
  if (!storagePath) {
    return {
      ok: false,
      message: translate(locale, "Le chemin de l’image est invalide.", "The image path is invalid."),
    };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.schema("site").from("home_hero_images").insert({
    image_path: storagePath,
    alt_fr: input.altFr.trim() || null,
    alt_en: input.altEn.trim() || null,
    sort_order: 0,
    is_active: input.isActive,
  });

  if (error) {
    console.error("[admin-home-hero] Image creation failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      ok: false,
      message:
        error.code === "23514"
          ? translate(locale, "Le diaporama contient déjà six images.", "The slideshow already contains six images.")
          : translate(locale, "Impossible d’enregistrer l’image.", "Unable to save the image."),
    };
  }

  revalidateHomeHero(locale);
  return {
    ok: true,
    message: translate(locale, "Image ajoutée avec succès.", "Image added successfully."),
  };
}

export async function updateHomeHeroImageAction(
  locale: Locale,
  imageId: string,
  values: ImageValues,
): Promise<ActionResult> {
  const authorization = await authorize(locale);
  if (authorization) return authorization;

  if (!uuidPattern.test(imageId)) {
    return { ok: false, message: translate(locale, "Image invalide.", "Invalid image.") };
  }

  const valuesError = validateValues(locale, values);
  if (valuesError) return valuesError;

  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .schema("site")
    .from("home_hero_images")
    .update({
      alt_fr: values.altFr.trim() || null,
      alt_en: values.altEn.trim() || null,
      is_active: values.isActive,
    })
    .eq("id", imageId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("[admin-home-hero] Image update failed", {
      imageId,
      code: error?.code,
      message: error?.message,
    });
    return {
      ok: false,
      message: translate(locale, "Impossible d’enregistrer les modifications.", "Unable to save the changes."),
    };
  }

  revalidateHomeHero(locale);
  return {
    ok: true,
    message: translate(locale, "Image mise à jour.", "Image updated."),
  };
}

export async function reorderHomeHeroImagesAction(
  locale: Locale,
  orderedIds: string[],
): Promise<ActionResult> {
  const authorization = await authorize(locale);
  if (authorization) return authorization;

  if (
    orderedIds.length > 6 ||
    new Set(orderedIds).size !== orderedIds.length ||
    orderedIds.some((id) => !uuidPattern.test(id))
  ) {
    return {
      ok: false,
      message: translate(locale, "La liste des images est invalide.", "The image list is invalid."),
    };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client
    .schema("site")
    .rpc("reorder_home_hero_images", { ordered_ids: orderedIds });

  if (error) {
    console.error("[admin-home-hero] Image reorder failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return {
      ok: false,
      message: translate(locale, "Impossible d’enregistrer le nouvel ordre.", "Unable to save the new order."),
    };
  }

  revalidateHomeHero(locale);
  return {
    ok: true,
    message: translate(locale, "Ordre mis à jour.", "Order updated."),
  };
}

export async function deleteHomeHeroImageAction(
  locale: Locale,
  imageId: string,
): Promise<ActionResult> {
  const authorization = await authorize(locale);
  if (authorization) return authorization;

  if (!uuidPattern.test(imageId)) {
    return { ok: false, message: translate(locale, "Image invalide.", "Invalid image.") };
  }

  const client = await createSupabaseServerClient();
  const table = client.schema("site").from("home_hero_images");
  const { data: image, error: loadError } = await table
    .select("id,image_path")
    .eq("id", imageId)
    .maybeSingle();

  if (loadError) {
    console.error("[admin-home-hero] Unable to load image before deletion", loadError.message);
    return {
      ok: false,
      message: translate(locale, "Impossible de préparer la suppression.", "Unable to prepare deletion."),
    };
  }

  if (!image) {
    revalidateHomeHero(locale);
    return {
      ok: true,
      message: translate(locale, "L’image est déjà supprimée.", "The image has already been deleted."),
    };
  }

  const storagePath = validateStoragePath(String(image.image_path ?? ""));
  if (!storagePath) {
    return {
      ok: false,
      message: translate(locale, "Le chemin Storage de l’image est invalide.", "The image Storage path is invalid."),
    };
  }

  const { error: deactivateError } = await table
    .update({ is_active: false })
    .eq("id", imageId);

  if (deactivateError) {
    return {
      ok: false,
      message: translate(locale, "Impossible de sécuriser la suppression.", "Unable to secure the deletion."),
    };
  }

  const { error: storageError } = await client.storage
    .from("site-news")
    .remove([storagePath]);

  if (storageError) {
    console.error("[admin-home-hero] Storage deletion failed", {
      imageId,
      storagePath,
      message: storageError.message,
    });
    revalidateHomeHero(locale);
    return {
      ok: false,
      partial: true,
      message: translate(
        locale,
        "L’image a été désactivée, mais le fichier n’a pas pu être supprimé. Vous pouvez réessayer.",
        "The image was disabled, but the file could not be deleted. You can try again.",
      ),
    };
  }

  const { error: deleteError } = await table.delete().eq("id", imageId);

  if (deleteError) {
    console.error("[admin-home-hero] Row deletion failed after Storage deletion", {
      imageId,
      message: deleteError.message,
    });
    revalidateHomeHero(locale);
    return {
      ok: false,
      partial: true,
      message: translate(
        locale,
        "Le fichier a été supprimé, mais la ligne reste inactive. Relancez la suppression.",
        "The file was deleted, but the row remains inactive. Run the deletion again.",
      ),
    };
  }

  revalidateHomeHero(locale);
  return {
    ok: true,
    message: translate(locale, "Image supprimée définitivement.", "Image permanently deleted."),
  };
}
