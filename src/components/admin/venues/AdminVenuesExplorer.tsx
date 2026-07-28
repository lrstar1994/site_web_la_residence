"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVenueAction } from "@/app/[locale]/admin/(protected)/salles/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { AdminVenue } from "@/lib/admin/venues/admin-venue-types";

type Filters = { query: string; state: "all" | "active" | "inactive"; sort: "order" | "updated" | "name_asc" | "name_desc" | "capacity_asc" | "capacity_desc" };
const initialFilters: Filters = { query: "", state: "all", sort: "order" };

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Indian/Antananarivo" }).format(new Date(value));
}

export function AdminVenuesExplorer({ venues }: { venues: AdminVenue[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [toggle, setToggle] = useState<{ venue: AdminVenue; nextActive: boolean } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = normalize(filters.query);
    return venues
      .filter((venue) => {
        const searchable = normalize(`${venue.name} ${venue.locationFr} ${venue.locationEn} ${venue.code}`);
        return (!query || searchable.includes(query)) && (filters.state === "all" || (filters.state === "active" && venue.isActive) || (filters.state === "inactive" && !venue.isActive));
      })
      .sort((a, b) => {
        if (filters.sort === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (filters.sort === "name_asc") return a.name.localeCompare(b.name, "fr-FR");
        if (filters.sort === "name_desc") return b.name.localeCompare(a.name, "fr-FR");
        if (filters.sort === "capacity_asc") return a.capacity - b.capacity;
        if (filters.sort === "capacity_desc") return b.capacity - a.capacity;
        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "fr-FR");
      });
  }, [venues, filters]);

  function confirmToggle() {
    if (!toggle) return;
    startTransition(async () => {
      const result = await toggleVenueAction(toggle.venue.id, toggle.nextActive);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      setToggle(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      {message ? <section className={`admin-status-message ${message.tone}`} role="status" aria-live="polite">{message.text}</section> : null}
      <section className="admin-news-filters" aria-label="Filtres des salles">
        <label><span>Recherche</span><input value={filters.query} placeholder="Rechercher par nom ou emplacement..." onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))} /></label>
        <label><span>État</span><select value={filters.state} onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value as Filters["state"] }))}><option value="all">Toutes</option><option value="active">Actives</option><option value="inactive">Inactives</option></select></label>
        <label><span>Tri</span><select value={filters.sort} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as Filters["sort"] }))}><option value="order">Ordre d&apos;affichage</option><option value="updated">Dernière modification</option><option value="name_asc">Nom A-Z</option><option value="name_desc">Nom Z-A</option><option value="capacity_asc">Capacité croissante</option><option value="capacity_desc">Capacité décroissante</option></select></label>
        {JSON.stringify(filters) !== JSON.stringify(initialFilters) ? <button className="admin-news-reset" type="button" onClick={() => setFilters(initialFilters)}>Réinitialiser</button> : null}
      </section>
      <section className="admin-news-table-card" aria-label="Liste des salles">
        <table className="admin-news-table">
          <thead><tr><th scope="col">Salle</th><th scope="col">Capacité</th><th scope="col">Surface</th><th scope="col">Emplacement</th><th scope="col">État</th><th scope="col">Dernière modification</th><th scope="col">Actions</th></tr></thead>
          <tbody>
            {filtered.map((venue) => (
              <tr key={venue.id}>
                <td data-label="Salle"><div className="admin-news-article-cell"><div className="admin-news-thumb">{venue.coverImage ? <Image src={venue.coverImage} alt="" fill sizes="64px" /> : null}</div><div><p className="admin-news-title">{venue.name}</p><span className="admin-news-code">{venue.imageCount} images · {venue.setupCount} configurations</span></div></div></td>
                <td data-label="Capacité">{venue.capacity} pers.</td>
                <td data-label="Surface">{venue.surfaceM2 ? `${venue.surfaceM2} m²` : "Non renseignée"}</td>
                <td data-label="Emplacement">{venue.locationFr}</td>
                <td data-label="État"><span className={`admin-news-status ${venue.isActive ? "published" : "draft"}`}>{venue.isActive ? "Actif" : "Inactif"}</span></td>
                <td data-label="Dernière modification">{formatDate(venue.updatedAt)}</td>
                <td data-label="Actions"><div className="admin-news-actions"><Link className="admin-news-action" href={`/fr/admin/salles/${venue.id}/modifier`}><svg aria-hidden="true" viewBox="0 0 24 24" className="admin-action-icon"><path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" /></svg>Modifier</Link><button className={`admin-news-action ${venue.isActive ? "danger" : ""}`} type="button" aria-haspopup="dialog" onClick={() => setToggle({ venue, nextActive: !venue.isActive })}><span aria-hidden="true">{venue.isActive ? "−" : "+"}</span>{venue.isActive ? "Désactiver" : "Activer"}</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {toggle ? <AdminConfirmDialog title={toggle.nextActive ? "Activer cette salle ?" : "Désactiver cette salle ?"} description={toggle.nextActive ? "Elle sera visible sur le site public." : "Elle ne sera plus visible sur le site public."} confirmLabel={toggle.nextActive ? "Confirmer l'activation" : "Confirmer la désactivation"} cancelLabel="Annuler" variant={toggle.nextActive ? "default" : "danger"} pending={isPending} pendingLabel={toggle.nextActive ? "Activation..." : "Désactivation..."} onConfirm={confirmToggle} onCancel={() => { if (!isPending) setToggle(null); }} /> : null}
    </>
  );
}
