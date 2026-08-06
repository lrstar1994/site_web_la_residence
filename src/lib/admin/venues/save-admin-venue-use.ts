import "server-only";

import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import { generateVenueImageAlt } from "@/lib/admin/generate-image-alt";
import {
  emptyVenueUsePresentationFormValues,
  emptyVenueUseTypeFormValues,
  type AdminVenueUsePresentationFormState,
  type AdminVenueUsePresentationFormValues,
  type AdminVenueUseTypeFormState,
  type AdminVenueUseTypeFormValues,
} from "@/lib/admin/venues/admin-venue-types";
import { getVenueUseStoragePath } from "@/lib/admin/venues/get-venue-use-storage-path";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUploadedStoragePath } from "@/lib/storage/validate-uploaded-storage-path";

const MAX_VENUE_USE_IMAGES = 15;

function value(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
}

export function getVenueUseTypeFormValues(formData: FormData): AdminVenueUseTypeFormValues {
  return {
    code: value(formData, "code"),
    nameFr: value(formData, "name_fr"),
    nameEn: value(formData, "name_en"),
    sortOrder: value(formData, "sort_order"),
    isActive: formData.get("is_active") === "on",
  };
}

export function getVenueUsePresentationFormValues(formData: FormData): AdminVenueUsePresentationFormValues {
  return {
    venueId: value(formData, "venue_id"),
    useTypeId: value(formData, "use_type_id"),
    titleFr: value(formData, "title_fr"),
    titleEn: value(formData, "title_en"),
    descriptionFr: value(formData, "description_fr"),
    descriptionEn: value(formData, "description_en"),
    sortOrder: value(formData, "sort_order"),
    isActive: formData.get("is_active") === "on",
    coverImageValue: value(formData, "cover_image_value"),
  };
}

export function getDefaultVenueUseTypeFormState(): AdminVenueUseTypeFormState {
  return { ok: false, message: "", fieldErrors: {}, values: emptyVenueUseTypeFormValues };
}

export function getDefaultVenueUsePresentationFormState(): AdminVenueUsePresentationFormState {
  return { ok: false, message: "", fieldErrors: {}, values: emptyVenueUsePresentationFormValues };
}

function validateUseType(values: AdminVenueUseTypeFormValues) {
  const errors: Record<string, string> = {};
  if (values.nameFr.length < 2) errors.nameFr = "Le nom francais est obligatoire.";
  if (values.nameEn.length < 2) errors.nameEn = "Le nom anglais est obligatoire.";
  return errors;
}

function validatePresentation(values: AdminVenueUsePresentationFormValues) {
  const errors: Record<string, string> = {};
  if (!isValidUuid(values.venueId)) errors.venueId = "Salle invalide.";
  if (!isValidUuid(values.useTypeId)) errors.useTypeId = "Type d'usage invalide.";
  if (values.titleFr.length < 2) errors.titleFr = "Le titre francais est obligatoire.";
  if (values.titleEn.length < 2) errors.titleEn = "Le titre anglais est obligatoire.";
  if (!values.descriptionFr) errors.descriptionFr = "La description francaise est obligatoire.";
  if (!values.descriptionEn) errors.descriptionEn = "La description anglaise est obligatoire.";
  return errors;
}

type ExistingUseImage = {
  id: string;
  image_path: string;
  is_cover: boolean;
  is_active: boolean;
};

async function cleanupUploadedVenueUseImages(imagePaths: string[]) {
  const storagePaths = imagePaths
    .map((imagePath) => getVenueUseStoragePath(imagePath))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from("site-news").remove(storagePaths);

  if (error) {
    console.error("[admin-venue-uses] Uploaded image cleanup failed:", {
      paths: storagePaths,
      message: error.message,
    });
  }
}

