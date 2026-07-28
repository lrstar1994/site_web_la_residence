"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRestaurantCategoryAction } from "@/app/[locale]/admin/(protected)/restaurant/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { AdminRestaurantCategory } from "@/lib/admin/restaurant/admin-restaurant-types";

type Filters = { query: string; state: "all" | "active" | "inactive"; sort: "order" | "updated" | "name_asc" | "name_desc" };
const initialFilters: Filters = { query: "", state: "all", sort: "order" };

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(value));
}

export function AdminRestaurantCategoriesExplorer({ categories }: { categories: AdminRestaurantCategory[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [toggle, setToggle] = useState<{ category: AdminRestaurantCategory; nextActive: boolean } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = normalize(filters.query);
    return categories
      .filter((category) => {
        const searchable = normalize(`${category.nameFr} ${category.nameEn} ${category.code}`);
        return (!query || searchable.includes(query)) && (filters.state === "all" || (filters.state === "active" && category.isActive) || (filters.state === "inactive" && !category.isActive));
      })
      .sort((a, b) => {
        if (filters.sort === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (filters.sort === "name_asc") return a.nameFr.localeCompare(b.nameFr, "fr-FR");
        if (filters.sort === "name_desc") return b.nameFr.localeCompare(a.nameFr, "fr-FR");
        return a.sortOrder - b.sortOrder || a.nameFr.localeCompare(b.nameFr, "fr-FR");
      });
  }, [categories, filters]);

  function confirmToggle() {
    if (!toggle) return;
    startTransition(async () => {
      const result = await toggleRestaurantCategoryAction(toggle.category.id, toggle.nextActive);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      setToggle(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      {message ? <section className={`admin-status-message ${message.tone}`} role="status" aria-live="polite">{message.text}</section> : null}
      <section className="admin-news-filters" aria-label="Filtres des catégories">
        <label><span>Recherche</span><input value={filters.query} placeholder="Rechercher par nom..." onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} /></label>
        <label><span>État</span><select value={filters.state} onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value as Filters["state"] }))}><option value="all">Toutes</option><option value="active">Actives</option><option value="inactive">Inactives</option></select></label>
        <label><span>Tri</span><select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as Filters["sort"] }))}><option value="order">Ordre d&apos;affichage</option><option value="updated">Dernière modification</option><option value="name_asc">Nom A-Z</option><option value="name_desc">Nom Z-A</option></select></label>
        {JSON.stringify(filters) !== JSON.stringify(initialFilters) ? <button className="admin-news-reset" type="button" onClick={() => setFilters(initialFilters)}>Réinitialiser</button> : null}
      </section>
      <section className="admin-news-table-card" aria-label="Liste des catégories">
        <table className="admin-news-table">
          <thead><tr><th scope="col">Catégorie</th><th scope="col">État</th><th scope="col">Utilisée par</th><th scope="col">Dernière modification</th><th scope="col">Actions</th></tr></thead>
          <tbody>{filtered.map((category) => <tr key={category.id}><td data-label="Catégorie"><p className="admin-news-title">{category.nameFr}</p><span className="admin-news-code">{category.nameEn}</span></td><td data-label="État"><span className={`admin-news-status ${category.isActive ? "published" : "draft"}`}>{category.isActive ? "Actif" : "Inactif"}</span></td><td data-label="Utilisée par">{category.usageCount} carte{category.usageCount > 1 ? "s" : ""}</td><td data-label="Dernière modification">{formatDate(category.updatedAt)}</td><td data-label="Actions"><div className="admin-news-actions"><Link className="admin-news-action" href={`/fr/admin/restaurant/categories/${category.id}/modifier`}>Modifier</Link><button className={`admin-news-action ${category.isActive ? "danger" : ""}`} type="button" aria-haspopup="dialog" onClick={() => setToggle({ category, nextActive: !category.isActive })}>{category.isActive ? "Désactiver" : "Activer"}</button></div></td></tr>)}</tbody>
        </table>
      </section>
      {toggle ? <AdminConfirmDialog title={toggle.nextActive ? "Activer cette catégorie ?" : "Désactiver cette catégorie ?"} description={toggle.nextActive ? "Les cartes associées pourront être visibles sur le site public." : "Les cartes associées ne seront plus visibles sur le site public tant que la catégorie restera inactive."} confirmLabel={toggle.nextActive ? "Confirmer l'activation" : "Confirmer la désactivation"} cancelLabel="Annuler" variant={toggle.nextActive ? "default" : "danger"} pending={isPending} pendingLabel={toggle.nextActive ? "Activation..." : "Désactivation..."} onConfirm={confirmToggle} onCancel={() => { if (!isPending) setToggle(null); }} /> : null}
    </>
  );
}
