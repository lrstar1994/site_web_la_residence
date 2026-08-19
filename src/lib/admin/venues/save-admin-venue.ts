import "server-only";

import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import { generateVenueImageAlt } from "@/lib/admin/generate-image-alt";
import {
  emptyVenueFormValues,
  emptyVenueSetupFormValues,
  type AdminVenueFormState,
  type AdminVenueFormValues,
  type AdminVenueSetupFormState,
  type AdminVenueSetupFormValues,
} from "@/lib/admin/venues/admin-venue-types";
import { getVenueStoragePath } from "@/lib/admin/venues/get-venue-storage-path";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUploadedStoragePath } from "@/lib/storage/validate-uploaded-storage-path";

const MAX_VENUE_IMAGES = 15;

function value(formData: FormData, name: string) {
  const field = formData.get(name);

  return typeof field === "string" ? field.trim() : "";
}

function intValue(raw: string) {
  const parsed = Number.parseInt(raw, 10);

  return Number.isFinite(parsed) ? parsed : null;
}

function numberValue(raw: string) {
  const parsed = Number(raw.replace(",", "."));

  return Number.isFinite(parsed) ? parsed : null;
}

/* =========================================================
   Lecture formulaire Salle
   ========================================================= */

export function getVenueFormValues(formData: FormData): AdminVenueFormValues {
  return {
    code: value(formData, "code"),

    name: value(formData, "name"),

    locationFr: value(formData, "location_fr"),

    locationEn: value(formData, "location_en"),

    shortDescriptionFr: value(formData, "short_description_fr"),

    shortDescriptionEn: value(formData, "short_description_en"),

    capacity: value(formData, "capacity"),

    surfaceM2: value(formData, "surface_m2"),

    sortOrder: value(formData, "sort_order"),

    isActive: formData.get("is_active") === "on",

    coverImageValue: value(formData, "cover_image_value"),

    deletedImageIds: [],

    categoryId: value(formData, "category_id"),
  };
}

/* =========================================================
   Lecture formulaire Configuration
   ========================================================= */

export function getVenueSetupFormValues(
  formData: FormData,
): AdminVenueSetupFormValues {
  return {
    code: value(formData, "code"),

    nameFr: value(formData, "name_fr"),

    nameEn: value(formData, "name_en"),

    iconKey: value(formData, "icon_key"),

    sortOrder: value(formData, "sort_order"),

    isActive: formData.get("is_active") === "on",
  };
}

/* =========================================================
   États par défaut
   ========================================================= */

export function getDefaultVenueFormState(): AdminVenueFormState {
  return {
    ok: false,
    message: "",
    fieldErrors: {},
    values: emptyVenueFormValues,
  };
}

export function getDefaultVenueSetupFormState(): AdminVenueSetupFormState {
  return {
    ok: false,
    message: "",
    fieldErrors: {},
    values: emptyVenueSetupFormValues,
  };
}

/* =========================================================
   Validation Salle
   ========================================================= */

function validateVenue(values: AdminVenueFormValues) {
  const errors: Record<string, string> = {};

  const capacity = intValue(values.capacity);

  const surface = values.surfaceM2 ? numberValue(values.surfaceM2) : null;

  if (values.name.length < 2) {
    errors.name = "Le nom est obligatoire.";
  }

  if (!values.locationFr) {
    errors.locationFr = "L'emplacement francais est obligatoire.";
  }

  if (!values.locationEn) {
    errors.locationEn = "L'emplacement anglais est obligatoire.";
  }

  if (!values.shortDescriptionFr) {
    errors.shortDescriptionFr =
      "La description courte francaise est obligatoire.";
  }

  if (!values.shortDescriptionEn) {
    errors.shortDescriptionEn =
      "La description courte anglaise est obligatoire.";
  }

  if (!capacity || capacity <= 0) {
    errors.capacity = "La capacite doit etre superieure a zero.";
  }

  if (values.surfaceM2 && (!surface || surface <= 0)) {
    errors.surfaceM2 = "La surface doit etre superieure a zero.";
  }

  if (!values.categoryId) {
    errors.categoryId = "Selectionnez une categorie pour cette salle.";
  }

  return {
    errors,
    capacity,
    surface,
  };
}

