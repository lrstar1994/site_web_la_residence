import "server-only";

import { generateRestaurantMenuImageAlt } from "@/lib/admin/generate-image-alt";
import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import {
  emptyRestaurantCategoryFormValues,
  emptyRestaurantMenuFormValues,
  type AdminRestaurantCategoryFormValues,
  type AdminRestaurantFormState,
  type AdminRestaurantMenuFormValues,
} from "@/lib/admin/restaurant/admin-restaurant-types";
import { getRestaurantStoragePath } from "@/lib/admin/restaurant/get-restaurant-storage-path";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_RESTAURANT_MENU_IMAGES = 15;

const value = (formData: FormData, name: string) => {
  const field = formData.get(name);
  return typeof field === "string" ? field.trim() : "";
};

export const getDefaultRestaurantMenuFormState = (): AdminRestaurantFormState<AdminRestaurantMenuFormValues> => ({
  ok: false,
  message: "",
  fieldErrors: {},
  values: emptyRestaurantMenuFormValues,
});

export const getDefaultRestaurantCategoryFormState = (): AdminRestaurantFormState<AdminRestaurantCategoryFormValues> => ({
  ok: false,
  message: "",
  fieldErrors: {},
  values: emptyRestaurantCategoryFormValues,
});

export function getRestaurantMenuFormValues(formData: FormData): AdminRestaurantMenuFormValues {
  return {
    code: value(formData, "code"),
    categoryId: value(formData, "category_id"),
    titleFr: value(formData, "title_fr"),
    titleEn: value(formData, "title_en"),
    shortDescriptionFr: value(formData, "short_description_fr"),
    shortDescriptionEn: value(formData, "short_description_en"),
    sortOrder: value(formData, "sort_order"),
    isActive: formData.get("is_active") === "on",
    coverImageValue: value(formData, "cover_image_value"),
    deletedImageIds: [],
  };
}

export function getRestaurantCategoryFormValues(formData: FormData): AdminRestaurantCategoryFormValues {
  return {
    code: value(formData, "code"),
    nameFr: value(formData, "name_fr"),
    nameEn: value(formData, "name_en"),
    descriptionFr: value(formData, "description_fr"),
    descriptionEn: value(formData, "description_en"),
    sortOrder: value(formData, "sort_order"),
    isActive: formData.get("is_active") === "on",
  };
}

type ExistingRestaurantImage = {
  id: string;
  image_path: string;
  is_cover: boolean;
  is_active: boolean;
};

async function cleanupUploadedRestaurantImages(imagePaths: string[]) {
  if (imagePaths.length === 0) return;

  const storagePaths = imagePaths
    .map((imagePath) => getRestaurantStoragePath(imagePath))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from("site-news").remove(storagePaths);

  if (error) {
    console.error("[admin-restaurant] Uploaded image cleanup failed:", {
      paths: storagePaths,
      message: error.message,
    });
  }
}

