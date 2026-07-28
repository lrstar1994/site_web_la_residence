import "server-only";

import {
  emptyAccommodationFormValues,
  emptyFeatureFormValues,
  type AdminAccommodationFormState,
  type AdminAccommodationFormValues,
  type AdminFeatureFormState,
  type AdminFeatureFormValues,
} from "@/lib/admin/accommodations/admin-accommodation-types";
import { getAccommodationStoragePath } from "@/lib/admin/accommodations/get-accommodation-storage-path";
import { uploadAccommodationImage } from "@/lib/admin/accommodations/upload-accommodation-image";
import { generateAccommodationImageAlt } from "@/lib/admin/generate-image-alt";
import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_ACCOMMODATION_IMAGES = 15;

function value(formData: FormData, name: string) {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
}

function boolValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

function numberValue(raw: string) {
  const normalized = raw.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function intValue(raw: string) {
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getAccommodationFormValues(formData: FormData): AdminAccommodationFormValues {
  return {
    code: value(formData, "code"),
    nameFr: value(formData, "name_fr"),
    nameEn: value(formData, "name_en"),
    categoryFr: value(formData, "category_fr"),
    categoryEn: value(formData, "category_en"),
    shortDescriptionFr: value(formData, "short_description_fr"),
    shortDescriptionEn: value(formData, "short_description_en"),
    capacity: value(formData, "capacity"),
    surfaceM2: value(formData, "surface_m2"),
    priceFrom: value(formData, "price_from"),
    sortOrder: value(formData, "sort_order"),
    isActive: boolValue(formData, "is_active"),
    coverImageValue: value(formData, "cover_image_value"),
    deletedImageIds: [],
  };
}

export function getFeatureFormValues(formData: FormData): AdminFeatureFormValues {
  return {
    groupId: value(formData, "group_id"),
    code: value(formData, "code"),
    nameFr: value(formData, "name_fr"),
    nameEn: value(formData, "name_en"),
    descriptionFr: value(formData, "description_fr"),
    descriptionEn: value(formData, "description_en"),
    iconKey: value(formData, "icon_key"),
    sortOrder: value(formData, "sort_order"),
    isActive: boolValue(formData, "is_active"),
  };
}

export function getDefaultAccommodationFormState(): AdminAccommodationFormState {
  return { ok: false, message: "", fieldErrors: {}, values: emptyAccommodationFormValues };
}

export function getDefaultFeatureFormState(): AdminFeatureFormState {
  return { ok: false, message: "", fieldErrors: {}, values: emptyFeatureFormValues };
}

function validateAccommodation(values: AdminAccommodationFormValues) {
  const errors: Record<string, string> = {};
  const capacity = intValue(values.capacity);
  const surface = values.surfaceM2 ? numberValue(values.surfaceM2) : null;
  const price = numberValue(values.priceFrom);

  if (values.nameFr.length < 2) errors.nameFr = "Le nom francais est obligatoire.";
  if (values.nameEn.length < 2) errors.nameEn = "Le nom anglais est obligatoire.";
  if (!values.shortDescriptionFr) errors.shortDescriptionFr = "La description courte francaise est obligatoire.";
  if (!values.shortDescriptionEn) errors.shortDescriptionEn = "La description courte anglaise est obligatoire.";
  if (!capacity || capacity <= 0) errors.capacity = "La capacite doit etre superieure a zero.";
  if (values.surfaceM2 && (!surface || surface <= 0)) errors.surfaceM2 = "La surface doit etre superieure a zero.";
  if (price === null || price < 0) errors.priceFrom = "Le prix doit etre positif.";

  return { errors, capacity, surface, price };
}

function validateFeature(values: AdminFeatureFormValues) {
  const errors: Record<string, string> = {};

  if (!values.groupId) errors.groupId = "Choisissez un groupe.";
  if (values.nameFr.length < 2) errors.nameFr = "Le nom francais est obligatoire.";
  if (values.nameEn.length < 2) errors.nameEn = "Le nom anglais est obligatoire.";

  return { errors };
}

type ExistingAccommodationImage = {
  id: string;
  image_path: string;
  is_cover: boolean;
  is_active: boolean;
};

async function getCurrentAccommodation(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  accommodationId: string,
) {
  const { data, error } = await supabase
    .schema("site")
    .from("accommodations")
    .select("code")
    .eq("id", accommodationId)
    .maybeSingle();

  if (error) {
    console.error("[admin-accommodations] Current accommodation load failed:", error.message);
    return null;
  }

  return data as { code: string } | null;
}

export async function saveAccommodation({
  mode,
  accommodationId,
  values,
  imageFiles,
  deletedImageIds,
  featureIds,
}: {
  mode: "create" | "update";
  accommodationId?: string;
  values: AdminAccommodationFormValues;
  imageFiles: File[];
  deletedImageIds: string[];
  featureIds: string[];
}): Promise<AdminAccommodationFormState> {
  await requireAdmin("fr");
  const validation = validateAccommodation(values);
  const serverClient = await createSupabaseServerClient();
  const supabase = serverClient.schema("site");
  let code = values.code;
  let existingImages: ExistingAccommodationImage[] = [];
  const uniqueDeletedImageIds = [...new Set(deletedImageIds)];

  if (mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "accommodations", values.nameFr, "hebergement");
    } catch (error) {
      console.error("[admin-accommodations] Code generation failed:", error instanceof Error ? error.message : "Unknown error");
      return { ok: false, message: "Impossible d'enregistrer l'hebergement.", fieldErrors: {}, values };
    }
  } else if (accommodationId) {
    const currentAccommodation = await getCurrentAccommodation(serverClient, accommodationId);
    if (!currentAccommodation) {
      return { ok: false, message: "Hebergement introuvable.", fieldErrors: {}, values };
    }
    code = currentAccommodation.code;

    const { data: currentImages, error: currentImagesError } = await supabase
      .from("accommodation_images")
      .select("id,image_path,is_cover,is_active")
      .eq("accommodation_id", accommodationId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (currentImagesError) {
      console.error("[admin-accommodations] Current images load failed:", currentImagesError.message);
      return { ok: false, message: "Impossible d'enregistrer l'hebergement.", fieldErrors: {}, values };
    }

    existingImages = (currentImages ?? []) as ExistingAccommodationImage[];
  }

  const imagesToDelete =
    mode === "update" && uniqueDeletedImageIds.length > 0
      ? existingImages.filter((image) => uniqueDeletedImageIds.includes(image.id))
      : [];
  const deletedImageIdSet = new Set(imagesToDelete.map((image) => image.id));
  const remainingExistingImages = existingImages.filter((image) => !deletedImageIdSet.has(image.id));
  const remainingActiveExistingImages = remainingExistingImages.filter((image) => image.is_active);
  const existingActiveCount = existingImages.filter((image) => image.is_active).length;
  const deletedActiveCount = imagesToDelete.filter((image) => image.is_active).length;
  const totalImages = remainingExistingImages.length + imageFiles.length;
  const totalActiveImages = existingActiveCount - deletedActiveCount + imageFiles.length;

  if (totalImages > MAX_ACCOMMODATION_IMAGES) {
    validation.errors.imagePath = "Un hebergement peut contenir au maximum 15 images.";
  }

  if (values.isActive && totalActiveImages === 0) {
    validation.errors.imagePath = "Ajoutez au moins une image avant d'afficher cet hebergement sur le site.";
  }

  if (Object.keys(validation.errors).length > 0) {
    return { ok: false, message: "Certains champs doivent etre corriges.", fieldErrors: validation.errors, values };
  }

  const payload = {
    code,
    name_fr: values.nameFr,
    name_en: values.nameEn,
    short_description_fr: values.shortDescriptionFr,
    short_description_en: values.shortDescriptionEn,
    description_fr: values.shortDescriptionFr,
    description_en: values.shortDescriptionEn,
    category_fr: values.categoryFr || null,
    category_en: values.categoryEn || null,
    capacity: validation.capacity,
    surface_m2: validation.surface,
    price_from: validation.price,
    currency: "MGA",
    is_active: values.isActive,
  };

  const saveResult =
    mode === "create"
      ? await supabase.from("accommodations").insert(payload).select("id").single()
      : await supabase.from("accommodations").update(payload).eq("id", accommodationId).select("id").single();

  if (saveResult.error || !saveResult.data) {
    console.error("[admin-accommodations] Save failed:", saveResult.error?.message ?? "No row returned");
    return { ok: false, message: "Impossible d'enregistrer l'hebergement.", fieldErrors: {}, values };
  }

  const id = (saveResult.data as { id: string }).id;
  const generatedAlt = generateAccommodationImageAlt({ titleFr: values.nameFr, titleEn: values.nameEn });
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
    requestedPendingCoverIndex >= 0 && requestedPendingCoverIndex < imageFiles.length
      ? requestedPendingCoverIndex
      : !usableExistingCoverId && !hasActiveCover && imageFiles.length > 0
        ? 0
        : -1;
  const uploadedImageIds: string[] = [];

  if (usableExistingCoverId) {
    await supabase.from("accommodation_images").update({ is_cover: false }).eq("accommodation_id", id).eq("is_cover", true);
    const coverSave = await supabase
      .from("accommodation_images")
      .update({ is_cover: true, is_active: true })
      .eq("id", usableExistingCoverId)
      .eq("accommodation_id", id);

    if (coverSave.error) {
      return { ok: false, message: "Impossible de definir l'image de couverture.", fieldErrors: {}, values };
    }
  }

  if (pendingCoverIndex >= 0) {
    await supabase.from("accommodation_images").update({ is_cover: false }).eq("accommodation_id", id).eq("is_cover", true);
  }

  for (const [index, file] of imageFiles.entries()) {
    const upload = await uploadAccommodationImage(file, code);
    if (!upload.ok) return { ok: false, message: upload.message, fieldErrors: { imagePath: upload.message }, values };

    const imageNumber = remainingActiveExistingImages.length + index + 1;
    const imageSave = await supabase
      .from("accommodation_images")
      .insert({
        accommodation_id: id,
        image_path: upload.imagePath,
        alt_fr: `${generatedAlt.fr} - image ${imageNumber}`,
        alt_en: `${generatedAlt.en} - image ${imageNumber}`,
        is_cover: pendingCoverIndex === index,
        is_active: true,
      })
      .select("id")
      .single();

    if (imageSave.error) {
      console.error("[admin-accommodations] Image save failed:", imageSave.error.message);
      const { error: cleanupError } = await serverClient.storage.from("site-news").remove([upload.objectPath]);
      if (cleanupError) {
        console.error("[admin-accommodations] Uploaded image cleanup failed:", {
          accommodationId: id,
          path: upload.objectPath,
          message: cleanupError.message,
        });
      }
      return { ok: false, message: `L'hebergement est enregistre, mais l'image "${file.name}" n'a pas ete ajoutee.`, fieldErrors: {}, values };
    }

    uploadedImageIds.push((imageSave.data as { id: string }).id);
  }

  const remainingCoverExists =
    usableExistingCoverId !== "" ||
    pendingCoverIndex >= 0 ||
    remainingActiveExistingImages.some((image) => image.is_cover);

  if (totalActiveImages > 0 && !remainingCoverExists) {
    const fallbackCoverId = remainingActiveExistingImages[0]?.id ?? uploadedImageIds[0] ?? "";
    if (fallbackCoverId) {
      await supabase.from("accommodation_images").update({ is_cover: false }).eq("accommodation_id", id).eq("is_cover", true);
      const fallbackCover = await supabase
        .from("accommodation_images")
        .update({ is_cover: true, is_active: true })
        .eq("id", fallbackCoverId)
        .eq("accommodation_id", id);

      if (fallbackCover.error) {
        console.error("[admin-accommodations] Fallback cover save failed:", fallbackCover.error.message);
        return { ok: false, message: "Impossible de definir l'image de couverture.", fieldErrors: {}, values };
      }
    }
  }

  if (imagesToDelete.length > 0) {
    const storagePaths = imagesToDelete
      .map((image) => getAccommodationStoragePath(image.image_path))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await serverClient.storage.from("site-news").remove(storagePaths);

      if (storageError) {
        console.error("[admin-accommodations] Storage image deletion failed:", {
          accommodationId: id,
          imageIds: imagesToDelete.map((image) => image.id),
          paths: storagePaths,
          message: storageError.message,
        });
        return {
          ok: false,
          message: "L'hebergement a ete mis a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
          fieldErrors: {},
          values,
        };
      }
    }

    const deleteRows = await supabase
      .from("accommodation_images")
      .delete()
      .eq("accommodation_id", id)
      .in("id", imagesToDelete.map((image) => image.id));

    if (deleteRows.error) {
      console.error("[admin-accommodations] Image row deletion failed:", {
        accommodationId: id,
        imageIds: imagesToDelete.map((image) => image.id),
        message: deleteRows.error.message,
      });
      return {
        ok: false,
        message: "L'hebergement a ete mis a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
        fieldErrors: {},
        values,
      };
    }
  }

  await supabase.from("accommodation_feature_links").update({ is_active: false }).eq("accommodation_id", id);

  if (featureIds.length > 0) {
    const linkRows = featureIds.map((featureId, index) => ({
      accommodation_id: id,
      feature_id: featureId,
      sort_order: (index + 1) * 10,
      is_active: true,
      custom_label_fr: null,
      custom_label_en: null,
    }));
    const linkSave = await supabase.from("accommodation_feature_links").upsert(linkRows, {
      onConflict: "accommodation_id,feature_id",
    });

    if (linkSave.error) {
      console.error("[admin-accommodations] Feature link save failed:", linkSave.error.message);
      return { ok: false, message: "L'hebergement est enregistre, mais les caracteristiques n'ont pas ete mises a jour.", fieldErrors: {}, values };
    }
  }

  return { ok: true, message: "", fieldErrors: {}, values };
}

