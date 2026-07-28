"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAccommodationAction } from "@/app/[locale]/admin/(protected)/hebergements/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { AdminAccommodation } from "@/lib/admin/accommodations/get-admin-accommodations";

type Filters = {
  query: string;
  state: "all" | "active" | "inactive";
  sort: "order" | "updated" | "price";
};

const initialFilters: Filters = { query: "", state: "all", sort: "order" };

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Antananarivo",
  }).format(new Date(value));
}

function formatPrice(value: number) {
  return `${new Intl.NumberFormat("fr-FR").format(value)} MGA`;
}

export function AdminAccommodationsExplorer({ accommodations }: { accommodations: AdminAccommodation[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [toggle, setToggle] = useState<{ item: AdminAccommodation; nextActive: boolean } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = normalize(filters.query);

    return accommodations
      .filter((item) => {
        const searchable = normalize(`${item.nameFr} ${item.nameEn} ${item.code}`);
        return (
          (!query || searchable.includes(query)) &&
          (filters.state === "all" ||
            (filters.state === "active" && item.isActive) ||
            (filters.state === "inactive" && !item.isActive))
        );
      })
      .sort((left, right) => {
        if (filters.sort === "updated") return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        if (filters.sort === "price") return left.priceFrom - right.priceFrom;
        return left.sortOrder - right.sortOrder || left.nameFr.localeCompare(right.nameFr, "fr-FR");
      });
  }, [accommodations, filters]);

  function confirmToggle() {
    if (!toggle) return;
    startTransition(async () => {
      const result = await toggleAccommodationAction(toggle.item.id, toggle.nextActive);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      setToggle(null);
      if (result.ok) router.refresh();
    });
  }

  if (accommodations.length === 0) {
    return (
      <section className="admin-news-empty" role="status">
        <h2>Aucun hébergement</h2>
        <p>Aucun hébergement n&apos;a encore été créé.</p>
      </section>
    );
  }

  return (
    <>
      {message ? (
        <section className={`admin-status-message ${message.tone}`} role="status" aria-live="polite">
          {message.text}
        </section>
      ) : null}

      <section className="admin-news-filters" aria-label="Filtres des hébergements">
        <label>
          <span>Recherche</span>
          <input
            value={filters.query}
            placeholder="Rechercher par nom..."
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
          />
        </label>
        <label>
          <span>État</span>
          <select
            value={filters.state}
            onChange={(event) => setFilters((current) => ({ ...current, state: event.target.value as Filters["state"] }))}
          >
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </label>
        <label>
          <span>Tri</span>
          <select
            value={filters.sort}
            onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value as Filters["sort"] }))}
          >
            <option value="order">Ordre d&apos;affichage</option>
            <option value="updated">Dernière modification</option>
            <option value="price">Prix croissant</option>
          </select>
        </label>
        {JSON.stringify(filters) !== JSON.stringify(initialFilters) ? (
          <button className="admin-news-reset" type="button" onClick={() => setFilters(initialFilters)}>
            Réinitialiser
          </button>
        ) : null}
      </section>

      {filtered.length > 0 ? (
        <section className="admin-news-table-card" aria-label="Liste des hébergements">
          <table className="admin-news-table">
            <thead>
              <tr>
                <th scope="col">Hébergement</th>
                <th scope="col">Prix à partir de</th>
                <th scope="col">Capacité</th>
                <th scope="col">Surface</th>
                <th scope="col">État</th>
                <th scope="col">Dernière modification</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td data-label="Hébergement">
                    <div className="admin-news-article-cell">
                      <div className="admin-news-thumb">
                        {item.coverImage ? <Image src={item.coverImage} alt="" fill sizes="64px" /> : null}
                      </div>
                      <div>
                        <p className="admin-news-title">{item.nameFr}</p>
                        <span className="admin-news-code">{item.featureCount} caractéristiques</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Prix">{formatPrice(item.priceFrom)}</td>
                  <td data-label="Capacité">{item.capacity} pers.</td>
                  <td data-label="Surface">{item.surfaceM2 ? `${item.surfaceM2} m²` : "Non renseignée"}</td>
                  <td data-label="État">
                    <span className={`admin-news-status ${item.isActive ? "published" : "draft"}`}>
                      {item.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td data-label="Dernière modification">{formatDate(item.updatedAt)}</td>
                  <td data-label="Actions">
                    <div className="admin-news-actions">
                      <Link className="admin-news-action" href={`/fr/admin/hebergements/${item.id}/modifier`}>
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="admin-action-icon">
                          <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />
                        </svg>
                        Modifier
                      </Link>
                      <button
                        className={`admin-news-action ${item.isActive ? "danger" : ""}`}
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => {
                          setMessage(null);
                          setToggle({ item, nextActive: !item.isActive });
                        }}
                      >
                        <span aria-hidden="true">{item.isActive ? "−" : "+"}</span>
                        {item.isActive ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <section className="admin-news-empty" role="status">
          <h2>Aucun résultat</h2>
          <p>Aucun hébergement ne correspond aux filtres sélectionnés.</p>
        </section>
      )}

      {toggle ? (
        <AdminConfirmDialog
          title={toggle.nextActive ? "Activer cet hébergement ?" : "Désactiver cet hébergement ?"}
          description={
            toggle.nextActive
              ? "Il sera visible sur le site public."
              : "Il ne sera plus visible sur le site public."
          }
          confirmLabel={toggle.nextActive ? "Confirmer l'activation" : "Confirmer la désactivation"}
          cancelLabel="Annuler"
          variant={toggle.nextActive ? "default" : "danger"}
          pending={isPending}
          pendingLabel={toggle.nextActive ? "Activation..." : "Désactivation..."}
          onConfirm={confirmToggle}
          onCancel={() => {
            if (!isPending) setToggle(null);
          }}
        />
      ) : null}
    </>
  );
}