export async function saveRestaurantMenu({
  mode,
  menuId,
  values,
  imagePaths,
  deletedImageIds,
}: {
  mode: "create" | "update";
  menuId?: string;
  values: AdminRestaurantMenuFormValues;
  imagePaths: string[];
  deletedImageIds: string[];
}): Promise<AdminRestaurantFormState<AdminRestaurantMenuFormValues>> {
  await requireAdmin("fr");
  const errors: Record<string, string> = {};

  if (!values.categoryId) errors.categoryId = "Choisissez une categorie.";
  if (values.titleFr.length < 2) errors.titleFr = "Le titre francais est obligatoire.";
  if (values.titleEn.length < 2) errors.titleEn = "Le titre anglais est obligatoire.";
  if (!values.shortDescriptionFr) errors.shortDescriptionFr = "La description francaise est obligatoire.";
  if (!values.shortDescriptionEn) errors.shortDescriptionEn = "La description anglaise est obligatoire.";

  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");
  let code = values.code;
  let existingImages: ExistingRestaurantImage[] = [];
  const uniqueDeletedImageIds = [...new Set(deletedImageIds)];
  const uploadedImagePaths = [...new Set(imagePaths)].filter((imagePath) => getRestaurantStoragePath(imagePath));

  if (uploadedImagePaths.length !== imagePaths.length) {
    errors.imagePath = "Une image envoyée n'est pas valide.";
  }

  if (mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "restaurant_menus", values.titleFr, "carte");
    } catch (error) {
      console.error("[admin-restaurant] Menu code generation failed:", error instanceof Error ? error.message : "Unknown error");
      return { ok: false, message: "Impossible d'enregistrer la carte.", fieldErrors: {}, values };
    }
  } else if (menuId) {
    const { data: currentMenu, error: currentError } = await supabase
      .from("restaurant_menus")
      .select("code")
      .eq("id", menuId)
      .maybeSingle();

    if (currentError || !currentMenu) {
      console.error("[admin-restaurant] Current menu load failed:", currentError?.message ?? "Missing row");
      return { ok: false, message: "Carte introuvable.", fieldErrors: {}, values };
    }

    code = currentMenu.code;

    const { data: currentImages, error: currentImagesError } = await supabase
      .from("restaurant_menu_images")
      .select("id,image_path,is_cover,is_active")
      .eq("menu_id", menuId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (currentImagesError) {
      console.error("[admin-restaurant] Current images load failed:", currentImagesError.message);
      return { ok: false, message: "Impossible d'enregistrer la carte.", fieldErrors: {}, values };
    }

    existingImages = (currentImages ?? []) as ExistingRestaurantImage[];
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
  const totalImages = remainingExistingImages.length + uploadedImagePaths.length;
  const totalActiveImages = existingActiveCount - deletedActiveCount + uploadedImagePaths.length;

  if (totalImages > MAX_RESTAURANT_MENU_IMAGES) {
    errors.imagePath = "Une carte peut contenir au maximum 15 images.";
  }

  if (values.isActive && totalActiveImages === 0) {
    errors.imagePath = "Ajoutez au moins une image avant d'afficher cette carte sur le site.";
  }

  if (Object.keys(errors).length) {
    await cleanupUploadedRestaurantImages(uploadedImagePaths);
    return { ok: false, message: "Certains champs doivent etre corriges.", fieldErrors: errors, values };
  }

  const payload = {
    category_id: values.categoryId,
    code,
    title_fr: values.titleFr,
    title_en: values.titleEn,
    short_description_fr: values.shortDescriptionFr,
    short_description_en: values.shortDescriptionEn,
    is_active: values.isActive,
  };

  const saved =
    mode === "create"
      ? await supabase.from("restaurant_menus").insert(payload).select("id").single()
      : await supabase.from("restaurant_menus").update(payload).eq("id", menuId).select("id").single();

  if (saved.error || !saved.data) {
    await cleanupUploadedRestaurantImages(uploadedImagePaths);
    return { ok: false, message: "Impossible d'enregistrer la carte.", fieldErrors: {}, values };
  }

  const id = (saved.data as { id: string }).id;
  const generatedAlt = generateRestaurantMenuImageAlt({ titleFr: values.titleFr, titleEn: values.titleEn });
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
    await supabase.from("restaurant_menu_images").update({ is_cover: false }).eq("menu_id", id).eq("is_cover", true);
    const coverSave = await supabase
      .from("restaurant_menu_images")
      .update({ is_cover: true, is_active: true })
      .eq("id", usableExistingCoverId)
      .eq("menu_id", id);

    if (coverSave.error) {
      return { ok: false, message: "Impossible de definir l'image de couverture.", fieldErrors: {}, values };
    }
  }

  if (pendingCoverIndex >= 0) {
    await supabase.from("restaurant_menu_images").update({ is_cover: false }).eq("menu_id", id).eq("is_cover", true);
  }

  for (const [index, imagePath] of uploadedImagePaths.entries()) {
    const imageNumber = remainingActiveExistingImages.length + index + 1;
    const imageSave = await supabase
      .from("restaurant_menu_images")
      .insert({
        menu_id: id,
        image_path: imagePath,
        alt_fr: `${generatedAlt.fr} - image ${imageNumber}`,
        alt_en: `${generatedAlt.en} - image ${imageNumber}`,
        is_cover: pendingCoverIndex === index,
        is_active: true,
      })
      .select("id")
      .single();

    if (imageSave.error) {
      console.error("[admin-restaurant] Gallery image save failed:", imageSave.error.message);
      await cleanupUploadedRestaurantImages(uploadedImagePaths.slice(index));
      return {
        ok: false,
        message: "La carte est enregistree, mais une image optimisée n'a pas ete ajoutee.",
        fieldErrors: {},
        values,
      };
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
      await supabase.from("restaurant_menu_images").update({ is_cover: false }).eq("menu_id", id).eq("is_cover", true);
      const fallbackCover = await supabase
        .from("restaurant_menu_images")
        .update({ is_cover: true, is_active: true })
        .eq("id", fallbackCoverId)
        .eq("menu_id", id);

      if (fallbackCover.error) {
        console.error("[admin-restaurant] Fallback cover save failed:", fallbackCover.error.message);
        return { ok: false, message: "Impossible de definir l'image de couverture.", fieldErrors: {}, values };
      }
    }
  }

  if (imagesToDelete.length > 0) {
    const storagePaths = imagesToDelete
      .map((image) => getRestaurantStoragePath(image.image_path))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseClient.storage.from("site-news").remove(storagePaths);

      if (storageError) {
        console.error("[admin-restaurant] Storage image deletion failed:", {
          menuId: id,
          imageIds: imagesToDelete.map((image) => image.id),
          paths: storagePaths,
          message: storageError.message,
        });
        return {
          ok: false,
          message: "La carte a ete mise a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
          fieldErrors: {},
          values,
        };
      }
    }

    const deleteRows = await supabase
      .from("restaurant_menu_images")
      .delete()
      .eq("menu_id", id)
      .in("id", imagesToDelete.map((image) => image.id));

    if (deleteRows.error) {
      console.error("[admin-restaurant] Image row deletion failed:", {
        menuId: id,
        imageIds: imagesToDelete.map((image) => image.id),
        message: deleteRows.error.message,
      });
      return {
        ok: false,
        message: "La carte a ete mise a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
        fieldErrors: {},
        values,
      };
    }
  }

  return { ok: true, message: "", fieldErrors: {}, values };
}

