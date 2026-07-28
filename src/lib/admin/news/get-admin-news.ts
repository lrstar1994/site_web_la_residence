import "server-only";

import type {
  AdminNewsArticle,
  AdminNewsCategory,
  AdminNewsStatus,
} from "@/lib/admin/news/admin-news-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminNewsResult =
  | {
      ok: true;
      categories: AdminNewsCategory[];
      articles: AdminNewsArticle[];
    }
  | {
      ok: false;
      categories: AdminNewsCategory[];
      articles: AdminNewsArticle[];
      error: string;
    };

type AdminNewsCategoryRow = {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
};

type AdminNewsArticleRow = {
  id: string;
  code: string;
  title_fr: string;
  title_en: string;
  excerpt_fr: string;
  excerpt_en: string;
  content_fr: string;
  content_en: string;
  image_path: string;
  image_alt_fr: string;
  image_alt_en: string;
  status: AdminNewsStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string;
  category: AdminNewsCategoryRow | AdminNewsCategoryRow[] | null;
};

function normalizeRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

export function mapAdminNewsCategory(row: AdminNewsCategoryRow): AdminNewsCategory {
  return {
    id: row.id,
    code: row.code,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export function mapAdminNewsArticle(row: AdminNewsArticleRow): AdminNewsArticle {
  const category = normalizeRelation(row.category);

  return {
    id: row.id,
    code: row.code,
    titleFr: row.title_fr,
    titleEn: row.title_en,
    excerptFr: row.excerpt_fr,
    excerptEn: row.excerpt_en,
    contentFr: row.content_fr,
    contentEn: row.content_en,
    imagePath: row.image_path,
    imageAltFr: row.image_alt_fr,
    imageAltEn: row.image_alt_en,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    categoryId: row.category_id,
    category: category ? mapAdminNewsCategory(category) : null,
  };
}

export async function getAdminNews(): Promise<AdminNewsResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("news_categories")
      .select("id,code,name_fr,name_en,sort_order,is_active")
      .order("sort_order", { ascending: true });

    if (categoriesError) {
      console.error("[admin-news] Unable to load categories:", categoriesError.message);
      return {
        ok: false,
        categories: [],
        articles: [],
        error: "categories_unavailable",
      };
    }

    const { data: articlesData, error: articlesError } = await supabase
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
      .order("updated_at", { ascending: false });

    const categories = (
      (categoriesData ?? []) as unknown as AdminNewsCategoryRow[]
    ).map(mapAdminNewsCategory);

    if (articlesError) {
      console.error("[admin-news] Unable to load articles:", articlesError.message);
      return {
        ok: false,
        categories,
        articles: [],
        error: "articles_unavailable",
      };
    }

    return {
      ok: true,
      categories,
      articles: ((articlesData ?? []) as unknown as AdminNewsArticleRow[]).map(
        mapAdminNewsArticle,
      ),
    };
  } catch (error) {
    console.error(
      "[admin-news] Loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      ok: false,
      categories: [],
      articles: [],
      error: "supabase_unavailable",
    };
  }
}
