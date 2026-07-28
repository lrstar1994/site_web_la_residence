"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleEventServiceAction } from "@/app/[locale]/admin/(protected)/evenements/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { AdminEventService } from "@/lib/admin/events/admin-event-service-types";

type Filters = {
  query: string;
  state: "all" | "active" | "inactive";
  sort: "order" | "updated" | "title_asc" | "title_desc";
};

type PendingToggle = {
  service: AdminEventService;
  nextActive: boolean;
};

const initialFilters: Filters = {
  query: "",
  state: "all",
  sort: "order",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
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

export function AdminEventServicesExplorer({ services }: { services: AdminEventService[] }) {
  const router = useRouter();
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [toggle, setToggle] = useState<PendingToggle | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  const filteredServices = useMemo(() => {
    const query = normalize(filters.query);

    return services
      .filter((service) => {
        const searchable = normalize(`${service.title.fr} ${service.title.en} ${service.code}`);

        return (
          (!query || searchable.includes(query)) &&
          (filters.state === "all" ||
            (filters.state === "active" && service.isActive) ||
            (filters.state === "inactive" && !service.isActive))
        );
      })
      .sort((left, right) => {
        if (filters.sort === "updated") {
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        }

        if (filters.sort === "title_asc") {
          return left.title.fr.localeCompare(right.title.fr, "fr-FR");
        }

        if (filters.sort === "title_desc") {
          return right.title.fr.localeCompare(left.title.fr, "fr-FR");
        }

        return left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt);
      });
  }, [services, filters]);

  function confirmToggle() {
    if (!toggle) {
      return;
    }

    startTransition(async () => {
      const result = await toggleEventServiceAction(toggle.service.id, toggle.nextActive);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      setToggle(null);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  if (services.length === 0) {
    return (
      <section className="admin-news-empty" role="status">
        <h2>Aucune prestation</h2>
        <p>Aucune prestation événementielle n’a encore été créée.</p>
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
      <section className="admin-news-filters" aria-label="Filtres des prestations">
        <label>
          <span>Recherche</span>
          <input
            value={filters.query}
            placeholder="Rechercher par titre ou code…"
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
          />
        </label>
        <label>
          <span>État</span>
          <select
            value={filters.state}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                state: event.target.value as Filters["state"],
              }))
            }
          >
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
        </label>
        <label>
          <span>Tri</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                sort: event.target.value as Filters["sort"],
              }))
            }
          >
            <option value="order">Ordre d’affichage</option>
            <option value="updated">Dernière modification</option>
            <option value="title_asc">Titre A–Z</option>
            <option value="title_desc">Titre Z–A</option>
          </select>
        </label>
        {JSON.stringify(filters) !== JSON.stringify(initialFilters) ? (
          <button className="admin-news-reset" type="button" onClick={() => setFilters(initialFilters)}>
            Réinitialiser
          </button>
        ) : null}
      </section>

      {filteredServices.length > 0 ? (
        <section className="admin-news-table-card" aria-label="Liste des prestations">
          <table className="admin-news-table">
            <thead>
              <tr>
                <th scope="col">Prestation</th>
                <th scope="col">Code</th>
                <th scope="col">État</th>
                <th scope="col">Dernière modification</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id}>
                  <td data-label="Prestation">
                    <div className="admin-news-article-cell">
                      <div className="admin-news-thumb">
                        <Image src={service.imagePath} alt={service.imageAlt.fr} fill sizes="64px" />
                      </div>
                      <div>
                        <p className="admin-news-title">{service.title.fr}</p>
                        <span className="admin-news-code">{service.title.en}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Code">{service.code}</td>
                  <td data-label="État">
                    <span className={`admin-news-status ${service.isActive ? "published" : "draft"}`}>
                      {service.isActive ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td data-label="Dernière modification">{formatDate(service.updatedAt)}</td>
                  <td data-label="Actions">
                    <div className="admin-news-actions">
                      <Link
                        className="admin-news-action"
                        href={`/fr/admin/evenements/${service.id}/modifier`}
                      >
                        Modifier
                      </Link>
                      <button
                        className={`admin-news-action ${service.isActive ? "danger" : ""}`}
                        type="button"
                        aria-haspopup="dialog"
                        onClick={() => {
                          setMessage(null);
                          setToggle({ service, nextActive: !service.isActive });
                        }}
                      >
                        {service.isActive ? "Désactiver" : "Activer"}
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
          <p>Aucune prestation ne correspond aux filtres sélectionnés.</p>
        </section>
      )}

      {toggle ? (
        <AdminConfirmDialog
          title={toggle.nextActive ? "Activer cette prestation ?" : "Désactiver cette prestation ?"}
          description={
            toggle.nextActive
              ? "Elle sera visible sur le site public."
              : "Elle ne sera plus visible sur le site public."
          }
          confirmLabel={toggle.nextActive ? "Confirmer l’activation" : "Confirmer la désactivation"}
          cancelLabel="Annuler"
          variant={toggle.nextActive ? "default" : "danger"}
          pending={isPending}
          pendingLabel={toggle.nextActive ? "Activation..." : "Désactivation..."}
          onConfirm={confirmToggle}
          onCancel={() => {
            if (!isPending) {
              setToggle(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
