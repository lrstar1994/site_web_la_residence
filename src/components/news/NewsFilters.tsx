"use client";

import type { NewsCategoryItem } from "@/data/news";
import type { Locale } from "@/lib/i18n/routing";

export type NewsSortOrder = "newest" | "oldest";

export type NewsFiltersState = {
  category: string;
  year: string;
  month: string;
  query: string;
  sort: NewsSortOrder;
};

type NewsFiltersProps = {
  locale: Locale;
  filters: NewsFiltersState;
  categories: NewsCategoryItem[];
  categoryCounts: Record<string, number>;
  activeFilterLabels: string[];
  hasActiveFilters: boolean;
  labels: {
    allCategory: string;
    categoriesLabel: string;
    categoryWithCount: (label: string, count: number) => string;
    years: {
      label: string;
      all: string;
      options: string[];
    };
    months: {
      label: string;
      all: string;
      options: string[];
    };
    search: {
      label: string;
      placeholder: string;
    };
    sort: {
      label: string;
      newest: string;
      oldest: string;
    };
    reset: string;
    activePrefix: string;
    noActive: string;
  };
  onChange: (filters: NewsFiltersState) => void;
  onReset: () => void;
};

export function NewsFilters({
  locale,
  filters,
  categories,
  categoryCounts,
  activeFilterLabels,
  hasActiveFilters,
  labels,
  onChange,
  onReset,
}: NewsFiltersProps) {
  function updateFilters(nextFilters: Partial<NewsFiltersState>) {
    onChange({ ...filters, ...nextFilters });
  }

  return (
    <section className="filters-bar" aria-label={labels.search.label}>
      <div className="filters-row">
        <div className="categories-wrapper" aria-label={labels.categoriesLabel}>
          <button
            type="button"
            className={filters.category === "all" ? "cat-pill active" : "cat-pill"}
            aria-pressed={filters.category === "all"}
            onClick={() => updateFilters({ category: "all" })}
          >
            {labels.categoryWithCount(labels.allCategory, categoryCounts.all ?? 0)}
          </button>

          {categories.map((category) => {
            return (
              <button
                key={category.code}
                type="button"
                className={
                  filters.category === category.code ? "cat-pill active" : "cat-pill"
                }
                aria-pressed={filters.category === category.code}
                onClick={() => updateFilters({ category: category.code })}
              >
                {labels.categoryWithCount(
                  category.name[locale],
                  categoryCounts[category.code] ?? 0,
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="advanced-filters">
        <label className="filter-control">
          <span>{labels.years.label}</span>
          <select
            value={filters.year}
            onChange={(event) => updateFilters({ year: event.target.value })}
          >
            <option value="all">{labels.years.all}</option>
            {labels.years.options.map((year) => (
              <option value={year} key={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-control">
          <span>{labels.months.label}</span>
          <select
            value={filters.month}
            onChange={(event) => updateFilters({ month: event.target.value })}
          >
            <option value="all">{labels.months.all}</option>
            {labels.months.options.map((month, index) => (
              <option value={String(index + 1)} key={month}>
                {month}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-control search-wrapper">
          <span>{labels.search.label}</span>
          <input
            type="search"
            value={filters.query}
            placeholder={labels.search.placeholder}
            onChange={(event) => updateFilters({ query: event.target.value })}
          />
        </label>

        <label className="filter-control">
          <span>{labels.sort.label}</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              updateFilters({ sort: event.target.value as NewsSortOrder })
            }
          >
            <option value="newest">{labels.sort.newest}</option>
            <option value="oldest">{labels.sort.oldest}</option>
          </select>
        </label>
      </div>

      <div className="filters-summary">
        <p className="active-filters-badge" aria-live="polite">
          {hasActiveFilters
            ? `${labels.activePrefix} ${activeFilterLabels.join(" · ")}`
            : labels.noActive}
        </p>
        {hasActiveFilters ? (
          <button className="btn-reset-filters" type="button" onClick={onReset}>
            {labels.reset}
          </button>
        ) : null}
      </div>
    </section>
  );
}
