import "server-only";

import {
  type AdminNewsFormIntent,
  type AdminNewsFormState,
  type AdminNewsFormValues,
} from "@/lib/admin/news/admin-news-types";
import { generateNewsImageAlt } from "@/lib/admin/generate-image-alt";
import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import { isUsableNewsImagePath } from "@/lib/admin/news/news-image-validation";
import { uploadNewsImage } from "@/lib/admin/news/upload-news-image";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ArticleStatus = "draft" | "published" | "archived";

type SaveArticleInput = {
  mode: "create" | "update";
  articleId?: string;
  intent: AdminNewsFormIntent;
  values: AdminNewsFormValues;
  imageFile?: File | null;
};

type SaveArticleResult = { ok: true } | AdminNewsFormState;

type CategoryAccessRow = {
  id: string;
  is_active: boolean;
};

type CurrentArticleRow = {
  id: string;
  code: string;
  category_id: string;
  image_path: string;
  image_alt_fr: string;
  image_alt_en: string;
  status: ArticleStatus;
  published_at: string | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const htmlPattern = /<[^>]+>/;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function getAdminNewsFormValues(formData: FormData): AdminNewsFormValues {
  return {
    code: getString(formData, "code"),
    categoryId: getString(formData, "category_id"),
    imagePath: getString(formData, "image_path"),
    imageAltFr: getString(formData, "image_alt_fr"),
    imageAltEn: getString(formData, "image_alt_en"),
    titleFr: getString(formData, "title_fr"),
    titleEn: getString(formData, "title_en"),
    excerptFr: getString(formData, "excerpt_fr"),
    excerptEn: getString(formData, "excerpt_en"),
    contentFr: getString(formData, "content_fr"),
    contentEn: getString(formData, "content_en"),
    scheduledAt: getString(formData, "scheduled_at"),
  };
}

export function getAdminNewsFormIntent(formData: FormData): AdminNewsFormIntent {
  const intent = formData.get("intent");

  if (
    intent === "draft" ||
    intent === "publish" ||
    intent === "schedule" ||
    intent === "save" ||
    intent === "archive"
  ) {
    return intent;
  }

  return "save";
}

function createFormError(
  values: AdminNewsFormValues,
  message: string,
  fieldErrors: AdminNewsFormState["fieldErrors"] = {},
): AdminNewsFormState {
  return { ok: false, message, fieldErrors, values };
}

function validateText(
  fieldErrors: AdminNewsFormState["fieldErrors"],
  key: keyof AdminNewsFormValues,
  value: string,
  label: string,
  options: { min?: number; max?: number; required?: boolean; noHtml?: boolean },
) {
  if (options.required && !value) {
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

function validateValues(values: AdminNewsFormValues, hasImageUpload: boolean) {
  const fieldErrors: AdminNewsFormState["fieldErrors"] = {};

  if (!uuidPattern.test(values.categoryId)) {
    fieldErrors.categoryId = "La catégorie est obligatoire.";
  }

  if (!values.imagePath && !hasImageUpload) {
    fieldErrors.imagePath = "Ajoutez une image.";
  } else if (
    values.imagePath &&
    (values.imagePath.length > 500 || !isUsableNewsImagePath(values.imagePath))
  ) {
    fieldErrors.imagePath = "Le chemin de l'image doit être local ou une URL https valide.";
  }

  validateText(fieldErrors, "imageAltFr", values.imageAltFr, "Le texte alternatif français", {
    required: false,
    max: 250,
    noHtml: true,
  });
  validateText(fieldErrors, "imageAltEn", values.imageAltEn, "Le texte alternatif anglais", {
    required: false,
    max: 250,
    noHtml: true,
  });
  validateText(fieldErrors, "titleFr", values.titleFr, "Le titre français", {
    required: true,
    min: 3,
    max: 200,
    noHtml: true,
  });
  validateText(fieldErrors, "titleEn", values.titleEn, "Le titre anglais", {
    required: true,
    min: 3,
    max: 200,
    noHtml: true,
  });
  validateText(fieldErrors, "excerptFr", values.excerptFr, "Le résumé français", {
    required: true,
    max: 500,
    noHtml: true,
  });
  validateText(fieldErrors, "excerptEn", values.excerptEn, "Le résumé anglais", {
    required: true,
    max: 500,
    noHtml: true,
  });
  validateText(fieldErrors, "contentFr", values.contentFr, "Le contenu français", {
    required: true,
    max: 20000,
    noHtml: true,
  });
  validateText(fieldErrors, "contentEn", values.contentEn, "Le contenu anglais", {
    required: true,
    max: 20000,
    noHtml: true,
  });

  return fieldErrors;
}

function madagascarLocalToIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match;
  const utcDate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 3, Number(minute), 0, 0),
  );

  return Number.isNaN(utcDate.getTime()) ? null : utcDate.toISOString();
}

