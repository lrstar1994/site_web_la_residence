"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  deleteEventQuoteRequestAction,
  updateEventQuoteRequestAction,
} from "@/app/[locale]/admin/(protected)/demandes-de-devis/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import {
  EVENT_QUOTE_STATUS_LABELS_FR,
  EVENT_QUOTE_STATUSES,
  type AdminEventQuoteRequest,
} from "@/lib/admin/event-quotes/admin-event-quote-types";
import type { EventQuoteField } from "@/types/event-quote";

type State = {
  ok: boolean;
  message: string;
};

const initialState: State = {
  ok: false,
  message: "",
};

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

function formatAnswer(field: EventQuoteField, value: unknown) {
  if (field.fieldType === "boolean") {
    return value === true ? "Oui" : "Non";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => field.options.find((option) => option.value === item)?.labelFr ?? String(item))
      .join(", ");
  }

  if (field.options.length > 0) {
    return field.options.find((option) => option.value === value)?.labelFr ?? String(value ?? "");
  }

  if (value === null || value === undefined || value === "") return "Non renseigné";
  return String(value);
}

export function AdminEventQuoteDetail({
  request,
  fields,
}: {
  request: AdminEventQuoteRequest;
  fields: EventQuoteField[];
}) {
  const [state, formAction] = useActionState(
    updateEventQuoteRequestAction.bind(null, request.id),
    initialState,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, startDeleteTransition] = useTransition();
  const answerFields = useMemo(
    () => fields.filter((field) => field.eventTypeId === request.eventTypeId),
    [fields, request.eventTypeId],
  );
  const canDelete = deleteConfirm.trim() === "SUPPRIMER" && !isDeleting;

  function confirmDelete() {
    if (!canDelete) return;
    setDeleteError("");
    startDeleteTransition(async () => {
      const result = await deleteEventQuoteRequestAction(request.id);
      if (result && !result.ok) {
        setDeleteError(result.message);
      }
    });
  }

  return (
    <>
      <AdminBackButton fallbackHref="/fr/admin/demandes-de-devis" />
      <form className="admin-news-form" action={formAction}>
        <header className="admin-news-form-header">
          <div>
            <p className="admin-section-kicker">Demande de devis</p>
            <h2>{request.fullName}</h2>
            <p>Demande reçue le {formatDateTime(request.createdAt)}.</p>
          </div>
        </header>

        {state.message ? (
          <section className={state.ok ? "admin-news-success" : "admin-news-form-alert"} role="status">
            {state.message}
          </section>
        ) : null}

        <div className="admin-news-form-grid">
          <div className="admin-news-form-main">
            <section className="admin-news-form-card">
              <div className="admin-news-form-section-heading">
                <p>Coordonnées</p>
                <h2>Contact</h2>
              </div>
              <dl className="admin-detail-list">
                <div><dt>Nom complet</dt><dd>{request.fullName}</dd></div>
                <div><dt>Email</dt><dd><a href={`mailto:${request.email}`}>{request.email}</a></dd></div>
                <div><dt>Téléphone</dt><dd>{request.phone}</dd></div>
                <div><dt>WhatsApp</dt><dd>{request.whatsapp || "Non renseigné"}</dd></div>
              </dl>
            </section>

            <section className="admin-news-form-card">
              <div className="admin-news-form-section-heading">
                <p>Événement</p>
                <h2>Informations principales</h2>
              </div>
              <dl className="admin-detail-list">
                <div><dt>Type d&apos;événement</dt><dd>{request.eventTypeTitleFr}</dd></div>
                <div><dt>Date envisagée</dt><dd>{formatDate(request.eventDate)}</dd></div>
                <div><dt>Budget</dt><dd>{formatBudget(request.estimatedBudget)}</dd></div>
                <div><dt>Précisions</dt><dd>{request.additionalDetails || "Non renseigné"}</dd></div>
              </dl>
            </section>

            <section className="admin-news-form-card">
              <div className="admin-news-form-section-heading">
                <p>Détails</p>
                <h2>Détails de l&apos;événement</h2>
              </div>
              {answerFields.length > 0 ? (
                <dl className="admin-detail-list">
                  {answerFields.map((field) => (
                    <div key={field.id}>
                      <dt>{field.labelFr}</dt>
                      <dd>{formatAnswer(field, request.specificAnswers[field.fieldKey])}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="admin-news-form-note">Aucun champ spécifique n&apos;est configuré pour ce type.</p>
              )}
            </section>
          </div>

          <div className="admin-news-form-sticky">
            <section className="admin-news-form-card">
              <div className="admin-news-form-section-heading">
                <p>Suivi</p>
                <h2>Statut et note interne</h2>
              </div>
              <label className="admin-news-form-field">
                <span>Statut</span>
                <select name="status" defaultValue={request.status}>
                  {EVENT_QUOTE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {EVENT_QUOTE_STATUS_LABELS_FR[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-news-form-field">
                <span>Note interne</span>
                <textarea name="internal_notes" rows={8} defaultValue={request.internalNotes ?? ""} />
                <small>Cette note reste uniquement visible dans l&apos;administration.</small>
              </label>
            </section>

            <section className="admin-danger-zone">
              <span>Zone dangereuse</span>
              <h2>Supprimer cette demande</h2>
              <p>La demande sera supprimée définitivement. Le type d&apos;événement et sa configuration seront conservés.</p>
              {deleteError ? <strong className="admin-news-form-error">{deleteError}</strong> : null}
              <button
                className="admin-danger-zone-button"
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteDialogOpen(true)}
              >
                {isDeleting ? "Suppression en cours..." : "Supprimer la demande"}
              </button>
            </section>

            <div className="admin-news-form-actions">
              <button className="admin-news-form-button primary" type="submit">
                Enregistrer le suivi
              </button>
            </div>
          </div>
        </div>
      </form>

      {deleteDialogOpen ? (
        <AdminConfirmDialog
          title="Supprimer cette demande ?"
          description="Cette demande de devis sera supprimée définitivement. Cette action est irréversible."
          confirmLabel="Supprimer définitivement"
          cancelLabel="Annuler"
          variant="danger"
          pending={isDeleting}
          pendingLabel="Suppression en cours..."
          confirmDisabled={!canDelete}
          onConfirm={confirmDelete}
          onCancel={() => {
            if (!isDeleting) setDeleteDialogOpen(false);
          }}
        >
          <label className="admin-confirm-dialog-field">
            <span>Tapez SUPPRIMER pour confirmer</span>
            <input value={deleteConfirm} onChange={(event) => setDeleteConfirm(event.target.value)} />
            <small>{canDelete ? "Confirmation validée." : "Tapez SUPPRIMER pour activer le bouton."}</small>
          </label>
        </AdminConfirmDialog>
      ) : null}
    </>
  );
}