export async function saveVenueUseType({
  mode,
  useTypeId,
  values,
}: {
  mode: "create" | "update";
  useTypeId?: string;
  values: AdminVenueUseTypeFormValues;
}): Promise<AdminVenueUseTypeFormState> {
  await requireAdmin("fr");
  const errors = validateUseType(values);
  if (Object.keys(errors).length) {
    return { ok: false, message: "Certains champs doivent etre corriges.", fieldErrors: errors, values };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");
  let code = values.code;

  if (mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "venue_use_types", values.nameFr, "usage");
    } catch (error) {
      console.error("[admin-venue-uses] Use type code generation failed:", error instanceof Error ? error.message : "Unknown error");
      return { ok: false, message: "Impossible d'enregistrer le type d'usage.", fieldErrors: {}, values };
    }
  } else if (useTypeId) {
    const { data, error } = await supabase.from("venue_use_types").select("code").eq("id", useTypeId).maybeSingle();
    if (error || !data) {
      console.error("[admin-venue-uses] Current use type load failed:", error?.message ?? "Missing row");
      return { ok: false, message: "Type d'usage introuvable.", fieldErrors: {}, values };
    }
    code = (data as { code: string }).code;
  }

  const payload = {
    code,
    name_fr: values.nameFr,
    name_en: values.nameEn,
    is_active: values.isActive,
  };

  const result =
    mode === "create"
      ? await supabase.from("venue_use_types").insert(payload)
      : await supabase.from("venue_use_types").update(payload).eq("id", useTypeId);

  if (result.error) {
    console.error("[admin-venue-uses] Use type save failed:", result.error.message);
    return { ok: false, message: "Impossible d'enregistrer le type d'usage.", fieldErrors: {}, values };
  }

  return { ok: true, message: "", fieldErrors: {}, values };
}

