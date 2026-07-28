"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVenueSetupAction } from "@/app/[locale]/admin/(protected)/salles/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import { VenueSetupIcon } from "@/components/venues/VenueSetupIcon";
import type { AdminVenueSetup } from "@/lib/admin/venues/admin-venue-types";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function AdminVenueSetupsExplorer({ setups }: { setups: AdminVenueSetup[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"all" | "active" | "inactive">("all");
  const [toggle, setToggle] = useState<{ setup: AdminVenueSetup; nextActive: boolean } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = normalize(query);

    return setups.filter(
      (setup) =>
        (!needle || normalize(`${setup.nameFr} ${setup.nameEn} ${setup.code}`).includes(needle)) &&
        (state === "all" ||
          (state === "active" && setup.isActive) ||
          (state === "inactive" && !setup.isActive)),
    );
  }, [query, setups, state]);

  function confirmToggle() {
    if (!toggle) return;

    startTransition(async () => {
      const result = await toggleVenueSetupAction(toggle.setup.id, toggle.nextActive);
      setMessage({ tone: result.ok ? "success" : "error", text: result.message });
      setToggle(null);
      if (result.ok) router.refresh();
    });
  }

  return (
    <>
      <header className="admin-news-header">
        <div>
          <p className="admin-section-kicker">Salles</p>
          <h1>Configurations de salles</h1>
          <p>Gérez les configurations réutilisables pour les salles.</p>
        </div>
        <Link className="admin-news-new admin-news-primary" href="/fr/admin/salles/configurations/nouveau">
          <span aria-hidden="true">+</span>
          Nouvelle configuration
        </Link>
      </header>

      {message ? (
        <section className={`admin-status-message ${message.tone}`} role="status" aria-live="polite">
          {message.text}
        </section>
      ) : null}

      <section className="admin-news-filters" aria-label="Filtres des configurations">
        <label>
          <span>Recherche</span>
          <input value={query} placeholder="Rechercher par nom..." onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span>État</span>
          <select value={state} onChange={(event) => setState(event.target.value as "all" | "active" | "inactive")}>
            <option value="all">Toutes</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
        </label>
      </section>

      <section className="admin-news-table-card" aria-label="Liste des configurations">
        <table className="admin-news-table">
          <thead>
            <tr>
              <th scope="col">Configuration</th>
              <th scope="col">État</th>
              <th scope="col">Utilisée par</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((setup) => (
              <tr key={setup.id}>
                <td data-label="Configuration">
                  <div className="admin-feature-name">
                    <VenueSetupIcon iconKey={setup.iconKey} className="admin-feature-icon" />
                    <span>
                      <strong>{setup.nameFr}</strong>
                      <span className="admin-news-code">{setup.nameEn}</span>
                    </span>
                  </div>
                </td>
                <td data-label="État">
                  <span className={`admin-news-status ${setup.isActive ? "published" : "draft"}`}>
                    {setup.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td data-label="Utilisée par">{setup.usageCount} salles</td>
                <td data-label="Actions">
                  <div className="admin-news-actions">
                    <Link className="admin-news-action" href={`/fr/admin/salles/configurations/${setup.id}/modifier`}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="admin-action-icon">
                        <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />
                      </svg>
                      Modifier
                    </Link>
                    <button
                      className={`admin-news-action ${setup.isActive ? "danger" : ""}`}
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setToggle({ setup, nextActive: !setup.isActive })}
                    >
                      <span aria-hidden="true">{setup.isActive ? "−" : "+"}</span>
                      {setup.isActive ? "Désactiver" : "Activer"}
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
          title={toggle.nextActive ? "Activer cette configuration ?" : "Désactiver cette configuration ?"}
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
