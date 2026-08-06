import "server-only";

import {
  type AdminNewsFormIntent,
  type AdminNewsFormState,
  type AdminNewsFormValues,
} from "@/lib/admin/news/admin-news-types";
import { generateNewsImageAlt } from "@/lib/admin/generate-image-alt";
import { generateUniqueCode } from "@/lib/admin/generate-unique-code";
import { getNewsStoragePath } from "@/lib/admin/news/get-news-storage-path";
import { isUsableNewsImagePath } from "@/lib/admin/news/news-image-validation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { validateUploadedStoragePath } from "@/lib/storage/validate-uploaded-storage-path";

type ArticleStatus = "draft" | "published" | "archived";

type SaveArticleInput = {
  mode: "create" | "update";
  articleId?: string;
  intent: AdminNewsFormIntent;
  values: AdminNewsFormValues;
  imagePaths: string[];
  deletedImageIds: string[];
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

type ExistingNewsImage = {
  id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

const MAX_NEWS_IMAGES = 15;
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
    coverImageValue: getString(formData, "cover_image_value"),
    deletedImageIds: [],
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
    fieldErrors[key] = `${label} doit contenir au moins ${options.min} caracteres.`;
    return;
  }

  if (options.max && value.length > options.max) {
    fieldErrors[key] = `${label} doit contenir au maximum ${options.max} caracteres.`;
    return;
  }

  if (options.noHtml && htmlPattern.test(value)) {
    fieldErrors[key] = `${label} ne doit pas contenir de HTML.`;
  }
}