export async function saveVenueUsePresentation({
  mode,
  presentationId,
  values,
  imagePaths,
  deletedImageIds,
}: {
  mode: "create" | "update";
  presentationId?: string;
  values: AdminVenueUsePresentationFormValues;
  imagePaths: string[];
  deletedImageIds: string[];
}): Promise<AdminVenueUsePresentationFormState> {
  await requireAdmin("fr");
  const errors = validatePresentation(values);
  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");
  const uniqueDeletedImageIds = [...new Set(deletedImageIds)];
  let existingImages: ExistingUseImage[] = [];

  const uploadedImagePaths = [
    ...new Set(
      imagePaths.filter((imagePath) =>
        validateUploadedStoragePath({
          value: imagePath,
          bucket: "site-news",
          allowedPrefix: "venue-uses/",
        }),
      ),
    ),
  ];

  if (uploadedImagePaths.length !== imagePaths.length) {
    errors.imagePath = "Une image envoyee n'est pas valide.";
  }

  const { data: venue, error: venueError } = await supabase
    .from("venues")
    .select("id,name")
    .eq("id", values.venueId)
    .maybeSingle();

  if (venueError || !venue) {
    console.error("[admin-venue-uses] Venue load failed:", venueError?.message ?? "Missing row");
    await cleanupUploadedVenueUseImages(uploadedImagePaths);
    return { ok: false, message: "Salle introuvable.", fieldErrors: errors, values };
  }

  const { data: useType, error: useTypeError } = await supabase
    .from("venue_use_types")
    .select("id,code")
    .eq("id", values.useTypeId)
    .maybeSingle();

  if (useTypeError || !useType) {
    console.error("[admin-venue-uses] Use type load failed:", useTypeError?.message ?? "Missing row");
    await cleanupUploadedVenueUseImages(uploadedImagePaths);
    return { ok: false, message: "Type d'usage introuvable.", fieldErrors: errors, values };
  }

  if (mode === "update" && presentationId) {
    const { data: currentImages, error: currentImagesError } = await supabase
      .from("venue_use_images")
      .select("id,image_path,is_cover,is_active")
      .eq("venue_use_presentation_id", presentationId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (currentImagesError) {
      console.error("[admin-venue-uses] Current images load failed:", currentImagesError.message);
      await cleanupUploadedVenueUseImages(uploadedImagePaths);
      return { ok: false, message: "Impossible de charger les images de cet usage.", fieldErrors: {}, values };
    }

    existingImages = (currentImages ?? []) as ExistingUseImage[];
  }

  const imagesToDelete =
    mode === "update" && uniqueDeletedImageIds.length > 0
      ? existingImages.filter((image) => uniqueDeletedImageIds.includes(image.id))
      : [];
  const deletedImageIdSet = new Set(imagesToDelete.map((image) => image.id));
  const remainingExistingImages = existingImages.filter((image) => !deletedImageIdSet.has(image.id));
  const remainingActiveExistingImages = remainingExistingImages.filter((image) => image.is_active);
  const totalImages = remainingExistingImages.length + uploadedImagePaths.length;

  if (totalImages > MAX_VENUE_USE_IMAGES) {
    errors.imagePath = "Un usage peut contenir au maximum 15 images.";
  }

  if (Object.keys(errors).length) {
    await cleanupUploadedVenueUseImages(uploadedImagePaths);
    return { ok: false, message: "Certains champs doivent etre corriges.", fieldErrors: errors, values };
  }

  const payload = {
    venue_id: values.venueId,
    use_type_id: values.useTypeId,
    title_fr: values.titleFr,
    title_en: values.titleEn,
    description_fr: values.descriptionFr,
    description_en: values.descriptionEn,
    is_active: values.isActive,
  };

  const saved =
    mode === "create"
      ? await supabase.from("venue_use_presentations").insert(payload).select("id").single()
      : await supabase.from("venue_use_presentations").update(payload).eq("id", presentationId).eq("venue_id", values.venueId).select("id").single();

  if (saved.error || !saved.data) {
    console.error("[admin-venue-uses] Presentation save failed:", saved.error?.message ?? "No row returned");
    await cleanupUploadedVenueUseImages(uploadedImagePaths);
    return { ok: false, message: "Impossible d'enregistrer cet usage.", fieldErrors: {}, values };
  }

  const id = (saved.data as { id: string }).id;
  const generatedAlt = generateVenueImageAlt(`${(venue as { name: string }).name} ${values.titleFr}`);
  const requestedExistingCoverId = values.coverImageValue.startsWith("existing:")
    ? values.coverImageValue.replace("existing:", "")
    : "";
  const usableExistingCoverId =
    requestedExistingCoverId && remainingActiveExistingImages.some((image) => image.id === requestedExistingCoverId)
      ? requestedExistingCoverId
      : "";
  const requestedPendingCoverIndex = values.coverImageValue.startsWith("pending:")
    ? Number(values.coverImageValue.replace("pending:", ""))
    : -1;
  const hasActiveCover = remainingActiveExistingImages.some((image) => image.is_cover);
  const pendingCoverIndex =
    requestedPendingCoverIndex >= 0 && requestedPendingCoverIndex < uploadedImagePaths.length
      ? requestedPendingCoverIndex
      : !hasActiveCover && uploadedImagePaths.length > 0
        ? 0
        : -1;
  const uploadedImageIds: string[] = [];

  if (usableExistingCoverId) {
    await supabase.from("venue_use_images").update({ is_cover: false }).eq("venue_use_presentation_id", id).eq("is_cover", true);
    const coverSave = await supabase
      .from("venue_use_images")
      .update({ is_cover: true, is_active: true })
      .eq("id", usableExistingCoverId)
      .eq("venue_use_presentation_id", id);

    if (coverSave.error) {
      return { ok: false, message: "Impossible de definir l'image de couverture.", fieldErrors: {}, values };
    }
  }

  if (pendingCoverIndex >= 0) {
    await supabase.from("venue_use_images").update({ is_cover: false }).eq("venue_use_presentation_id", id).eq("is_cover", true);
  }

  for (const [index, imagePath] of uploadedImagePaths.entries()) {
    const imageNumber = remainingActiveExistingImages.length + index + 1;
    const imageSave = await supabase
      .from("venue_use_images")
      .insert({
        venue_use_presentation_id: id,
        image_path: imagePath,
        alt_fr: `${generatedAlt.fr} - image ${imageNumber}`,
        alt_en: `${generatedAlt.en} - image ${imageNumber}`,
        is_cover: pendingCoverIndex === index,
        is_active: true,
      })
      .select("id")
      .single();

    if (imageSave.error) {
      console.error("[admin-venue-uses] Image save failed:", imageSave.error.message);
      await cleanupUploadedVenueUseImages(uploadedImagePaths.slice(index));
      return { ok: false, message: "L'usage est enregistre, mais une image optimisee n'a pas ete ajoutee.", fieldErrors: {}, values };
    }
    uploadedImageIds.push((imageSave.data as { id: string }).id);
  }

  const remainingCoverExists =
    usableExistingCoverId !== "" ||
    pendingCoverIndex >= 0 ||
    remainingActiveExistingImages.some((image) => image.is_cover);

  if (totalImages > 0 && !remainingCoverExists) {
    const fallbackCoverId = remainingActiveExistingImages[0]?.id ?? uploadedImageIds[0] ?? "";
    if (fallbackCoverId) {
      await supabase.from("venue_use_images").update({ is_cover: false }).eq("venue_use_presentation_id", id).eq("is_cover", true);
      const fallbackCover = await supabase
        .from("venue_use_images")
        .update({ is_cover: true, is_active: true })
        .eq("id", fallbackCoverId)
        .eq("venue_use_presentation_id", id);

      if (fallbackCover.error) {
        console.error("[admin-venue-uses] Fallback cover save failed:", fallbackCover.error.message);
        return { ok: false, message: "Impossible de definir l'image de couverture.", fieldErrors: {}, values };
      }
    }
  }

  if (imagesToDelete.length > 0) {
    const storagePaths = imagesToDelete
      .map((image) => getVenueUseStoragePath(image.image_path))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseClient.storage.from("site-news").remove(storagePaths);

      if (storageError) {
        console.error("[admin-venue-uses] Storage image deletion failed:", {
          presentationId: id,
          imageIds: imagesToDelete.map((image) => image.id),
          paths: storagePaths,
          message: storageError.message,
        });
        return {
          ok: false,
          message: "L'usage a ete mis a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
          fieldErrors: {},
          values,
        };
      }
    }

    const deleteRows = await supabase
      .from("venue_use_images")
      .delete()
      .eq("venue_use_presentation_id", id)
      .in("id", imagesToDelete.map((image) => image.id));

    if (deleteRows.error) {
      console.error("[admin-venue-uses] Image row deletion failed:", {
        presentationId: id,
        imageIds: imagesToDelete.map((image) => image.id),
        message: deleteRows.error.message,
      });
      return {
        ok: false,
        message: "L'usage a ete mis a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
        fieldErrors: {},
        values,
      };
    }
  }

  return { ok: true, message: "", fieldErrors: {}, values };
}

