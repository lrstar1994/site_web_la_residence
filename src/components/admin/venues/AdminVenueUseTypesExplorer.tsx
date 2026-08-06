"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVenueUseTypeAction } from "@/app/[locale]/admin/(protected)/salles/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import type { AdminVenueUseType } from "@/lib/admin/venues/admin-venue-types";

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function AdminVenueUseTypesExplorer({ useTypes }: { useTypes: AdminVenueUseType[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"all" | "active" | "inactive">("all");
  const [toggle, setToggle] = useState<{ useType: AdminVenueUseType; nextActive: boolean } | null>(null);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = normalize(query);
    return useTypes.filter(
      (useType) =>
        (!needle || normalize(`${useType.nameFr} ${useType.nameEn} ${useType.code}`).includes(needle)) &&
        (state === "all" ||
          (state === "active" && useType.isActive) ||
          (state === "inactive" && !useType.isActive)),
    );
  }, [query, state, useTypes]);

  function confirmToggle() {
    if (!toggle) return;

    startTransition(async () => {
      const result = await toggleVenueUseTypeAction(toggle.useType.id, toggle.nextActive);
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
          <h1>Types d&apos;usage</h1>
          <p>Gerez les usages reutilisables : professionnel, prive et festif, ou autres besoins futurs.</p>
        </div>
        <Link className="admin-news-new admin-news-primary" href="/fr/admin/salles/usages/nouveau">
          <span aria-hidden="true">+</span>
          Nouvel usage
        </Link>
      </header>

      {message ? (
        <section className={`admin-status-message ${message.tone}`} role="status" aria-live="polite">
          {message.text}
        </section>
      ) : null}

      <section className="admin-news-filters" aria-label="Filtres des usages">
        <label>
          <span>Recherche</span>
          <input value={query} placeholder="Rechercher par nom..." onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label>
          <span>Etat</span>
          <select value={state} onChange={(event) => setState(event.target.value as "all" | "active" | "inactive")}>
            <option value="all">Tous</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
        </label>
      </section>

      <section className="admin-news-table-card" aria-label="Liste des types d'usage">
        <table className="admin-news-table">
          <thead>
            <tr>
              <th scope="col">Usage</th>
              <th scope="col">Etat</th>
              <th scope="col">Utilise par</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((useType) => (
              <tr key={useType.id}>
                <td data-label="Usage">
                  <p className="admin-news-title">{useType.nameFr}</p>
                  <span className="admin-news-code">{useType.nameEn}</span>
                </td>
                <td data-label="Etat">
                  <span className={`admin-news-status ${useType.isActive ? "published" : "draft"}`}>
                    {useType.isActive ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td data-label="Utilise par">{useType.usageCount} salles</td>
                <td data-label="Actions">
                  <div className="admin-news-actions">
                    <Link className="admin-news-action" href={`/fr/admin/salles/usages/${useType.id}/modifier`}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="admin-action-icon">
                        <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />
                      </svg>
                      Modifier
                    </Link>
                    <button
                      className={`admin-news-action ${useType.isActive ? "danger" : ""}`}
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setToggle({ useType, nextActive: !useType.isActive })}
                    >
                      <span aria-hidden="true">{useType.isActive ? "-" : "+"}</span>
                      {useType.isActive ? "Desactiver" : "Activer"}
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
          title={toggle.nextActive ? "Activer ce type d'usage ?" : "Desactiver ce type d'usage ?"}
          description={
            toggle.nextActive
              ? "Il pourra etre associe aux salles et affiche sur le site public."
              : "Il sera masque du site public, sans supprimer les contenus deja configures."
          }
          confirmLabel={toggle.nextActive ? "Confirmer l'activation" : "Confirmer la desactivation"}
          cancelLabel="Annuler"
          variant={toggle.nextActive ? "default" : "danger"}
          pending={isPending}
          pendingLabel={toggle.nextActive ? "Activation..." : "Desactivation..."}
          onConfirm={confirmToggle}
          onCancel={() => {
            if (!isPending) setToggle(null);
          }}
        />
      ) : null}
    </>
  );
}