function getPublicationFields(input: SaveArticleInput, currentArticle: CurrentArticleRow | null) {
  if (input.intent === "draft") {
    return { status: "draft" as const, published_at: null };
  }

  if (input.intent === "publish") {
    return { status: "published" as const, published_at: new Date().toISOString() };
  }

  if (input.intent === "schedule") {
    const scheduledIso = madagascarLocalToIso(input.values.scheduledAt);
    if (!scheduledIso || new Date(scheduledIso).getTime() <= Date.now()) {
      return { error: { scheduledAt: "La date de publication doit être dans le futur." } };
    }
    return { status: "published" as const, published_at: scheduledIso };
  }

  if (input.intent === "archive") {
    return {
      status: "archived" as const,
      published_at: currentArticle?.published_at ?? null,
    };
  }

  return {
    status: currentArticle?.status ?? ("draft" as const),
    published_at: currentArticle?.published_at ?? null,
  };
}

export async function saveAdminNewsArticle(input: SaveArticleInput): Promise<SaveArticleResult> {
  const values = input.values;
  const fieldErrors = validateValues(values, Boolean(input.imageFile));

  if (input.mode === "create" && input.intent === "archive") {
    fieldErrors.intent = "Un nouvel article ne peut pas être archivé directement.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createFormError(values, "Veuillez corriger les champs signalés.", fieldErrors);
  }

  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");

  const currentArticle =
    input.mode === "update" && input.articleId
      ? await supabase
          .from("news_articles")
          .select("id,code,category_id,image_path,image_alt_fr,image_alt_en,status,published_at")
          .eq("id", input.articleId)
          .maybeSingle()
      : null;

  if (currentArticle?.error) {
    console.error("[admin-news] Unable to load article before save:", currentArticle.error.message);
    return createFormError(values, "Impossible d'enregistrer l'article.");
  }

  const currentArticleData = (currentArticle?.data as CurrentArticleRow | null) ?? null;
  if (input.mode === "update" && !currentArticleData) {
    return createFormError(values, "Article introuvable.");
  }

  const { data: categoryData, error: categoryError } = await supabase
    .from("news_categories")
    .select("id,is_active")
    .eq("id", values.categoryId)
    .maybeSingle();

  if (categoryError) {
    console.error("[admin-news] Unable to verify category:", categoryError.message);
    return createFormError(values, "Impossible d'enregistrer l'article.");
  }

  const category = categoryData as CategoryAccessRow | null;
  if (!category) {
    return createFormError(values, "Veuillez choisir une catégorie valide.", {
      categoryId: "Cette catégorie n'existe pas.",
    });
  }

  const keepsInactiveCategory =
    input.mode === "update" &&
    currentArticleData?.category_id === values.categoryId &&
    category.is_active === false;

  if (!category.is_active && !keepsInactiveCategory) {
    return createFormError(values, "Veuillez choisir une catégorie active.", {
      categoryId: "Cette catégorie est inactive.",
    });
  }

  let code = currentArticleData?.code ?? values.code;
  if (input.mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "news_articles", values.titleFr, "article");
    } catch (error) {
      console.error("[admin-news] Unable to generate code:", error instanceof Error ? error.message : "Unknown error");
      return createFormError(values, "Impossible d'enregistrer l'article.");
    }
  }

  const publication = getPublicationFields(input, currentArticleData);
  if ("error" in publication) {
    return createFormError(values, "Veuillez corriger les champs signalés.", publication.error);
  }

  let imagePath = values.imagePath || currentArticleData?.image_path || "";
  if (input.imageFile) {
    const uploadResult = await uploadNewsImage(input.imageFile, code);
    if (!uploadResult.ok) {
      return createFormError(values, uploadResult.message, { imagePath: uploadResult.message });
    }
    imagePath = uploadResult.publicUrl;
  }

  const generatedAlt = generateNewsImageAlt({ titleFr: values.titleFr, titleEn: values.titleEn });
  const imageAltFr =
    values.imageAltFr || (input.imageFile ? generatedAlt.fr : currentArticleData?.image_alt_fr) || generatedAlt.fr;
  const imageAltEn =
    values.imageAltEn || (input.imageFile ? generatedAlt.en : currentArticleData?.image_alt_en) || generatedAlt.en;

  const payload = {
    code,
    category_id: values.categoryId,
    title_fr: values.titleFr,
    title_en: values.titleEn,
    excerpt_fr: values.excerptFr,
    excerpt_en: values.excerptEn,
    content_fr: values.contentFr,
    content_en: values.contentEn,
    image_path: imagePath,
    image_alt_fr: imageAltFr,
    image_alt_en: imageAltEn,
    status: publication.status,
    published_at: publication.published_at,
  };

  const result =
    input.mode === "create"
      ? await supabase.from("news_articles").insert(payload)
      : await supabase.from("news_articles").update(payload).eq("id", input.articleId);

  if (result.error) {
    console.error("[admin-news] Save failed:", result.error.message);
    return createFormError(
      values,
      result.error.code === "42501"
        ? "Votre session a expiré. Veuillez vous reconnecter."
        : "Impossible d'enregistrer l'article.",
    );
  }

  return { ok: true };
}