export async function deleteVenueUsePresentation(presentationId: string) {
  await requireAdmin("fr");
  if (!isValidUuid(presentationId)) {
    return { ok: false, message: "Cet usage n'existe plus." };
  }

  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");
  const { data: images, error: imagesError } = await supabase
    .from("venue_use_images")
    .select("id,image_path")
    .eq("venue_use_presentation_id", presentationId);

  if (imagesError) {
    console.error("[admin-venue-uses] Delete images load failed:", {
      presentationId,
      message: imagesError.message,
    });
    return { ok: false, message: "Impossible de charger les images de cet usage." };
  }

  const imageRows = (images ?? []) as Array<{ id: string; image_path: string }>;
  const storagePaths = imageRows
    .map((image) => getVenueUseStoragePath(image.image_path))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length > 0) {
    const { error } = await supabaseClient.storage.from("site-news").remove(storagePaths);
    if (error) {
      console.error("[admin-venue-uses] Delete storage failed:", {
        presentationId,
        paths: storagePaths,
        message: error.message,
      });
      return { ok: false, message: "Impossible de supprimer les fichiers de cet usage." };
    }
  }

  if (imageRows.length > 0) {
    const { error } = await supabase.from("venue_use_images").delete().eq("venue_use_presentation_id", presentationId);
    if (error) {
      console.error("[admin-venue-uses] Delete image rows failed:", {
        presentationId,
        message: error.message,
      });
      return { ok: false, message: "Les fichiers ont ete supprimes, mais les references images n'ont pas pu etre supprimees." };
    }
  }

  const { error } = await supabase.from("venue_use_presentations").delete().eq("id", presentationId);
  if (error) {
    console.error("[admin-venue-uses] Delete presentation failed:", {
      presentationId,
      message: error.message,
    });
    return { ok: false, message: "Les images ont ete supprimees, mais l'usage n'a pas pu etre supprime." };
  }

  return { ok: true, message: "L'usage de la salle a ete supprime definitivement." };
}