export async function saveAccommodationFeature({
  mode,
  featureId,
  values,
}: {
  mode: "create" | "update";
  featureId?: string;
  values: AdminFeatureFormValues;
}): Promise<AdminFeatureFormState> {
  await requireAdmin("fr");

  const validation = validateFeature(values);
  if (Object.keys(validation.errors).length > 0) {
    return { ok: false, message: "Certains champs doivent etre corriges.", fieldErrors: validation.errors, values };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");
  let code = values.code;

  if (mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "accommodation_features", values.nameFr, "caracteristique");
    } catch (error) {
      console.error("[admin-accommodations] Feature code generation failed:", error instanceof Error ? error.message : "Unknown error");
      return { ok: false, message: "Impossible d'enregistrer la caracteristique.", fieldErrors: {}, values };
    }
  } else if (featureId) {
    const { data, error } = await supabase.from("accommodation_features").select("code").eq("id", featureId).maybeSingle();
    if (error || !data) {
      console.error("[admin-accommodations] Current feature load failed:", error?.message ?? "Missing row");
      return { ok: false, message: "Caracteristique introuvable.", fieldErrors: {}, values };
    }
    code = data.code;
  }

  const payload = {
    group_id: values.groupId,
    code,
    name_fr: values.nameFr,
    name_en: values.nameEn,
    description_fr: null,
    description_en: null,
    icon_key: values.iconKey || null,
    is_active: values.isActive,
  };
  const result =
    mode === "create"
      ? await supabase.from("accommodation_features").insert(payload)
      : await supabase.from("accommodation_features").update(payload).eq("id", featureId);

  if (result.error) {
    console.error("[admin-accommodations] Feature save failed:", result.error.message);
    return { ok: false, message: "Impossible d'enregistrer la caracteristique.", fieldErrors: {}, values };
  }

  return { ok: true, message: "", fieldErrors: {}, values };
}
