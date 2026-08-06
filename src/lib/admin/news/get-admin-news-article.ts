import "server-only";

import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import type { AdminNewsArticle, AdminNewsCategory } from "@/lib/admin/news/admin-news-types";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import {
  getAdminNews,
  mapAdminNewsArticle,
} from "@/lib/admin/news/get-admin-news";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AdminNewsArticleResult =
  | {
      ok: true;
      categories: AdminNewsCategory[];
      article: AdminNewsArticle;
    }
  | {
      ok: false;
      categories: AdminNewsCategory[];
      article: null;
      error: "not_found" | "unavailable";
    };

export async function getAdminNewsArticle(
  articleId: string,
): Promise<AdminNewsArticleResult> {
  if (!isValidUuid(articleId)) {
    return {
      ok: false,
      categories: [],
      article: null,
      error: "not_found",
    };
  }

  try {
    await ensureAdminReadContext();
    const news = await getAdminNews();
    const categories = news.categories;

    if (!news.ok) {
      return {
        ok: false,
        categories,
        article: null,
        error: "unavailable",
      };
    }

    const supabase = (await getSupabaseServerClient()).schema("site");
    const { data, error } = await supabase
      .from("news_articles")
      .select(
        [
          "id",
          "code",
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
          "created_at",
          "updated_at",
          "category_id",
          "category:category_id(id,code,name_fr,name_en,sort_order,is_active)",
        ].join(","),
      )
      .eq("id", articleId)
      .maybeSingle();

    if (error) {
      console.error("[admin-news] Unable to load article:", error.message);
      return {
        ok: false,
        categories,
        article: null,
        error: "unavailable",
      };
    }

    if (data) {
      const { data: imagesData, error: imagesError } = await supabase
        .from("news_article_images")
        .select("id,news_article_id,image_path,alt_fr,alt_en,sort_order,is_cover,is_active")
        .eq("news_article_id", articleId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (imagesError) {
        console.error("[admin-news] Unable to load article images:", imagesError.message);
      }

      return {
        ok: true,
        categories,
        article: mapAdminNewsArticle(
          data as unknown as Parameters<typeof mapAdminNewsArticle>[0],
          (imagesData ?? []) as unknown as Parameters<typeof mapAdminNewsArticle>[1],
        ),
      };
    }

    return {
      ok: false,
      categories,
      article: null,
      error: "not_found",
    };
  } catch (error) {
    console.error(
      "[admin-news] Article loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      ok: false,
      categories: [],
      article: null,
      error: "unavailable",
    };
  }
}