export async function saveRestaurantCategory({
  mode,
  categoryId,
  values,
}: {
  mode: "create" | "update";
  categoryId?: string;
  values: AdminRestaurantCategoryFormValues;
}): Promise<AdminRestaurantFormState<AdminRestaurantCategoryFormValues>> {
  await requireAdmin("fr");
  const errors: Record<string, string> = {};

  if (values.nameFr.length < 2) errors.nameFr = "Le nom francais est obligatoire.";
  if (values.nameEn.length < 2) errors.nameEn = "Le nom anglais est obligatoire.";

  if (Object.keys(errors).length) {
    return { ok: false, message: "Certains champs doivent etre corriges.", fieldErrors: errors, values };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");
  let code = values.code;

  if (mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "restaurant_menu_categories", values.nameFr, "categorie");
    } catch (error) {
      console.error("[admin-restaurant] Category code generation failed:", error instanceof Error ? error.message : "Unknown error");
      return { ok: false, message: "Impossible d'enregistrer la categorie.", fieldErrors: {}, values };
    }
  } else if (categoryId) {
    const { data, error } = await supabase
      .from("restaurant_menu_categories")
      .select("code")
      .eq("id", categoryId)
      .maybeSingle();
    if (error || !data) {
      console.error("[admin-restaurant] Current category load failed:", error?.message ?? "Missing row");
      return { ok: false, message: "Categorie introuvable.", fieldErrors: {}, values };
    }
    code = data.code;
  }

  const payload = {
    code,
    name_fr: values.nameFr,
    name_en: values.nameEn,
    description_fr: null,
    description_en: null,
    is_active: values.isActive,
  };
  const result =
    mode === "create"
      ? await supabase.from("restaurant_menu_categories").insert(payload)
      : await supabase.from("restaurant_menu_categories").update(payload).eq("id", categoryId);

  if (result.error) return { ok: false, message: "Impossible d'enregistrer la categorie.", fieldErrors: {}, values };
  return { ok: true, message: "", fieldErrors: {}, values };
}
