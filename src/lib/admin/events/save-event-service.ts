import "server-only";

import {
  emptyAdminEventServiceFormValues,
  type AdminEventServiceFormState,
  type AdminEventServiceFormValues,
} from "@/lib/admin/events/admin-event-service-types";
import { getEventServiceStoragePath } from "@/lib/admin/events/get-event-service-storage-path";
import { uploadEventServiceImage } from "@/lib/admin/events/upload-event-service-image";
import { generateEventServiceImageAlt } from "@/lib/admin/generate-image-alt";
import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import { isUsableNewsImagePath } from "@/lib/admin/news/news-image-validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SaveInput = {
  mode: "create" | "update";
  serviceId?: string;
  values: AdminEventServiceFormValues;
  imageFile?: File | null;
};

type SaveResult = { ok: true } | AdminEventServiceFormState;

type CurrentEventServiceRow = {
  code: string;
  image_path: string;
  image_alt_fr: string;
  image_alt_en: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const htmlPattern = /<[^>]+>/;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getEventServiceFormValues(formData: FormData): AdminEventServiceFormValues {
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
  return { ok: false, message, fieldErrors, values };
}

function validateText(
  fieldErrors: AdminEventServiceFormState["fieldErrors"],
  key: keyof AdminEventServiceFormValues,
  value: string,
  label: string,
  options: { min?: number; max?: number; noHtml?: boolean; required?: boolean },
) {
  if (options.required !== false && !value) {
    fieldErrors[key] = `${label} est obligatoire.`;
    return;
  }

  if (options.min && value.length > 0 && value.length < options.min) {
    fieldErrors[key] = `${label} doit contenir au moins ${options.min} caractères.`;
    return;
  }

  if (options.max && value.length > options.max) {
    fieldErrors[key] = `${label} doit contenir au maximum ${options.max} caractères.`;
    return;
  }

  if (options.noHtml && htmlPattern.test(value)) {
    fieldErrors[key] = `${label} ne doit pas contenir de HTML.`;
  }
}

function validate(values: AdminEventServiceFormValues, hasImageUpload: boolean) {
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
  validateText(fieldErrors, "descriptionFr", values.descriptionFr, "La description française", {
    max: 2000,
    noHtml: true,
  });
  validateText(fieldErrors, "descriptionEn", values.descriptionEn, "La description anglaise", {
    max: 2000,
    noHtml: true,
  });
  validateText(fieldErrors, "imageAltFr", values.imageAltFr, "Le texte alternatif français", {
    max: 250,
    noHtml: true,
    required: false,
  });
  validateText(fieldErrors, "imageAltEn", values.imageAltEn, "Le texte alternatif anglais", {
    max: 250,
    noHtml: true,
    required: false,
  });

  if (!values.imagePath && !hasImageUpload) {
    fieldErrors.imagePath = "Ajoutez une image.";
  } else if (values.imagePath && !isUsableNewsImagePath(values.imagePath)) {
    fieldErrors.imagePath = "Le chemin de l'image doit être local ou une URL https valide.";
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

export async function saveEventService(input: SaveInput): Promise<SaveResult> {
  const values = input.values;
  const fieldErrors = validate(values, Boolean(input.imageFile));

  if (input.mode === "update" && (!input.serviceId || !uuidPattern.test(input.serviceId))) {
    fieldErrors.titleFr = "Prestation introuvable.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return formError(values, "Veuillez corriger les champs signalés.", fieldErrors);
  }

  await requireAdmin("fr");
  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");

  const currentService =
    input.mode === "update" && input.serviceId ? await loadCurrentService(input.serviceId) : null;

  if (input.mode === "update" && !currentService) {
    return formError(values, "Prestation introuvable.");
  }

  let code = currentService?.code ?? values.code;
  if (input.mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "event_services", values.titleFr, "prestation");
    } catch (error) {
      console.error("[admin-events] Code generation failed:", error instanceof Error ? error.message : "Unknown error");
      return formError(values, "Impossible d'enregistrer la prestation.");
    }
  }

  let imagePath = values.imagePath || currentService?.image_path || "";
  let uploadedObjectPath: string | null = null;
  if (input.imageFile) {
    const upload = await uploadEventServiceImage(input.imageFile, code);
    if (!upload.ok) {
      return formError(values, upload.message, { imagePath: upload.message });
    }
    imagePath = upload.publicUrl;
    uploadedObjectPath = upload.objectPath;
  }

  const generatedAlt = generateEventServiceImageAlt({
    titleFr: values.titleFr,
    titleEn: values.titleEn,
  });
  const imageAltFr =
    values.imageAltFr || (input.imageFile ? generatedAlt.fr : currentService?.image_alt_fr) || generatedAlt.fr;
  const imageAltEn =
    values.imageAltEn || (input.imageFile ? generatedAlt.en : currentService?.image_alt_en) || generatedAlt.en;

  const payload = {
    code,
    title_fr: values.titleFr,
    title_en: values.titleEn,
    description_fr: values.descriptionFr,
    description_en: values.descriptionEn,
    image_path: imagePath,
    image_alt_fr: imageAltFr,
    image_alt_en: imageAltEn,
    is_active: values.isActive,
  };

  const result =
    input.mode === "create"
      ? await supabase.from("event_services").insert(payload).select("id,image_path").single()
      : await supabase
          .from("event_services")
          .update(payload)
          .eq("id", input.serviceId)
          .select("id,image_path")
          .single();

  if (result.error) {
    console.error("[admin-events] Save failed:", result.error.message);

    if (uploadedObjectPath) {
      const { error: cleanupError } = await supabaseClient.storage
        .from("site-news")
        .remove([uploadedObjectPath]);

      if (cleanupError) {
        console.error("[admin-event-update] Uploaded image cleanup failed:", {
          serviceId: input.serviceId,
          path: uploadedObjectPath,
          message: cleanupError.message,
        });
      }
    }

    return formError(
      values,
      result.error.code === "42501"
        ? "Votre session a expiré. Veuillez vous reconnecter."
        : uploadedObjectPath
          ? "La nouvelle image a ete envoyee, mais la prestation n'a pas pu etre mise a jour."
          : "Impossible d'enregistrer la prestation.",
    );
  }

  if (input.imageFile && currentService?.image_path && currentService.image_path !== imagePath) {
    const previousStoragePath = getEventServiceStoragePath(currentService.image_path);

    if (previousStoragePath && previousStoragePath !== uploadedObjectPath) {
      const { error: storageError } = await supabaseClient.storage
        .from("site-news")
        .remove([previousStoragePath]);

      if (storageError) {
        console.error("[event-admin] Impossible de supprimer l'ancien fichier Storage.", {
          serviceId: input.serviceId,
          path: previousStoragePath,
          message: storageError.message,
        });
      }
    }
  }

  return { ok: true };
}
