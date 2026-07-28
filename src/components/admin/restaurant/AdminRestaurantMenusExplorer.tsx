"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRestaurantMenuAction } from "@/app/[locale]/admin/(protected)/restaurant/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { AdminRestaurantCategory, AdminRestaurantMenu } from "@/lib/admin/restaurant/admin-restaurant-types";

type Filters = {
  query: string;
  state: "all" | "active" | "inactive";
  category: string;
  sort: "order" | "updated" | "title_asc" | "title_desc";
};

const initialFilters: Filters = { query: "", state: "all", category: "all", sort: "order" };

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(value));
}

export function AdminRestaurantMenusExplorer({ menus, categories }: { menus: AdminRestaurantMenu[]; categories: AdminRestaurantCategory[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [toggle, setToggle] = useState<{ menu: AdminRestaurantMenu; nextActive: boolean } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = normalize(filters.query);
    return menus
      .filter((menu) => {
        const searchable = normalize(`${menu.titleFr} ${menu.titleEn} ${menu.code}`);
        const matchesState = filters.state === "all" || (filters.state === "active" && menu.isActive) || (filters.state === "inactive" && !menu.isActive);
        const matchesCategory = filters.category === "all" || menu.categoryId === filters.category;
        return (!query || searchable.includes(query)) && matchesState && matchesCategory;
      })
      .sort((a, b) => {
        if (filters.sort === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (filters.sort === "title_asc") return a.titleFr.localeCompare(b.titleFr, "fr-FR");
        if (filters.sort === "title_desc") return b.titleFr.localeCompare(a.titleFr, "fr-FR");
        return a.sortOrder - b.sortOrder || a.titleFr.localeCompare(b.titleFr, "fr-FR");
      });
  }, [menus, filters]);

  function confirmToggle() {
    if (!toggle) return;
    startTransition(async () => {
      const result = await toggleRestaurantMenuAction(toggle.menu.id, toggle.nextActive);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      setToggle(null);
      if (result.ok) router.refresh();
    });
  }

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(initialFilters);

  return (
    <>
      {message ? <section className={`admin-status-message ${message.tone}`} role="status" aria-live="polite">{message.text}</section> : null}
      <section className="admin-news-filters" aria-label="Filtres des cartes du restaurant">
        <label><span>Recherche</span><input value={filters.query} placeholder="Rechercher par titre..." onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} /></label>
        <label><span>État</span><select value={filters.state} onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value as Filters["state"] }))}><option value="all">Toutes</option><option value="active">Actives</option><option value="inactive">Inactives</option></select></label>
        <label><span>Catégorie</span><select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}><option value="all">Toutes les catégories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.nameFr}{category.isActive ? "" : " — inactive"}</option>)}</select></label>
        <label><span>Tri</span><select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as Filters["sort"] }))}><option value="order">Ordre d&apos;affichage</option><option value="updated">Dernière modification</option><option value="title_asc">Titre A-Z</option><option value="title_desc">Titre Z-A</option></select></label>
        {hasFilters ? <button className="admin-news-reset" type="button" onClick={() => setFilters(initialFilters)}>Réinitialiser</button> : null}
      </section>
      <section className="admin-news-table-card" aria-label="Liste des cartes">
        <table className="admin-news-table">
          <thead><tr><th scope="col">Carte</th><th scope="col">Catégorie</th><th scope="col">État</th><th scope="col">Images</th><th scope="col">Dernière modification</th><th scope="col">Actions</th></tr></thead>
          <tbody>
            {filtered.map((menu) => (
              <tr key={menu.id}>
                <td data-label="Carte"><div className="admin-news-article-cell"><div className="admin-news-thumb">{menu.coverImage ? <Image src={menu.coverImage} alt="" fill sizes="64px" /> : null}</div><div><p className="admin-news-title">{menu.titleFr}</p><span className="admin-news-code">{menu.titleEn}</span></div></div></td>
                <td data-label="Catégorie">{menu.categoryNameFr}</td>
                <td data-label="État"><span className={`admin-news-status ${menu.isActive ? "published" : "draft"}`}>{menu.isActive ? "Actif" : "Inactif"}</span></td>
                <td data-label="Images">{menu.imageCount}</td>
                <td data-label="Dernière modification">{formatDate(menu.updatedAt)}</td>
                <td data-label="Actions"><div className="admin-news-actions"><Link className="admin-news-action" href={`/fr/admin/restaurant/${menu.id}/modifier`}><svg aria-hidden="true" viewBox="0 0 24 24" className="admin-action-icon"><path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" /></svg>Modifier</Link><button className={`admin-news-action ${menu.isActive ? "danger" : ""}`} type="button" aria-haspopup="dialog" onClick={() => setToggle({ menu, nextActive: !menu.isActive })}><span aria-hidden="true">{menu.isActive ? "-" : "+"}</span>{menu.isActive ? "Désactiver" : "Activer"}</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? <div className="admin-news-empty" role="status"><h2>Aucun résultat</h2><p>Aucune carte ne correspond aux filtres sélectionnés.</p></div> : null}
      </section>
      {toggle ? <AdminConfirmDialog title={toggle.nextActive ? "Activer cette carte ?" : "Désactiver cette carte ?"} description={toggle.nextActive ? "Elle sera visible sur le site public." : "Elle ne sera plus visible sur le site public."} confirmLabel={toggle.nextActive ? "Confirmer l'activation" : "Confirmer la désactivation"} cancelLabel="Annuler" variant={toggle.nextActive ? "default" : "danger"} pending={isPending} pendingLabel={toggle.nextActive ? "Activation..." : "Désactivation..."} onConfirm={confirmToggle} onCancel={() => { if (!isPending) setToggle(null); }} /> : null}
    </>
  );
}
