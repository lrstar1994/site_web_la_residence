"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EVENT_QUOTE_STATUS_LABELS_FR,
  type AdminEventQuoteRequest,
} from "@/lib/admin/event-quotes/admin-event-quote-types";
import type { EventService } from "@/types/event-service";

type Filters = {
  query: string;
  status: string;
  eventTypeId: string;
};

const initialFilters: Filters = {
  query: "",
  status: "all",
  eventTypeId: "all",
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function formatDate(value: string | null) {
  if (!value) return "Non précisée";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Indian/Antananarivo",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Antananarivo",
  }).format(new Date(value));
}

function formatBudget(value: number | null) {
  if (value === null) return "Non précisé";
  return `${new Intl.NumberFormat("fr-FR").format(value)} Ar`;
}

export function AdminEventQuotesExplorer({
  requests,
  services,
}: {
  requests: AdminEventQuoteRequest[];
  services: EventService[];
}) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const filtered = useMemo(() => {
    const query = normalize(filters.query);

    return requests.filter((request) => {
      const searchable = normalize(`${request.fullName} ${request.email} ${request.phone}`);
      return (
        (!query || searchable.includes(query)) &&
        (filters.status === "all" || request.status === filters.status) &&
        (filters.eventTypeId === "all" || request.eventTypeId === filters.eventTypeId)
      );
    });
  }, [filters, requests]);

  if (requests.length === 0) {
    return (
      <section className="admin-news-empty" role="status">
        <h2>Aucune demande</h2>
        <p>Les demandes de devis envoyées depuis le site apparaîtront ici.</p>
      </section>
    );
  }

  return (
    <>
      <section className="admin-news-filters" aria-label="Filtres des demandes de devis">
        <label>
          <span>Recherche</span>
          <input
            value={filters.query}
            placeholder="Nom, email ou téléphone"
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
          />
        </label>
        <label>
          <span>Type d&apos;événement</span>
          <select
            value={filters.eventTypeId}
            onChange={(event) => setFilters((current) => ({ ...current, eventTypeId: event.target.value }))}
          >
            <option value="all">Tous</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.title.fr}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Statut</span>
          <select
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
          >
            <option value="all">Tous</option>
            {Object.entries(EVENT_QUOTE_STATUS_LABELS_FR).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {JSON.stringify(filters) !== JSON.stringify(initialFilters) ? (
          <button className="admin-news-reset" type="button" onClick={() => setFilters(initialFilters)}>
            Réinitialiser
          </button>
        ) : null}
      </section>

      <section className="admin-news-table-card" aria-label="Liste des demandes de devis">
        <table className="admin-news-table">
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Nom complet</th>
              <th scope="col">Type d&apos;événement</th>
              <th scope="col">Date envisagée</th>
              <th scope="col">Téléphone</th>
              <th scope="col">Budget</th>
              <th scope="col">Statut</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((request) => (
              <tr key={request.id}>
                <td data-label="Date">{formatDateTime(request.createdAt)}</td>
                <td data-label="Nom complet">
                  <p className="admin-news-title">{request.fullName}</p>
                  <span className="admin-news-code">{request.email}</span>
                </td>
                <td data-label="Type d'événement">{request.eventTypeTitleFr}</td>
                <td data-label="Date envisagée">{formatDate(request.eventDate)}</td>
                <td data-label="Téléphone">{request.phone}</td>
                <td data-label="Budget">{formatBudget(request.estimatedBudget)}</td>
                <td data-label="Statut">
                  <span className="admin-news-status draft">
                    {EVENT_QUOTE_STATUS_LABELS_FR[request.status]}
                  </span>
                </td>
                <td data-label="Actions">
                  <div className="admin-news-actions">
                    <Link className="admin-news-action" href={`/fr/admin/demandes-de-devis/${request.id}`}>
                      Consulter
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
