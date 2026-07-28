import "server-only";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AdminNewsQuickAction =
  | "publish_now"
  | "archive"
  | "cancel_schedule"
  | "republish";

export type AdminNewsQuickActionResult = {
  ok: boolean;
  message: string;
};

type ArticleStatus = "draft" | "published" | "archived";

type QuickArticleRow = {
  id: string;
  title_fr: string;
  title_en: string;
  excerpt_fr: string;
  excerpt_en: string;
  content_fr: string;
  content_en: string;
  image_path: string;
  image_alt_fr: string;
  image_alt_en: string;
  status: ArticleStatus;
  published_at: string | null;
  category_id: string;
  category: { id: string; is_active: boolean } | { id: string; is_active: boolean }[] | null;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function isScheduled(article: QuickArticleRow) {
  return (
    article.status === "published" &&
    article.published_at !== null &&
    new Date(article.published_at).getTime() > Date.now()
  );
}

function isPublishable(article: QuickArticleRow) {
  const category = normalizeRelation(article.category);

  return Boolean(
    article.title_fr.trim() &&
      article.title_en.trim() &&
      article.excerpt_fr.trim() &&
      article.excerpt_en.trim() &&
      article.content_fr.trim() &&
      article.content_en.trim() &&
      article.image_path.trim() &&
      article.image_alt_fr.trim() &&
      article.image_alt_en.trim() &&
      article.category_id &&
      category?.is_active,
  );
}

function getPublishValidationMessage(article: QuickArticleRow) {
  const category = normalizeRelation(article.category);

  if (!category?.is_active) {
    return "Impossible de publier cet article : sa catégorie est inactive.";
  }

  if (!isPublishable(article)) {
    return "Impossible de publier cet article. Vérifiez que tous les champs obligatoires sont complets.";
  }

  return null;
}

function getTransition(
  article: QuickArticleRow,
  action: AdminNewsQuickAction,
):
  | {
      allowed: true;
      payload: { status: ArticleStatus; published_at: string | null };
      message: string;
    }
  | {
      allowed: false;
      message: string;
    } {
  const unavailable = "Cette action n'est pas disponible pour le statut actuel de l'article.";

  if (action === "publish_now") {
    if (article.status !== "draft") {
      return { allowed: false, message: unavailable };
    }

    const validationMessage = getPublishValidationMessage(article);

    if (validationMessage) {
      return { allowed: false, message: validationMessage };
    }

    return {
      allowed: true,
      payload: { status: "published", published_at: new Date().toISOString() },
      message: "Article publié avec succès.",
    };
  }

  if (action === "archive") {
    if (article.status === "archived") {
      return { allowed: false, message: unavailable };
    }

    return {
      allowed: true,
      payload: { status: "archived", published_at: article.published_at },
      message: "Article archivé avec succès.",
    };
  }

  if (action === "cancel_schedule") {
    if (!isScheduled(article)) {
      return { allowed: false, message: unavailable };
    }

    return {
      allowed: true,
      payload: { status: "draft", published_at: null },
      message: "Programmation annulée. L'article est revenu en brouillon.",
    };
  }

  if (article.status !== "archived") {
    return { allowed: false, message: unavailable };
  }

  const validationMessage = getPublishValidationMessage(article);

  if (validationMessage) {
    return { allowed: false, message: validationMessage };
  }

  return {
    allowed: true,
    payload: { status: "published", published_at: new Date().toISOString() },
    message: "Article republié avec succès.",
  };
}

export async function updateNewsQuickStatus(
  articleId: string,
  action: AdminNewsQuickAction,
): Promise<AdminNewsQuickActionResult> {
  if (!uuidPattern.test(articleId)) {
    return {
      ok: false,
      message: "Impossible d'effectuer cette action.",
    };
  }

  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { data, error } = await supabase
    .from("news_articles")
    .select(
      [
        "id",
        "title_fr",
        "title_en",
        "excerpt_fr",
        "excerpt_en",
        "content_fr",
        "content_en",
        "image_path",
        "image_alt_fr",
        "image_alt_en",
        "status",
        "published_at",
        "category_id",
        "category:category_id(id,is_active)",
      ].join(","),
    )
    .eq("id", articleId)
    .maybeSingle();

  if (error) {
    console.error("[admin-news] Quick action load failed:", error.message);
    return {
      ok: false,
      message: "Impossible d'effectuer cette action.",
    };
  }

  const article = data as QuickArticleRow | null;

  if (!article) {
    return {
      ok: false,
      message: "Cette action n'est pas disponible pour cet article.",
    };
  }

  const transition = getTransition(article, action);

  if (!transition.allowed) {
    return {
      ok: false,
      message: transition.message,
    };
  }

  const { error: updateError } = await supabase
    .from("news_articles")
    .update(transition.payload)
    .eq("id", articleId);

  if (updateError) {
    console.error("[admin-news] Quick action update failed:", updateError.message);
    return {
      ok: false,
      message:
        updateError.code === "42501"
          ? "Votre session a expiré. Veuillez vous reconnecter."
          : "Impossible d'effectuer cette action.",
    };
  }

  return {
    ok: true,
    message: transition.message,
  };
}