function validateValues(values: AdminNewsFormValues, hasImageUpload: boolean) {
  const fieldErrors: AdminNewsFormState["fieldErrors"] = {};

  if (!uuidPattern.test(values.categoryId)) {
    fieldErrors.categoryId = "La categorie est obligatoire.";
  }

  if (!values.imagePath && !hasImageUpload) {
    fieldErrors.imagePath = "Ajoutez une image.";
  } else if (
    values.imagePath &&
    (values.imagePath.length > 500 || !isUsableNewsImagePath(values.imagePath))
  ) {
    fieldErrors.imagePath = "Le chemin de l'image doit etre local ou une URL https valide.";
  }

  validateText(fieldErrors, "imageAltFr", values.imageAltFr, "Le texte alternatif francais", {
    required: false,
    max: 250,
    noHtml: true,
  });
  validateText(fieldErrors, "imageAltEn", values.imageAltEn, "Le texte alternatif anglais", {
    required: false,
    max: 250,
    noHtml: true,
  });
  validateText(fieldErrors, "titleFr", values.titleFr, "Le titre francais", {
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
  validateText(fieldErrors, "excerptFr", values.excerptFr, "Le resume francais", {
    required: true,
    max: 500,
    noHtml: true,
  });
  validateText(fieldErrors, "excerptEn", values.excerptEn, "Le resume anglais", {
    required: true,
    max: 500,
    noHtml: true,
  });
  validateText(fieldErrors, "contentFr", values.contentFr, "Le contenu francais", {
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
      return { error: { scheduledAt: "La date de publication doit etre dans le futur." } };
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

async function cleanupUploadedNewsImages(imagePaths: string[]) {
  const storagePaths = imagePaths
    .map((imagePath) => getNewsStoragePath(imagePath))
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.storage.from("site-news").remove(storagePaths);

  if (error) {
    console.error("[admin-news] Uploaded image cleanup failed:", {
      paths: storagePaths,
      message: error.message,
    });
  }
}

async function syncNewsCover({
  supabase,
  articleId,
  fallbackAltFr,
  fallbackAltEn,
}: {
  supabase: ReturnType<Awaited<ReturnType<typeof createSupabaseServerClient>>["schema"]>;
  articleId: string;
  fallbackAltFr: string;
  fallbackAltEn: string;
}) {
  const { data: imagesData, error: imagesError } = await supabase
    .from("news_article_images")
    .select("id,image_path,alt_fr,alt_en,is_cover,is_active,sort_order")
    .eq("news_article_id", articleId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (imagesError) {
    console.error("[admin-news] Cover sync image load failed:", imagesError.message);
    return false;
  }

  const images = (imagesData ?? []) as ExistingNewsImage[];
  if (images.length === 0) {
    const clear = await supabase
      .from("news_articles")
      .update({ image_path: "", image_alt_fr: fallbackAltFr, image_alt_en: fallbackAltEn })
      .eq("id", articleId);

    if (clear.error) {
      console.error("[admin-news] Cover sync clear failed:", clear.error.message);
      return false;
    }

    return true;
  }

  const cover = images.find((image) => image.is_cover) ?? images[0];
  await supabase
    .from("news_article_images")
    .update({ is_cover: false })
    .eq("news_article_id", articleId)
    .eq("is_cover", true);
  const coverSave = await supabase
    .from("news_article_images")
    .update({ is_cover: true, is_active: true })
    .eq("id", cover.id)
    .eq("news_article_id", articleId);

  if (coverSave.error) {
    console.error("[admin-news] Cover sync save failed:", coverSave.error.message);
    return false;
  }

  const mainSave = await supabase
    .from("news_articles")
    .update({
      image_path: cover.image_path,
      image_alt_fr: cover.alt_fr || fallbackAltFr,
      image_alt_en: cover.alt_en || fallbackAltEn,
    })
    .eq("id", articleId);

  if (mainSave.error) {
    console.error("[admin-news] Main image sync failed:", mainSave.error.message);
    return false;
  }

  return true;
}

export async function saveAdminNewsArticle(input: SaveArticleInput): Promise<SaveArticleResult> {
  const values = input.values;
  const uploadedImagePaths = [
    ...new Set(
      input.imagePaths.filter((imagePath) =>
        validateUploadedStoragePath({
          value: imagePath,
          bucket: "site-news",
          allowedPrefix: "articles/",
        }),
      ),
    ),
  ];
  const fieldErrors = validateValues(values, uploadedImagePaths.length > 0);

  if (uploadedImagePaths.length !== input.imagePaths.length) {
    fieldErrors.imagePath = "Une image envoyee n'est pas valide.";
  }

  if (input.mode === "create" && input.intent === "archive") {
    fieldErrors.intent = "Un nouvel article ne peut pas etre archive directement.";
  }

  await requireAdmin("fr");
  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");

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
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(values, "Impossible d'enregistrer l'article.");
  }

  const currentArticleData = (currentArticle?.data as CurrentArticleRow | null) ?? null;
  if (input.mode === "update" && !currentArticleData) {
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(values, "Article introuvable.");
  }

  let existingImages: ExistingNewsImage[] = [];
  if (input.mode === "update" && input.articleId) {
    const { data: currentImages, error: currentImagesError } = await supabase
      .from("news_article_images")
      .select("id,image_path,alt_fr,alt_en,sort_order,is_cover,is_active")
      .eq("news_article_id", input.articleId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (currentImagesError) {
      console.error("[admin-news] Current images load failed:", currentImagesError.message);
      await cleanupUploadedNewsImages(uploadedImagePaths);
      return createFormError(values, "Impossible d'enregistrer l'article.");
    }

    existingImages = (currentImages ?? []) as ExistingNewsImage[];
  }

  const uniqueDeletedImageIds = [...new Set(input.deletedImageIds)];
  const imagesToDelete =
    input.mode === "update"
      ? existingImages.filter((image) => uniqueDeletedImageIds.includes(image.id))
      : [];
  const deletedImageIdSet = new Set(imagesToDelete.map((image) => image.id));
  const remainingExistingImages = existingImages.filter((image) => !deletedImageIdSet.has(image.id));
  const remainingActiveExistingImages = remainingExistingImages.filter((image) => image.is_active);
  const existingActiveCount = existingImages.filter((image) => image.is_active).length;
  const deletedActiveCount = imagesToDelete.filter((image) => image.is_active).length;
  const totalImages = remainingExistingImages.length + uploadedImagePaths.length;
  const totalActiveImages = existingActiveCount - deletedActiveCount + uploadedImagePaths.length;

  if (totalImages > MAX_NEWS_IMAGES) {
    fieldErrors.imagePath = "Un article peut contenir au maximum 15 images.";
  }

  if (totalActiveImages === 0) {
    fieldErrors.imagePath = "Ajoutez au moins une image.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(values, "Veuillez corriger les champs signales.", fieldErrors);
  }

  const { data: categoryData, error: categoryError } = await supabase
    .from("news_categories")
    .select("id,is_active")
    .eq("id", values.categoryId)
    .maybeSingle();

  if (categoryError) {
    console.error("[admin-news] Unable to verify category:", categoryError.message);
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(values, "Impossible d'enregistrer l'article.");
  }

  const category = categoryData as CategoryAccessRow | null;
  if (!category) {
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(values, "Veuillez choisir une categorie valide.", {
      categoryId: "Cette categorie n'existe pas.",
    });
  }

  const keepsInactiveCategory =
    input.mode === "update" &&
    currentArticleData?.category_id === values.categoryId &&
    category.is_active === false;

  if (!category.is_active && !keepsInactiveCategory) {
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(values, "Veuillez choisir une categorie active.", {
      categoryId: "Cette categorie est inactive.",
    });
  }

  let code = currentArticleData?.code ?? values.code;
  if (input.mode === "create") {
    try {
      code = await generateUniqueCode(supabase, "news_articles", values.titleFr, "article");
    } catch (error) {
      console.error("[admin-news] Unable to generate code:", error instanceof Error ? error.message : "Unknown error");
      await cleanupUploadedNewsImages(uploadedImagePaths);
      return createFormError(values, "Impossible d'enregistrer l'article.");
    }
  }

  const publication = getPublicationFields(input, currentArticleData);
  if ("error" in publication) {
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(values, "Veuillez corriger les champs signales.", publication.error);
  }

  const generatedAlt = generateNewsImageAlt({ titleFr: values.titleFr, titleEn: values.titleEn });
  const imageAltFr =
    values.imageAltFr ||
    (uploadedImagePaths.length > 0 ? generatedAlt.fr : currentArticleData?.image_alt_fr) ||
    generatedAlt.fr;
  const imageAltEn =
    values.imageAltEn ||
    (uploadedImagePaths.length > 0 ? generatedAlt.en : currentArticleData?.image_alt_en) ||
    generatedAlt.en;
  const initialImagePath =
    uploadedImagePaths[0] ||
    remainingActiveExistingImages.find((image) => image.is_cover)?.image_path ||
    remainingActiveExistingImages[0]?.image_path ||
    currentArticleData?.image_path ||
    values.imagePath;

  const payload = {
    code,
    category_id: values.categoryId,
    title_fr: values.titleFr,
    title_en: values.titleEn,
    excerpt_fr: values.excerptFr,
    excerpt_en: values.excerptEn,
    content_fr: values.contentFr,
    content_en: values.contentEn,
    image_path: initialImagePath,
    image_alt_fr: imageAltFr,
    image_alt_en: imageAltEn,
    status: publication.status,
    published_at: publication.published_at,
  };

  const result =
    input.mode === "create"
      ? await supabase.from("news_articles").insert(payload).select("id").single()
      : await supabase.from("news_articles").update(payload).eq("id", input.articleId).select("id").single();

  if (result.error || !result.data) {
    console.error("[admin-news] Save failed:", result.error?.message ?? "No row returned");
    await cleanupUploadedNewsImages(uploadedImagePaths);
    return createFormError(
      values,
      result.error?.code === "42501"
        ? "Votre session a expire. Veuillez vous reconnecter."
        : "Impossible d'enregistrer l'article.",
    );
  }

  const articleId = (result.data as { id: string }).id;
  const requestedExistingCoverId = values.coverImageValue.startsWith("existing:")
    ? values.coverImageValue.replace("existing:", "")
    : "";
  const usableExistingCoverId =
    requestedExistingCoverId &&
    remainingActiveExistingImages.some((image) => image.id === requestedExistingCoverId)
      ? requestedExistingCoverId
      : "";
  const requestedPendingCoverIndex = values.coverImageValue.startsWith("pending:")
    ? Number(values.coverImageValue.replace("pending:", ""))
    : -1;
  const hasActiveCover = remainingActiveExistingImages.some((image) => image.is_cover);
  const pendingCoverIndex =
    requestedPendingCoverIndex >= 0 && requestedPendingCoverIndex < uploadedImagePaths.length
      ? requestedPendingCoverIndex
      : !usableExistingCoverId && !hasActiveCover && uploadedImagePaths.length > 0
        ? 0
        : -1;
  const uploadedImageIds: string[] = [];

  if (usableExistingCoverId) {
    await supabase
      .from("news_article_images")
      .update({ is_cover: false })
      .eq("news_article_id", articleId)
      .eq("is_cover", true);
    const coverSave = await supabase
      .from("news_article_images")
      .update({ is_cover: true, is_active: true })
      .eq("id", usableExistingCoverId)
      .eq("news_article_id", articleId);

    if (coverSave.error) {
      return createFormError(values, "Impossible de definir l'image de couverture.");
    }
  }

  if (pendingCoverIndex >= 0) {
    await supabase
      .from("news_article_images")
      .update({ is_cover: false })
      .eq("news_article_id", articleId)
      .eq("is_cover", true);
  }

  for (const [index, imagePath] of uploadedImagePaths.entries()) {
    const imageNumber = remainingActiveExistingImages.length + index + 1;
    const imageSave = await supabase
      .from("news_article_images")
      .insert({
        news_article_id: articleId,
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
      console.error("[admin-news] Image save failed:", imageSave.error.message);
      await cleanupUploadedNewsImages(uploadedImagePaths.slice(index));
      return createFormError(values, "L'article est enregistre, mais une image optimisee n'a pas ete ajoutee.");
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
      await supabase
        .from("news_article_images")
        .update({ is_cover: false })
        .eq("news_article_id", articleId)
        .eq("is_cover", true);
      const fallbackCover = await supabase
        .from("news_article_images")
        .update({ is_cover: true, is_active: true })
        .eq("id", fallbackCoverId)
        .eq("news_article_id", articleId);

      if (fallbackCover.error) {
        console.error("[admin-news] Fallback cover save failed:", fallbackCover.error.message);
        return createFormError(values, "Impossible de definir l'image de couverture.");
      }
    }
  }

  if (imagesToDelete.length > 0) {
    const storagePaths = imagesToDelete
      .map((image) => getNewsStoragePath(image.image_path))
      .filter((path): path is string => Boolean(path));

    if (storagePaths.length > 0) {
      const { error: storageError } = await supabaseClient.storage.from("site-news").remove(storagePaths);

      if (storageError) {
        console.error("[admin-news] Storage image deletion failed:", {
          articleId,
          imageIds: imagesToDelete.map((image) => image.id),
          paths: storagePaths,
          message: storageError.message,
        });
        return createFormError(values, "L'article a ete mis a jour, mais certaines anciennes images n'ont pas pu etre supprimees.");
      }
    }

    const deleteRows = await supabase
      .from("news_article_images")
      .delete()
      .eq("news_article_id", articleId)
      .in("id", imagesToDelete.map((image) => image.id));

    if (deleteRows.error) {
      console.error("[admin-news] Image row deletion failed:", {
        articleId,
        imageIds: imagesToDelete.map((image) => image.id),
        message: deleteRows.error.message,
      });
      return createFormError(values, "L'article a ete mis a jour, mais certaines anciennes images n'ont pas pu etre supprimees.");
    }
  }

  const synced = await syncNewsCover({
    supabase,
    articleId,
    fallbackAltFr: generatedAlt.fr,
    fallbackAltEn: generatedAlt.en,
  });

  if (!synced) {
    return createFormError(values, "L'article est enregistre, mais l'image de couverture n'a pas pu etre synchronisee.");
  }

  return { ok: true };
}
