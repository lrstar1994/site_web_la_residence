import "server-only";

import {
  emptyAdminEventServiceFormValues,
  type AdminEventServiceFormState,
  type AdminEventServiceFormValues,
} from "@/lib/admin/events/admin-event-service-types";

import { getEventServiceStoragePath } from "@/lib/admin/events/get-event-service-storage-path";
import { generateEventServiceImageAlt } from "@/lib/admin/generate-image-alt";
import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import { isUsableNewsImagePath } from "@/lib/admin/news/news-image-validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUploadedStoragePath } from "@/lib/storage/validate-uploaded-storage-path";

type SaveInput = {
  mode: "create" | "update";
  serviceId?: string;
  values: AdminEventServiceFormValues;
  imagePaths: string[];
  deletedImageIds: string[];
};

type SaveResult = { ok: true } | AdminEventServiceFormState;

type CurrentEventServiceRow = {
  code: string;
  image_path: string;
  image_alt_fr: string;
  image_alt_en: string;
};

type ExistingEventServiceImage = {
  id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

const MAX_EVENT_SERVICE_IMAGES = 15;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;

const htmlPattern = /<[^>]+>/;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export function getEventServiceFormValues(
  formData: FormData,
): AdminEventServiceFormValues {
  return {
    code: getString(formData, "code"),

    titleFr: getString(formData, "title_fr"),

    titleEn: getString(formData, "title_en"),

    descriptionFr: getString(formData, "description_fr"),

    descriptionEn: getString(formData, "description_en"),

    imagePath: getString(formData, "image_path"),

    imageAltFr: getString(formData, "image_alt_fr"),

    imageAltEn: getString(formData, "image_alt_en"),

    sortOrder: getString(formData, "sort_order"),

    isActive: formData.get("is_active") === "on",

    coverImageValue: getString(formData, "cover_image_value"),

    deletedImageIds: [],
  };
}

export function getDefaultEventServiceFormState(): AdminEventServiceFormState {
  return {
    ok: false,

    message: "",

    fieldErrors: {},

    values: emptyAdminEventServiceFormValues,
  };
}

function formError(
  values: AdminEventServiceFormValues,

  message: string,

  fieldErrors: AdminEventServiceFormState["fieldErrors"] = {},
): AdminEventServiceFormState {
  return {
    ok: false,
    message,
    fieldErrors,
    values,
  };
}

function validateText(
  fieldErrors: AdminEventServiceFormState["fieldErrors"],

  key: keyof AdminEventServiceFormValues,

  value: string,

  label: string,

  options: {
    min?: number;
    max?: number;
    noHtml?: boolean;
    required?: boolean;
  },
) {
  if (options.required !== false && !value) {
    fieldErrors[key] = `${label} est obligatoire.`;

    return;
  }

  if (options.min && value.length > 0 && value.length < options.min) {
    fieldErrors[key] =
      `${label} doit contenir au moins ${options.min} caractères.`;

    return;
  }

  if (options.max && value.length > options.max) {
    fieldErrors[key] =
      `${label} doit contenir au maximum ${options.max} caractères.`;

    return;
  }

  if (options.noHtml && htmlPattern.test(value)) {
    fieldErrors[key] = `${label} ne doit pas contenir de HTML.`;
  }
}

/*
 * Validation uniquement des champs texte.
 *
 * IMPORTANT :
 * on ne valide PAS encore la présence
 * d'une image ici.
 *
 * Les images existantes doivent d'abord
 * être chargées depuis Supabase.
 */
function validateTextFields(values: AdminEventServiceFormValues) {
  const fieldErrors: AdminEventServiceFormState["fieldErrors"] = {};

  validateText(fieldErrors, "titleFr", values.titleFr, "Le titre français", {
    min: 3,
    max: 200,
    noHtml: true,
  });

  validateText(fieldErrors, "titleEn", values.titleEn, "Le titre anglais", {
    min: 3,
    max: 200,
    noHtml: true,
  });

  validateText(
    fieldErrors,
    "descriptionFr",
    values.descriptionFr,
    "La description française",
    {
      max: 2000,
      noHtml: true,
    },
  );

  validateText(
    fieldErrors,
    "descriptionEn",
    values.descriptionEn,
    "La description anglaise",
    {
      max: 2000,
      noHtml: true,
    },
  );

  validateText(
    fieldErrors,
    "imageAltFr",
    values.imageAltFr,
    "Le texte alternatif français",
    {
      max: 250,
      noHtml: true,
      required: false,
    },
  );

  validateText(
    fieldErrors,
    "imageAltEn",
    values.imageAltEn,
    "Le texte alternatif anglais",
    {
      max: 250,
      noHtml: true,
      required: false,
    },
  );

  /*
   * Si imagePath existe encore,
   * on vérifie simplement son format.
   *
   * S'il est vide en édition,
   * ce n'est PAS encore une erreur.
   */
  if (values.imagePath && !isUsableNewsImagePath(values.imagePath)) {
    fieldErrors.imagePath =
      "Le chemin de l'image doit être local ou une URL https valide.";
  }

  return fieldErrors;
}

async function loadCurrentService(serviceId: string) {
  const supabase = (await createSupabaseServerClient()).schema("site");

  const { data, error } = await supabase
    .from("event_services")
    .select("code,image_path,image_alt_fr,image_alt_en")
    .eq("id", serviceId)
    .maybeSingle();

  if (error) {
    console.error("[admin-events] Current service load failed:", error.message);

    return null;
  }

  return data as CurrentEventServiceRow | null;
}

async function cleanupUploadedEventImages(imagePaths: string[]) {
  const storagePaths = imagePaths
    .map((imagePath) => getEventServiceStoragePath(imagePath))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.storage
    .from("site-news")
    .remove(storagePaths);

  if (error) {
    console.error("[admin-events] Uploaded image cleanup failed:", {
      paths: storagePaths,

      message: error.message,
    });
  }
}

async function syncEventServiceCover({
  supabase,
  serviceId,
  fallbackAltFr,
  fallbackAltEn,
}: {
  supabase: ReturnType<
    Awaited<ReturnType<typeof createSupabaseServerClient>>["schema"]
  >;

  serviceId: string;

  fallbackAltFr: string;

  fallbackAltEn: string;
}) {
  const { data: imagesData, error: imagesError } = await supabase
    .from("event_service_images")
    .select("id,image_path,alt_fr,alt_en,is_cover,is_active,sort_order")
    .eq("event_service_id", serviceId)
    .eq("is_active", true)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (imagesError) {
    console.error(
      "[admin-events] Cover sync image load failed:",
      imagesError.message,
    );

    return false;
  }

  const images = (imagesData ?? []) as ExistingEventServiceImage[];

  if (images.length === 0) {
    const clear = await supabase
      .from("event_services")
      .update({
        image_path: "",

        image_alt_fr: fallbackAltFr,

        image_alt_en: fallbackAltEn,
      })
      .eq("id", serviceId);

    if (clear.error) {
      console.error(
        "[admin-events] Cover sync clear failed:",
        clear.error.message,
      );

      return false;
    }

    return true;
  }

  const cover = images.find((image) => image.is_cover) ?? images[0];

  const clearCovers = await supabase
    .from("event_service_images")
    .update({
      is_cover: false,
    })
    .eq("event_service_id", serviceId)
    .eq("is_cover", true);

  if (clearCovers.error) {
    console.error(
      "[admin-events] Cover reset failed:",
      clearCovers.error.message,
    );

    return false;
  }

  const coverSave = await supabase
    .from("event_service_images")
    .update({
      is_cover: true,

      is_active: true,
    })
    .eq("id", cover.id)
    .eq("event_service_id", serviceId);

  if (coverSave.error) {
    console.error(
      "[admin-events] Cover sync save failed:",
      coverSave.error.message,
    );

    return false;
  }

  const mainSave = await supabase
    .from("event_services")
    .update({
      image_path: cover.image_path,

      image_alt_fr: cover.alt_fr || fallbackAltFr,

      image_alt_en: cover.alt_en || fallbackAltEn,
    })
    .eq("id", serviceId);

  if (mainSave.error) {
    console.error(
      "[admin-events] Main image sync failed:",
      mainSave.error.message,
    );

    return false;
  }

  return true;
}

export async function saveEventService(input: SaveInput): Promise<SaveResult> {
  const values = input.values;

  /*
   * Validation des URLs fraîchement uploadées.
   */
  const uploadedImagePaths = [
    ...new Set(
      input.imagePaths.filter((imagePath) =>
        validateUploadedStoragePath({
          value: imagePath,

          bucket: "site-news",

          allowedPrefix: "event-services/",
        }),
      ),
    ),
  ];

  const fieldErrors = validateTextFields(values);

  if (uploadedImagePaths.length !== input.imagePaths.length) {
    fieldErrors.imagePath = "Une image envoyée n'est pas valide.";
  }

  /*
   * Validation UUID.
   */
  if (
    input.mode === "update" &&
    (!input.serviceId || !uuidPattern.test(input.serviceId))
  ) {
    fieldErrors.titleFr = "Prestation introuvable.";
  }

  await requireAdmin("fr");

  const supabaseClient = await createSupabaseServerClient();

  const supabase = supabaseClient.schema("site");

  /*
   * Chargement de la prestation existante.
   */
  const currentService =
    input.mode === "update" && input.serviceId
      ? await loadCurrentService(input.serviceId)
      : null;

  if (input.mode === "update" && !currentService) {
    await cleanupUploadedEventImages(uploadedImagePaths);

    return formError(values, "Prestation introuvable.");
  }

  /*
   * Code immutable en édition.
   */
  let code = currentService?.code ?? values.code;

  if (input.mode === "create") {
    try {
      code = await generateUniqueCode(
        supabase,
        "event_services",
        values.titleFr,
        "prestation",
      );
    } catch (error) {
      console.error(
        "[admin-events] Code generation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      await cleanupUploadedEventImages(uploadedImagePaths);

      return formError(values, "Impossible d'enregistrer la prestation.");
    }
  }

  /*
   * Chargement des images déjà enregistrées.
   */
  let existingImages: ExistingEventServiceImage[] = [];

  if (input.mode === "update" && input.serviceId) {
    const { data: currentImages, error: currentImagesError } = await supabase
      .from("event_service_images")
      .select("id,image_path,alt_fr,alt_en,sort_order,is_cover,is_active")
      .eq("event_service_id", input.serviceId)
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      });

    if (currentImagesError) {
      console.error(
        "[admin-events] Current images load failed:",
        currentImagesError.message,
      );

      await cleanupUploadedEventImages(uploadedImagePaths);

      return formError(values, "Impossible d'enregistrer la prestation.");
    }

    existingImages = (currentImages ?? []) as ExistingEventServiceImage[];
  }

  /*
   * Images demandées à la suppression.
   */
  const uniqueDeletedImageIds = [...new Set(input.deletedImageIds)];

  const imagesToDelete =
    input.mode === "update"
      ? existingImages.filter((image) =>
          uniqueDeletedImageIds.includes(image.id),
        )
      : [];

  const deletedImageIdSet = new Set(imagesToDelete.map((image) => image.id));

  const remainingExistingImages = existingImages.filter(
    (image) => !deletedImageIdSet.has(image.id),
  );

  const remainingActiveExistingImages = remainingExistingImages.filter(
    (image) => image.is_active,
  );

  const totalImages =
    remainingExistingImages.length + uploadedImagePaths.length;

  const totalActiveImages =
    remainingActiveExistingImages.length + uploadedImagePaths.length;

  /*
   * Limite galerie.
   */
  if (totalImages > MAX_EVENT_SERVICE_IMAGES) {
    fieldErrors.imagePath =
      "Une prestation peut contenir au maximum 15 images.";
  }

  /*
   * CORRECTION PRINCIPALE :
   *
   * On vérifie maintenant les vraies images restantes,
   * et non uniquement values.imagePath.
   */
  const hasUsableImage =
    totalActiveImages > 0 ||
    (input.mode === "create" && Boolean(values.imagePath));

  if (values.isActive && !hasUsableImage) {
    fieldErrors.imagePath =
      "Ajoutez au moins une image avant d'afficher cette prestation sur le site.";
  }

  /*
   * Même une prestation inactive doit avoir
   * une image lors de sa création.
   */
  if (input.mode === "create" && !hasUsableImage) {
    fieldErrors.imagePath = "Ajoutez au moins une image.";
  }

  /*
   * Logs utiles si une validation échoue.
   */
  if (Object.keys(fieldErrors).length > 0) {
    console.error("[admin-events] Validation failed:", {
      serviceId: input.serviceId,

      mode: input.mode,

      fieldErrors,

      existingImages: existingImages.length,

      remainingActiveImages: remainingActiveExistingImages.length,

      uploadedImages: uploadedImagePaths.length,

      deletedImages: imagesToDelete.length,

      isActive: values.isActive,
    });

    await cleanupUploadedEventImages(uploadedImagePaths);

    return formError(
      values,
      "Veuillez corriger les champs signalés.",
      fieldErrors,
    );
  }

  const generatedAlt = generateEventServiceImageAlt({
    titleFr: values.titleFr,

    titleEn: values.titleEn,
  });

  const imageAltFr =
    values.imageAltFr ||
    (uploadedImagePaths.length > 0
      ? generatedAlt.fr
      : currentService?.image_alt_fr) ||
    generatedAlt.fr;

  const imageAltEn =
    values.imageAltEn ||
    (uploadedImagePaths.length > 0
      ? generatedAlt.en
      : currentService?.image_alt_en) ||
    generatedAlt.en;

  const initialImagePath =
    uploadedImagePaths[0] ||
    remainingActiveExistingImages.find((image) => image.is_cover)?.image_path ||
    remainingActiveExistingImages[0]?.image_path ||
    currentService?.image_path ||
    values.imagePath ||
    "";

  const payload = {
    code,

    title_fr: values.titleFr,

    title_en: values.titleEn,

    description_fr: values.descriptionFr,

    description_en: values.descriptionEn,

    image_path: initialImagePath,

    image_alt_fr: imageAltFr,

    image_alt_en: imageAltEn,

    is_active: values.isActive,
  };

  const result =
    input.mode === "create"
      ? await supabase
          .from("event_services")
          .insert(payload)
          .select("id")
          .single()
      : await supabase
          .from("event_services")
          .update(payload)
          .eq("id", input.serviceId)
          .select("id")
          .single();

  if (result.error || !result.data) {
    console.error(
      "[admin-events] Save failed:",
      result.error?.message ?? "No row returned",
    );

    await cleanupUploadedEventImages(uploadedImagePaths);

    return formError(
      values,

      result.error?.code === "42501"
        ? "Votre session a expiré. Veuillez vous reconnecter."
        : uploadedImagePaths.length > 0
          ? "Les nouvelles images ont été envoyées, mais la prestation n'a pas pu être mise à jour."
          : "Impossible d'enregistrer la prestation.",
    );
  }

  const savedId = (
    result.data as {
      id: string;
    }
  ).id;

  /*
   * Détermination de la couverture existante.
   */
  const requestedExistingCoverId = values.coverImageValue.startsWith(
    "existing:",
  )
    ? values.coverImageValue.replace("existing:", "")
    : "";

  const usableExistingCoverId =
    requestedExistingCoverId &&
    remainingActiveExistingImages.some(
      (image) => image.id === requestedExistingCoverId,
    )
      ? requestedExistingCoverId
      : "";

  /*
   * Nouvelle image choisie comme couverture.
   */
  const requestedPendingCoverIndex = values.coverImageValue.startsWith(
    "pending:",
  )
    ? Number(values.coverImageValue.replace("pending:", ""))
    : -1;

  const hasActiveCover = remainingActiveExistingImages.some(
    (image) => image.is_cover,
  );

  const pendingCoverIndex =
    requestedPendingCoverIndex >= 0 &&
    requestedPendingCoverIndex < uploadedImagePaths.length
      ? requestedPendingCoverIndex
      : !usableExistingCoverId &&
          !hasActiveCover &&
          uploadedImagePaths.length > 0
        ? 0
        : -1;

  const uploadedImageIds: string[] = [];

  if (usableExistingCoverId) {
    await supabase
      .from("event_service_images")
      .update({
        is_cover: false,
      })
      .eq("event_service_id", savedId)
      .eq("is_cover", true);

    const coverSave = await supabase
      .from("event_service_images")
      .update({
        is_cover: true,

        is_active: true,
      })
      .eq("id", usableExistingCoverId)
      .eq("event_service_id", savedId);

    if (coverSave.error) {
      console.error(
        "[admin-events] Existing cover save failed:",
        coverSave.error.message,
      );

      return formError(values, "Impossible de définir l'image de couverture.");
    }
  }

  if (pendingCoverIndex >= 0) {
    await supabase
      .from("event_service_images")
      .update({
        is_cover: false,
      })
      .eq("event_service_id", savedId)
      .eq("is_cover", true);
  }

  /*
   * Ajout des nouvelles images.
   */
  for (const [index, imagePath] of uploadedImagePaths.entries()) {
    const imageNumber = remainingActiveExistingImages.length + index + 1;

    const imageSave = await supabase
      .from("event_service_images")
      .insert({
        event_service_id: savedId,

        image_path: imagePath,

        alt_fr: `${generatedAlt.fr} - image ${imageNumber}`,

        alt_en: `${generatedAlt.en} - image ${imageNumber}`,

        sort_order: (remainingExistingImages.length + index) * 10,

        is_cover: pendingCoverIndex === index,

        is_active: true,
      })
      .select("id")
      .single();

    if (imageSave.error) {
      console.error(
        "[admin-events] Image save failed:",
        imageSave.error.message,
      );

      await cleanupUploadedEventImages(uploadedImagePaths.slice(index));

      return formError(
        values,
        "La prestation est enregistrée, mais une image optimisée n'a pas été ajoutée.",
      );
    }

    uploadedImageIds.push(
      (
        imageSave.data as {
          id: string;
        }
      ).id,
    );
  }

  /*
   * Couverture fallback.
   */
  const remainingCoverExists =
    usableExistingCoverId !== "" ||
    pendingCoverIndex >= 0 ||
    remainingActiveExistingImages.some((image) => image.is_cover);

  if (totalActiveImages > 0 && !remainingCoverExists) {
    const fallbackCoverId =
      remainingActiveExistingImages[0]?.id ?? uploadedImageIds[0] ?? "";

    if (fallbackCoverId) {
      await supabase
        .from("event_service_images")
        .update({
          is_cover: false,
        })
        .eq("event_service_id", savedId)
        .eq("is_cover", true);

      const fallbackCover = await supabase
        .from("event_service_images")
        .update({
          is_cover: true,

          is_active: true,
        })
        .eq("id", fallbackCoverId)
        .eq("event_service_id", savedId);

      if (fallbackCover.error) {
        console.error(
          "[admin-events] Fallback cover save failed:",
          fallbackCover.error.message,
        );

        return formError(
          values,
          "Impossible de définir l'image de couverture.",
        );
      }
    }
  }

  /*
   * Suppression Storage + DB.
   */
  if (imagesToDelete.length > 0) {
    const storagePaths = imagesToDelete
      .map((image) => getEventServiceStoragePath(image.image_path))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseClient.storage
        .from("site-news")
        .remove(storagePaths);

      if (storageError) {
        console.error("[admin-events] Storage image deletion failed:", {
          serviceId: savedId,

          imageIds: imagesToDelete.map((image) => image.id),

          paths: storagePaths,

          message: storageError.message,
        });

        return formError(
          values,
          "La prestation a été mise à jour, mais certaines anciennes images n'ont pas pu être supprimées.",
        );
      }
    }

    const deleteRows = await supabase
      .from("event_service_images")
      .delete()
      .eq("event_service_id", savedId)
      .in(
        "id",
        imagesToDelete.map((image) => image.id),
      );

    if (deleteRows.error) {
      console.error("[admin-events] Image row deletion failed:", {
        serviceId: savedId,

        imageIds: imagesToDelete.map((image) => image.id),

        message: deleteRows.error.message,
      });

      return formError(
        values,
        "La prestation a été mise à jour, mais certaines anciennes images n'ont pas pu être supprimées.",
      );
    }
  }

  /*
   * Synchronisation finale de image_path
   * avec la couverture réelle.
   */
  const synced = await syncEventServiceCover({
    supabase,

    serviceId: savedId,

    fallbackAltFr: generatedAlt.fr,

    fallbackAltEn: generatedAlt.en,
  });

  if (!synced) {
    return formError(
      values,
      "La prestation est enregistrée, mais l'image de couverture n'a pas pu être synchronisée.",
    );
  }

  return {
    ok: true,
  };
}
