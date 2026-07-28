import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envPath = resolve(root, ".env.local");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

function fail(message, details) {
  console.error(`Supabase news check failed: ${message}`);

  if (details) {
    console.error(details);
  }

  process.exit(1);
}

loadEnvFile(envPath);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  fail("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const site = supabase.schema("site");

const expectedCategoryCodes = [
  "event",
  "restaurant",
  "venues",
  "accommodation",
  "offers",
];

const expectedArticleCodes = ["brunch", "restaurant-menu", "seminar"];

const { data: categories, error: categoriesError } = await site
  .from("news_categories")
  .select("code,name_fr,name_en,is_active,sort_order")
  .eq("is_active", true)
  .order("sort_order", { ascending: true });

if (categoriesError) {
  fail(
    "cannot read site.news_categories with the anon key. Check migration, RLS and exposed schemas.",
    categoriesError.message,
  );
}

const { data: articles, error: articlesError } = await site
  .from("news_articles")
  .select(
    "code,title_fr,title_en,image_path,status,published_at,category:category_id(code,name_fr,name_en)",
  )
  .eq("status", "published")
  .lte("published_at", new Date().toISOString())
  .order("published_at", { ascending: false });

if (articlesError) {
  fail(
    "cannot read site.news_articles with the anon key. Check migration, RLS and exposed schemas.",
    articlesError.message,
  );
}

const categoryCodes = new Set((categories ?? []).map((category) => category.code));
const articleCodes = new Set((articles ?? []).map((article) => article.code));

for (const code of expectedCategoryCodes) {
  if (!categoryCodes.has(code)) {
    fail(`missing active category: ${code}`);
  }
}

for (const code of expectedArticleCodes) {
  if (!articleCodes.has(code)) {
    fail(`missing published article: ${code}`);
  }
}

const inactiveCategories = (categories ?? []).filter((category) => !category.is_active);
const nonPublishedArticles = (articles ?? []).filter(
  (article) =>
    article.status !== "published" ||
    !article.published_at ||
    new Date(article.published_at).getTime() > Date.now(),
);

if (inactiveCategories.length > 0) {
  fail("anon query returned inactive categories.");
}

if (nonPublishedArticles.length > 0) {
  fail("anon query returned non-public articles.");
}

console.log(`${categories.length} catégories actives`);
console.log(`${articles.length} articles publiés`);
console.log("Supabase news check passed with the anon key.");