/* =========================================================
   Validation Configuration
   ========================================================= */

function validateSetup(values: AdminVenueSetupFormValues) {
  const errors: Record<string, string> = {};

  if (values.nameFr.length < 2) {
    errors.nameFr = "Le nom francais est obligatoire.";
  }

  if (values.nameEn.length < 2) {
    errors.nameEn = "Le nom anglais est obligatoire.";
  }

  return {
    errors,
  };
}

type ExistingVenueImage = {
  id: string;
  image_path: string;
  is_cover: boolean;
  is_active: boolean;
};

/* =========================================================
   Nettoyage Storage en cas d'échec
   ========================================================= */

async function cleanupUploadedVenueImages(imagePaths: string[]) {
  const storagePaths = imagePaths
    .map((imagePath) => getVenueStoragePath(imagePath))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) {
    return;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.storage
    .from("site-news")
    .remove(storagePaths);

  if (error) {
    console.error("[admin-venues] Uploaded image cleanup failed:", {
      paths: storagePaths,
      message: error.message,
    });
  }
}

/* =========================================================
   Sauvegarde Salle
   ========================================================= */

export async function saveVenue({
  mode,
  venueId,
  values,
  imagePaths,
  deletedImageIds,
  setupIds,
}: {
  mode: "create" | "update";
  venueId?: string;
  values: AdminVenueFormValues;
  imagePaths: string[];
  deletedImageIds: string[];
  setupIds: string[];
}): Promise<AdminVenueFormState> {
  await requireAdmin("fr");

  const validation = validateVenue(values);

  const supabaseClient = await createSupabaseServerClient();

  const supabase = supabaseClient.schema("site");

  let code = values.code;

  let existingImages: ExistingVenueImage[] = [];

  const uniqueDeletedImageIds = [...new Set(deletedImageIds)];

  const uniqueSetupIds = [...new Set(setupIds.filter(Boolean))];

  const uploadedImagePaths = [
    ...new Set(
      imagePaths.filter((imagePath) =>
        validateUploadedStoragePath({
          value: imagePath,
          bucket: "site-news",
          allowedPrefix: "venues/",
        }),
      ),
    ),
  ];

  if (uploadedImagePaths.length !== imagePaths.length) {
    validation.errors.imagePath = "Une image envoyee n'est pas valide.";
  }

  /* =======================================================
     Vérification de la catégorie
     ======================================================= */

  if (values.categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("venue_categories")
      .select("id,is_active")
      .eq("id", values.categoryId)
      .maybeSingle();

    if (categoryError) {
      console.error("[admin-venues] Category validation failed:", {
        categoryId: values.categoryId,
        message: categoryError.message,
      });

      await cleanupUploadedVenueImages(uploadedImagePaths);

      return {
        ok: false,
        message: "Impossible de verifier la categorie de la salle.",
        fieldErrors: {},
        values,
      };
    }

    if (!category || !category.is_active) {
      validation.errors.categoryId =
        "La categorie selectionnee n'est pas valide.";
    }
  }

  /* =======================================================
     Création / récupération du code
     ======================================================= */

  if (mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "venues", values.name, "salle");
    } catch (error) {
      console.error(
        "[admin-venues] Code generation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      await cleanupUploadedVenueImages(uploadedImagePaths);

      return {
        ok: false,
        message: "Impossible d'enregistrer la salle.",
        fieldErrors: {},
        values,
      };
    }
  } else if (venueId) {
    const { data: currentVenue, error: currentError } = await supabase
      .from("venues")
      .select("code")
      .eq("id", venueId)
      .maybeSingle();

    if (currentError || !currentVenue) {
      console.error(
        "[admin-venues] Current venue load failed:",
        currentError?.message ?? "Missing row",
      );

      await cleanupUploadedVenueImages(uploadedImagePaths);

      return {
        ok: false,
        message: "Salle introuvable.",
        fieldErrors: {},
        values,
      };
    }

    code = currentVenue.code;

    const { data: currentImages, error: currentImagesError } = await supabase
      .from("venue_images")
      .select("id,image_path,is_cover,is_active")
      .eq("venue_id", venueId)
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      });

    if (currentImagesError) {
      console.error(
        "[admin-venues] Current images load failed:",
        currentImagesError.message,
      );

      await cleanupUploadedVenueImages(uploadedImagePaths);

      return {
        ok: false,
        message: "Impossible d'enregistrer la salle.",
        fieldErrors: {},
        values,
      };
    }

    existingImages = (currentImages ?? []) as ExistingVenueImage[];
  }

  /* =======================================================
     Calcul des images restantes
     ======================================================= */

  const imagesToDelete =
    mode === "update" && uniqueDeletedImageIds.length > 0
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

  const existingActiveCount = existingImages.filter(
    (image) => image.is_active,
  ).length;

  const deletedActiveCount = imagesToDelete.filter(
    (image) => image.is_active,
  ).length;

  const totalImages =
    remainingExistingImages.length + uploadedImagePaths.length;

  const totalActiveImages =
    existingActiveCount - deletedActiveCount + uploadedImagePaths.length;

  if (totalImages > MAX_VENUE_IMAGES) {
    validation.errors.imagePath =
      "Une salle peut contenir au maximum 15 images.";
  }

  if (values.isActive && totalActiveImages === 0) {
    validation.errors.imagePath =
      "Ajoutez au moins une image avant d'afficher cette salle sur le site.";
  }

  /* =======================================================
     Arrêt si validation invalide
     ======================================================= */

  if (Object.keys(validation.errors).length > 0) {
    await cleanupUploadedVenueImages(uploadedImagePaths);

    return {
      ok: false,
      message: "Certains champs doivent etre corriges.",
      fieldErrors: validation.errors,
      values,
    };
  }

  /* =======================================================
     Payload principal
     ======================================================= */

  const payload = {
    code,

    name: values.name,

    location_fr: values.locationFr,

    location_en: values.locationEn,

    short_description_fr: values.shortDescriptionFr,

    short_description_en: values.shortDescriptionEn,

    description_fr: values.shortDescriptionFr,

    description_en: values.shortDescriptionEn,

    capacity: validation.capacity,

    surface_m2: validation.surface,

    category_id: values.categoryId,

    is_active: values.isActive,
  };

  /* =======================================================
     Sauvegarde de la salle
     ======================================================= */

  const saved =
    mode === "create"
      ? await supabase.from("venues").insert(payload).select("id").single()
      : await supabase
          .from("venues")
          .update(payload)
          .eq("id", venueId)
          .select("id")
          .single();

  if (saved.error || !saved.data) {
    console.error(
      "[admin-venues] Save failed:",
      saved.error?.message ?? "No row returned",
    );

    await cleanupUploadedVenueImages(uploadedImagePaths);

    return {
      ok: false,
      message: "Impossible d'enregistrer la salle.",
      fieldErrors: {},
      values,
    };
  }

  const id = (
    saved.data as {
      id: string;
    }
  ).id;

  /* =======================================================
     Gestion de la couverture
     ======================================================= */

  const generatedAlt = generateVenueImageAlt(values.name);

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
      : !hasActiveCover && uploadedImagePaths.length > 0
        ? 0
        : -1;

  const uploadedImageIds: string[] = [];

  /* =======================================================
     Couverture existante
     ======================================================= */

  if (usableExistingCoverId) {
    await supabase
      .from("venue_images")
      .update({
        is_cover: false,
      })
      .eq("venue_id", id)
      .eq("is_cover", true);

    const coverSave = await supabase
      .from("venue_images")
      .update({
        is_cover: true,
        is_active: true,
      })
      .eq("id", usableExistingCoverId)
      .eq("venue_id", id);

    if (coverSave.error) {
      console.error(
        "[admin-venues] Existing cover save failed:",
        coverSave.error.message,
      );

      return {
        ok: false,
        message: "Impossible de definir l'image de couverture.",
        fieldErrors: {},
        values,
      };
    }
  }

  if (pendingCoverIndex >= 0) {
    await supabase
      .from("venue_images")
      .update({
        is_cover: false,
      })
      .eq("venue_id", id)
      .eq("is_cover", true);
  }

  /* =======================================================
     Enregistrement des nouvelles images
     ======================================================= */

  for (const [index, imagePath] of uploadedImagePaths.entries()) {
    const imageNumber = remainingActiveExistingImages.length + index + 1;

    const imageSave = await supabase
      .from("venue_images")
      .insert({
        venue_id: id,

        image_path: imagePath,

        alt_fr: `${generatedAlt.fr} - image ${imageNumber}`,

        alt_en: `${generatedAlt.en} - image ${imageNumber}`,

        is_cover: pendingCoverIndex === index,

        is_active: true,
      })
      .select("id")
      .single();

    if (imageSave.error) {
      console.error(
        "[admin-venues] Image save failed:",
        imageSave.error.message,
      );

      await cleanupUploadedVenueImages(uploadedImagePaths.slice(index));

      return {
        ok: false,
        message:
          "La salle est enregistree, mais une image optimisee n'a pas ete ajoutee.",
        fieldErrors: {},
        values,
      };
    }

    uploadedImageIds.push(
      (
        imageSave.data as {
          id: string;
        }
      ).id,
    );
  }

  /* =======================================================
     Couverture fallback
     ======================================================= */

  const remainingCoverExists =
    usableExistingCoverId !== "" ||
    pendingCoverIndex >= 0 ||
    remainingActiveExistingImages.some((image) => image.is_cover);

  if (totalActiveImages > 0 && !remainingCoverExists) {
    const fallbackCoverId =
      remainingActiveExistingImages[0]?.id ?? uploadedImageIds[0] ?? "";

    if (fallbackCoverId) {
      await supabase
        .from("venue_images")
        .update({
          is_cover: false,
        })
        .eq("venue_id", id)
        .eq("is_cover", true);

      const fallbackCover = await supabase
        .from("venue_images")
        .update({
          is_cover: true,
          is_active: true,
        })
        .eq("id", fallbackCoverId)
        .eq("venue_id", id);

      if (fallbackCover.error) {
        console.error(
          "[admin-venues] Fallback cover save failed:",
          fallbackCover.error.message,
        );

        return {
          ok: false,
          message: "Impossible de definir l'image de couverture.",
          fieldErrors: {},
          values,
        };
      }
    }
  }

  /* =======================================================
     Suppression des anciennes images
     ======================================================= */

  if (imagesToDelete.length > 0) {
    const storagePaths = imagesToDelete
      .map((image) => getVenueStoragePath(image.image_path))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseClient.storage
        .from("site-news")
        .remove(storagePaths);

      if (storageError) {
        console.error("[admin-venues] Storage image deletion failed:", {
          venueId: id,

          imageIds: imagesToDelete.map((image) => image.id),

          paths: storagePaths,

          message: storageError.message,
        });

        return {
          ok: false,
          message:
            "La salle a ete mise a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
          fieldErrors: {},
          values,
        };
      }
    }

    const deleteRows = await supabase
      .from("venue_images")
      .delete()
      .eq("venue_id", id)
      .in(
        "id",
        imagesToDelete.map((image) => image.id),
      );

    if (deleteRows.error) {
      console.error("[admin-venues] Image row deletion failed:", {
        venueId: id,

        imageIds: imagesToDelete.map((image) => image.id),

        message: deleteRows.error.message,
      });

      return {
        ok: false,
        message:
          "La salle a ete mise a jour, mais certaines anciennes images n'ont pas pu etre supprimees.",
        fieldErrors: {},
        values,
      };
    }
  }

  /* =======================================================
     Configurations de salle
     ======================================================= */

  const disableOldSetups = await supabase
    .from("venue_setup_links")
    .update({
      is_active: false,
    })
    .eq("venue_id", id);

  if (disableOldSetups.error) {
    console.error(
      "[admin-venues] Setup reset failed:",
      disableOldSetups.error.message,
    );

    return {
      ok: false,
      message:
        "La salle est enregistree, mais les configurations n'ont pas ete mises a jour.",
      fieldErrors: {},
      values,
    };
  }

  if (uniqueSetupIds.length > 0) {
    const linkSave = await supabase.from("venue_setup_links").upsert(
      uniqueSetupIds.map((setupId, index) => ({
        venue_id: id,

        setup_type_id: setupId,

        capacity: null,

        sort_order: (index + 1) * 10,

        is_active: true,
      })),

      {
        onConflict: "venue_id,setup_type_id",
      },
    );

    if (linkSave.error) {
      console.error(
        "[admin-venues] Setup link save failed:",
        linkSave.error.message,
      );

      return {
        ok: false,
        message:
          "La salle est enregistree, mais les configurations n'ont pas ete mises a jour.",
        fieldErrors: {},
        values,
      };
    }
  }

  /* =======================================================
     Succès
     ======================================================= */

  return {
    ok: true,
    message: "",
    fieldErrors: {},
    values: {
      ...values,
      categoryId: values.categoryId,
    },
  };
}

