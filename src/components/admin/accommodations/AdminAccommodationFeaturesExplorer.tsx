"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleAccommodationFeatureAction } from "@/app/[locale]/admin/(protected)/hebergements/actions";
import { AccommodationFeatureIcon } from "@/components/accommodation/AccommodationFeatureIcon";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type {
  AdminAccommodationFeature,
  AdminAccommodationFeatureGroup,
} from "@/lib/admin/accommodations/admin-accommodation-types";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function AdminAccommodationFeaturesExplorer({
  features,
  groups,
}: {
  features: AdminAccommodationFeature[];
  groups: AdminAccommodationFeatureGroup[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [groupId, setGroupId] = useState("all");
  const [state, setState] = useState<"all" | "active" | "inactive">("all");
  const [toggle, setToggle] = useState<{
    feature: AdminAccommodationFeature;
    nextActive: boolean;
  } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return features.filter((feature) => {
      const searchable = normalize(`${feature.nameFr} ${feature.nameEn} ${feature.code}`);
      return (
        (!needle || searchable.includes(needle)) &&
        (groupId === "all" || feature.groupId === groupId) &&
        (state === "all" ||
          (state === "active" && feature.isActive) ||
          (state === "inactive" && !feature.isActive))
      );
    });
  }, [features, groupId, query, state]);

  function confirmToggle() {
    if (!toggle) return;
    startTransition(async () => {
      const result = await toggleAccommodationFeatureAction(toggle.feature.id, toggle.nextActive);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      setToggle(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <header className="admin-news-header">
        <div>
          <p className="admin-section-kicker">Hébergements</p>
          <h1>Caractéristiques des hébergements</h1>
          <p>Gérez les atouts, essentiels et avantages réutilisables.</p>
        </div>
        <Link className="admin-news-new admin-news-primary" href="/fr/admin/hebergements/caracteristiques/nouveau">
          <span aria-hidden="true">+</span>
          Nouvelle caractéristique
        </Link>
      </header>

      {message ? (
        <section className={`admin-status-message ${message.tone}`} role="status" aria-live="polite">
          {message.text}
        </section>
      ) : null}

      <section className="admin-news-filters" aria-label="Filtres des caractéristiques">
        <label>
          <span>Recherche</span>
          <input value={query} placeholder="Rechercher par nom..." onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span>Groupe</span>
          <select value={groupId} onChange={(event) => setGroupId(event.target.value)}>
            <option value="all">Tous les groupes</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nameFr}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>État</span>
          <select value={state} onChange={(event) => setState(event.target.value as "all" | "active" | "inactive")}>
            <option value="all">Tous</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
        </label>
      </section>

      <section className="admin-news-table-card" aria-label="Liste des caractéristiques">
        <table className="admin-news-table">
          <thead>
            <tr>
              <th scope="col">Caractéristique</th>
              <th scope="col">Groupe</th>
              <th scope="col">État</th>
              <th scope="col">Utilisée par</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((feature) => (
              <tr key={feature.id}>
                <td data-label="Caractéristique">
                  <div className="admin-feature-name">
                    <AccommodationFeatureIcon iconKey={feature.iconKey} className="admin-feature-icon" />
                    <span>
                      <strong>{feature.nameFr}</strong>
                      <span className="admin-news-code">{feature.nameEn}</span>
                    </span>
                  </div>
                </td>
                <td data-label="Groupe">
                  {groups.find((group) => group.id === feature.groupId)?.nameFr ?? feature.groupCode}
                </td>
                <td data-label="État">
                  <span className={`admin-news-status ${feature.isActive ? "published" : "draft"}`}>
                    {feature.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td data-label="Utilisée par">{feature.usageCount} hébergements</td>
                <td data-label="Actions">
                  <div className="admin-news-actions">
                    <Link className="admin-news-action" href={`/fr/admin/hebergements/caracteristiques/${feature.id}/modifier`}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="admin-action-icon">
                        <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />
                      </svg>
                      Modifier
                    </Link>
                    <button
                      className={`admin-news-action ${feature.isActive ? "danger" : ""}`}
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setToggle({ feature, nextActive: !feature.isActive })}
                    >
                      <span aria-hidden="true">{feature.isActive ? "−" : "+"}</span>
                      {feature.isActive ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {toggle ? (
        <AdminConfirmDialog
          title={toggle.nextActive ? "Activer cette caractéristique ?" : "Désactiver cette caractéristique ?"}
          description={
            toggle.nextActive
              ? "Elle pourra être affichée sur le site public."
              : "Elle sera masquée du site public, sans supprimer ses associations."
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
