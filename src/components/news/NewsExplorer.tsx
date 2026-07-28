"use client";

import { useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { NewsCard } from "@/components/news/NewsCard";
import { NewsFilters } from "@/components/news/NewsFilters";
import type { NewsFiltersState } from "@/components/news/NewsFilters";
import { NewsModal } from "@/components/news/NewsModal";
import type { NewsArticle, NewsCategoryItem } from "@/data/news";
import type { Locale } from "@/lib/i18n/routing";

type NewsExplorerProps = {
  articles: NewsArticle[];
  categories: NewsCategoryItem[];
  locale: Locale;
};

const initialFilters: NewsFiltersState = {
  category: "all",
  year: "all",
  month: "all",
  query: "",
  sort: "newest",
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function getDateParts(dateValue: string) {
  const date = new Date(dateValue);
  return {
    year: String(date.getUTCFullYear()),
    month: String(date.getUTCMonth() + 1),
  };
}

function getTimestamp(dateValue: string) {
  return new Date(dateValue).getTime();
}

function formatArticleDate(dateValue: string, locale: Locale) {
  const date = new Date(dateValue);

  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function NewsExplorer({ articles, categories, locale }: NewsExplorerProps) {
  const t = useTranslations("newsPage");
  const [filters, setFilters] = useState<NewsFiltersState>(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(
    null,
  );

  const categoryLabels = useMemo<Record<string, string>>(() => {
    return categories.reduce<Record<string, string>>((labels, category) => {
      labels[category.code] = category.name[locale];
      return labels;
    }, {});
  }, [categories, locale]);

  const categoryCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {
      all: articles.length,
    };

    categories.forEach((category) => {
      counts[category.code] = 0;
    });

    articles.forEach((article) => {
      counts[article.category] = (counts[article.category] ?? 0) + 1;
    });

    return counts;
  }, [articles, categories]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(filters.query);

    return articles
      .filter((article) => {
        const { year, month } = getDateParts(article.publishedAt);
        const categoryLabel =
          categoryLabels[article.category] ?? article.categoryLabel?.[locale] ?? "";
        const searchable = normalizeSearchValue(
          `${article.title[locale]} ${article.excerpt[locale]} ${categoryLabel}`,
        );

        return (
          (filters.category === "all" || article.category === filters.category) &&
          (filters.year === "all" || year === filters.year) &&
          (filters.month === "all" || month === filters.month) &&
          (!normalizedQuery || searchable.includes(normalizedQuery))
        );
      })
      .sort((left, right) => {
        const leftDate = getTimestamp(left.publishedAt);
        const rightDate = getTimestamp(right.publishedAt);

        return filters.sort === "newest" ? rightDate - leftDate : leftDate - rightDate;
      });
  }, [articles, categoryLabels, filters, locale]);

  const selectedArticle =
    articles.find((article) => article.id === selectedId) ?? null;

  const monthLabels = useMemo(
    () => [
      t("filters.months.january"),
      t("filters.months.february"),
      t("filters.months.march"),
      t("filters.months.april"),
      t("filters.months.may"),
      t("filters.months.june"),
      t("filters.months.july"),
      t("filters.months.august"),
      t("filters.months.september"),
      t("filters.months.october"),
      t("filters.months.november"),
      t("filters.months.december"),
    ],
    [t],
  );

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];

    if (filters.category !== "all") {
      labels.push(categoryLabels[filters.category] ?? filters.category);
    }

    if (filters.year !== "all") {
      labels.push(filters.year);
    }

    if (filters.month !== "all") {
      labels.push(monthLabels[Number(filters.month) - 1]);
    }

    if (filters.query.trim()) {
      labels.push(filters.query.trim());
    }

    if (filters.sort === "oldest") {
      labels.push(t("filters.sort.oldest"));
    }

    return labels;
  }, [categoryLabels, filters, monthLabels, t]);

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.year !== "all" ||
    filters.month !== "all" ||
    filters.query.trim().length > 0 ||
    filters.sort !== "newest";

  const handleOpen = useCallback((articleId: string, trigger: HTMLButtonElement) => {
    setTriggerElement(trigger);
    setSelectedId(articleId);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedId(null);
    triggerElement?.focus();
    setTriggerElement(null);
  }, [triggerElement]);

  return (
    <>
      <NewsFilters
        locale={locale}
        filters={filters}
        categories={categories}
        categoryCounts={categoryCounts}
        activeFilterLabels={activeFilterLabels}
        hasActiveFilters={hasActiveFilters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        labels={{
          allCategory: t("categories.all"),
          categoriesLabel: t("filters.categories_label"),
          categoryWithCount: (label, count) =>
            t("filters.category_count", { label, count }),
          years: {
            label: t("filters.year_label"),
            all: t("filters.all_years"),
            options: ["2026", "2025"],
          },
          months: {
            label: t("filters.month_label"),
            all: t("filters.all_months"),
            options: monthLabels,
          },
          search: {
            label: t("filters.search_label"),
            placeholder: t("filters.search_placeholder"),
          },
          sort: {
            label: t("filters.sort_label"),
            newest: t("filters.sort.newest"),
            oldest: t("filters.sort.oldest"),
          },
          reset: t("filters.reset"),
          activePrefix: t("filters.active_prefix"),
          noActive: t("filters.no_active"),
        }}
      />

      <main className="news-feed-main" aria-labelledby="news-feed-title">
        <p className="section-label">{t("feed.label")}</p>
        <h2 id="news-feed-title">{t("feed.title")}</h2>

        {filteredArticles.length ? (
          <div className="articles-grid">
            {filteredArticles.map((article) => (
              <NewsCard
                key={article.id}
                article={article}
                locale={locale}
                categoryLabel={
                  categoryLabels[article.category] ??
                  article.categoryLabel?.[locale] ??
                  article.category
                }
                formattedDate={formatArticleDate(article.publishedAt, locale)}
                labels={{
                  readMore: t("card.read_more"),
                  readArticle: t("card.read_article", {
                    title: article.title[locale],
                  }),
                }}
                onOpen={handleOpen}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state" role="status" aria-live="polite">
            <h3>{t("empty.title")}</h3>
            <p>{t("empty.text")}</p>
          </div>
        )}
      </main>

      {selectedArticle ? (
        <NewsModal
          article={selectedArticle}
          locale={locale}
          categoryLabel={
            categoryLabels[selectedArticle.category] ??
            selectedArticle.categoryLabel?.[locale] ??
            selectedArticle.category
          }
          formattedDate={formatArticleDate(selectedArticle.publishedAt, locale)}
          labels={{
            close: t("modal.close"),
          }}
          onClose={handleClose}
        />
      ) : null}
    </>
  );
}
