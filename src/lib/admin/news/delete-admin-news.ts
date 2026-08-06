import "server-only";

import { getNewsStoragePath } from "@/lib/admin/news/get-news-storage-path";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteAdminNewsArticleResult = {
  ok: boolean;
  message: string;
};

type NewsArticleDeleteRow = {
  id: string;
  code: string;
  title_fr: string;
  image_path: string;
};

type NewsArticleImageDeleteRow = {
  id: string;
  image_path: string;
};

export async function deleteAdminNewsArticle(
  articleId: string,
): Promise<DeleteAdminNewsArticleResult> {
  await requireAdmin("fr");

  if (!isValidUuid(articleId)) {
    return { ok: false, message: "Cet article n'existe plus." };
  }

  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");

  const { data: article, error: articleError } = await supabase
    .from("news_articles")
    .select("id,code,title_fr,image_path")
    .eq("id", articleId)
    .maybeSingle();

  if (articleError) {
    console.error("[admin-news-delete] Article load failed:", {
      articleId,
      message: articleError.message,
    });
    return { ok: false, message: "Impossible de supprimer cet article." };
  }

  if (!article) {
    return { ok: false, message: "Cet article n'existe plus." };
  }

  const row = article as NewsArticleDeleteRow;
  const { data: images, error: imagesError } = await supabase
    .from("news_article_images")
    .select("id,image_path")
    .eq("news_article_id", articleId);

  if (imagesError) {
    console.error("[admin-news-delete] Image rows load failed:", {
      articleId,
      message: imagesError.message,
    });
    return { ok: false, message: "Impossible de supprimer les images de cet article." };
  }

  const imageRows = (images ?? []) as NewsArticleImageDeleteRow[];
  const storagePaths = [
    ...new Set(
      imageRows
        .map((image) => getNewsStoragePath(image.image_path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  const legacyStoragePath = getNewsStoragePath(row.image_path);

  if (
    legacyStoragePath &&
    !storagePaths.includes(legacyStoragePath) &&
    imageRows.length === 0
  ) {
    storagePaths.push(legacyStoragePath);
  }

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabaseClient.storage
      .from("site-news")
      .remove(storagePaths);

    if (storageError) {
      console.error("[admin-news-delete] Storage deletion failed:", {
        articleId,
        paths: storagePaths,
        message: storageError.message,
      });
      return { ok: false, message: "Impossible de supprimer les fichiers associes a cet article." };
    }
  }

  if (imageRows.length > 0) {
    const { error: deleteImagesError } = await supabase
      .from("news_article_images")
      .delete()
      .eq("news_article_id", articleId)
      .in("id", imageRows.map((image) => image.id));

    if (deleteImagesError) {
      console.error("[admin-news-delete] Image row deletion failed:", {
        articleId,
        imageIds: imageRows.map((image) => image.id),
        paths: storagePaths,
        message: deleteImagesError.message,
      });
      return {
        ok: false,
        message: "Les fichiers ont ete supprimes, mais les references des images n'ont pas pu etre supprimees.",
      };
    }
  }

  const { error: deleteArticleError } = await supabase
    .from("news_articles")
    .delete()
    .eq("id", articleId);

  if (deleteArticleError) {
    console.error("[admin-news-delete] Article row deletion failed:", {
      articleId,
      paths: storagePaths,
      message: deleteArticleError.message,
    });
    return { ok: false, message: "Les images ont ete supprimees, mais l'article n'a pas pu etre supprime." };
  }

  return { ok: true, message: "L'article a ete supprime definitivement." };
}