/* =========================================================
   Sauvegarde Configuration
   ========================================================= */

export async function saveVenueSetup({
  mode,
  setupId,
  values,
}: {
  mode: "create" | "update";
  setupId?: string;
  values: AdminVenueSetupFormValues;
}): Promise<AdminVenueSetupFormState> {
  await requireAdmin("fr");

  const validation = validateSetup(values);

  if (Object.keys(validation.errors).length > 0) {
    return {
      ok: false,
      message: "Certains champs doivent etre corriges.",
      fieldErrors: validation.errors,
      values,
    };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");

  let code = values.code;

  if (mode === "create") {
    try {
      code = await generateUniqueCode(
        supabase,
        "venue_setup_types",
        values.nameFr,
        "configuration",
      );
    } catch (error) {
      console.error(
        "[admin-venues] Setup code generation failed:",
        error instanceof Error ? error.message : "Unknown error",
      );

      return {
        ok: false,
        message: "Impossible d'enregistrer la configuration.",
        fieldErrors: {},
        values,
      };
    }
  } else if (setupId) {
    const { data, error } = await supabase
      .from("venue_setup_types")
      .select("code")
      .eq("id", setupId)
      .maybeSingle();

    if (error || !data) {
      console.error(
        "[admin-venues] Current setup load failed:",
        error?.message ?? "Missing row",
      );

      return {
        ok: false,
        message: "Configuration introuvable.",
        fieldErrors: {},
        values,
      };
    }

    code = data.code;
  }

  const payload = {
    code,

    name_fr: values.nameFr,

    name_en: values.nameEn,

    icon_key: values.iconKey || null,

    is_active: values.isActive,
  };

  const result =
    mode === "create"
      ? await supabase.from("venue_setup_types").insert(payload)
      : await supabase
          .from("venue_setup_types")
          .update(payload)
          .eq("id", setupId);

  if (result.error) {
    console.error("[admin-venues] Setup save failed:", result.error.message);

    return {
      ok: false,
      message: "Impossible d'enregistrer la configuration.",
      fieldErrors: {},
      values,
    };
  }

  return {
    ok: true,
    message: "",
    fieldErrors: {},
    values,
  };
}
