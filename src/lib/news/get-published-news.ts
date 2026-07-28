import "server-only";

import type { NewsArticle, NewsCategoryItem } from "@/data/news";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type SiteNewsCategoryRow = {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
};

type SiteNewsArticleCategoryRow = {
  code: string;
  name_fr: string;
  name_en: string;
  sort_order: number;
  is_active: boolean;
};

type SiteNewsArticleRow = {
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
  published_at: string;
  category: SiteNewsArticleCategoryRow | SiteNewsArticleCategoryRow[] | null;
};

export type PublishedNewsResult =
  | {
      ok: true;
      categories: NewsCategoryItem[];
      articles: NewsArticle[];
    }
  | {
      ok: false;
      categories: NewsCategoryItem[];
      articles: NewsArticle[];
      error: string;
    };

function normalizeRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation;
}

function mapCategory(row: SiteNewsCategoryRow): NewsCategoryItem {
  return {
    code: row.code,
    name: {
      fr: row.name_fr,
      en: row.name_en,
    },
    sortOrder: row.sort_order,
  };
}

function mapArticle(row: SiteNewsArticleRow): NewsArticle | null {
  const category = normalizeRelation(row.category);

  if (!category || !category.is_active) {
    return null;
  }

  return {
    id: row.code,
    category: category.code,
    categoryLabel: {
      fr: category.name_fr,
      en: category.name_en,
    },
    title: {
      fr: row.title_fr,
      en: row.title_en,
    },
    excerpt: {
      fr: row.excerpt_fr,
      en: row.excerpt_en,
    },
    content: {
      fr: row.content_fr,
      en: row.content_en,
    },
    publishedAt: row.published_at,
    image: row.image_path,
    alt: {
      fr: row.image_alt_fr,
      en: row.image_alt_en,
    },
  };
}

export async function getPublishedNews(): Promise<PublishedNewsResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");
    const now = new Date().toISOString();

    const { data: categoriesData, error: categoriesError } = await supabase
      .from("news_categories")
      .select("id,code,name_fr,name_en,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (categoriesError) {
      console.error("[news] Unable to load active categories:", categoriesError.message);
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
          "published_at",
          "category:category_id(code,name_fr,name_en,sort_order,is_active)",
        ].join(","),
      )
      .eq("status", "published")
      .lte("published_at", now)
      .order("published_at", { ascending: false });

    if (articlesError) {
      console.error("[news] Unable to load published articles:", articlesError.message);
      return {
        ok: false,
        categories: ((categoriesData ?? []) as unknown as SiteNewsCategoryRow[]).map(
          mapCategory,
        ),
        articles: [],
        error: "articles_unavailable",
      };
    }

    const categories = ((categoriesData ?? []) as unknown as SiteNewsCategoryRow[]).map(
      mapCategory,
    );
    const articles = ((articlesData ?? []) as unknown as SiteNewsArticleRow[])
      .map((row) => mapArticle(row))
      .filter((article): article is NewsArticle => article !== null);

    return {
      ok: true,
      categories,
      articles,
    };
  } catch (error) {
    console.error(
      "[news] Supabase news loading failed:",
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
