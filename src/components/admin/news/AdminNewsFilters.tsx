import type { AdminNewsCategory } from "@/lib/admin/news/admin-news-types";

export type AdminNewsStatusFilter =
  | "all"
  | "published"
  | "draft"
  | "archived"
  | "scheduled";

export type AdminNewsSort = "updated" | "published_desc" | "published_asc" | "title_asc" | "title_desc";

export type AdminNewsFiltersState = {
  query: string;
  status: AdminNewsStatusFilter;
  category: string;
  sort: AdminNewsSort;
};

type AdminNewsFiltersProps = {
  filters: AdminNewsFiltersState;
  categories: AdminNewsCategory[];
  hasActiveFilters: boolean;
  onChange: (filters: AdminNewsFiltersState) => void;
  onReset: () => void;
};

export function AdminNewsFilters({
  filters,
  categories,
  hasActiveFilters,
  onChange,
  onReset,
}: AdminNewsFiltersProps) {
  function updateFilters(nextFilters: Partial<AdminNewsFiltersState>) {
    onChange({ ...filters, ...nextFilters });
  }

  return (
    <section className="admin-news-filters" aria-label="Filtres des articles">
      <label>
        <span>Recherche</span>
        <input
          type="search"
          placeholder="Rechercher par titre ou code…"
          value={filters.query}
          onChange={(event) => updateFilters({ query: event.target.value })}
        />
      </label>
      <label>
        <span>Statut</span>
        <select
          value={filters.status}
          onChange={(event) =>
            updateFilters({ status: event.target.value as AdminNewsStatusFilter })
          }
        >
          <option value="all">Tous les statuts</option>
          <option value="published">Publié</option>
          <option value="draft">Brouillon</option>
          <option value="archived">Archivé</option>
          <option value="scheduled">Programmé</option>
        </select>
      </label>
      <label>
        <span>Catégorie</span>
        <select
          value={filters.category}
          onChange={(event) => updateFilters({ category: event.target.value })}
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((category) => (
            <option value={category.code} key={category.id}>
              {category.nameFr}
              {category.isActive ? "" : " — inactive"}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Tri</span>
        <select
          value={filters.sort}
          onChange={(event) => updateFilters({ sort: event.target.value as AdminNewsSort })}
        >
          <option value="updated">Dernière modification</option>
          <option value="published_desc">Date de publication récente</option>
          <option value="published_asc">Date de publication ancienne</option>
          <option value="title_asc">Titre A–Z</option>
          <option value="title_desc">Titre Z–A</option>
        </select>
      </label>
      {hasActiveFilters ? (
        <button className="admin-news-reset" type="button" onClick={onReset}>
          Réinitialiser
        </button>
      ) : null}
    </section>
  );
}
