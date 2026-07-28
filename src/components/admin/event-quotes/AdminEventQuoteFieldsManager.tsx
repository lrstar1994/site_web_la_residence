"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import {
  saveEventQuoteFieldAction,
  toggleEventQuoteFieldAction,
} from "@/app/[locale]/admin/(protected)/demandes-de-devis/actions";
import type { EventQuoteField, EventQuoteFieldType } from "@/types/event-quote";
import type { EventService } from "@/types/event-service";

type State = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

const initialState: State = {
  ok: false,
  message: "",
};

const FIELD_TYPES: { value: EventQuoteFieldType; label: string }[] = [
  { value: "text", label: "Texte court" },
  { value: "textarea", label: "Texte long" },
  { value: "number", label: "Nombre" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Oui / Non" },
  { value: "select", label: "Liste déroulante" },
  { value: "radio", label: "Choix unique" },
  { value: "checkbox_group", label: "Cases à cocher" },
  { value: "multi_select", label: "Choix multiple" },
];

function optionsToText(field: EventQuoteField | null) {
  if (!field) return "";
  return field.options
    .map((option) => `${option.value}|${option.labelFr}|${option.labelEn}`)
    .join("\n");
}

export function AdminEventQuoteFieldsManager({
  services,
  fields,
}: {
  services: EventService[];
  fields: EventQuoteField[];
}) {
  const [state, formAction] = useActionState(saveEventQuoteFieldAction, initialState);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");
  const [editingField, setEditingField] = useState<EventQuoteField | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedFields = useMemo(
    () =>
      fields
        .filter((field) => field.eventTypeId === selectedServiceId)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    [fields, selectedServiceId],
  );

  function toggleField(field: EventQuoteField) {
    setMessage("");
    startTransition(async () => {
      const result = await toggleEventQuoteFieldAction(field.id, !field.isActive);
      setMessage(result.message);
    });
  }

  return (
    <div className="admin-news-form-grid">
      <div className="admin-news-form-main">
        <section className="admin-news-form-card">
          <div className="admin-news-form-section-heading">
            <p>Type d&apos;événement</p>
            <h2>Champs configurés</h2>
          </div>
          <label className="admin-news-form-field">
            <span>Type d&apos;événement</span>
            <select
              value={selectedServiceId}
              onChange={(event) => {
                setSelectedServiceId(event.target.value);
                setEditingField(null);
              }}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title.fr}
                </option>
              ))}
            </select>
          </label>
          {message ? <section className="admin-news-success" role="status">{message}</section> : null}
          <section className="admin-news-table-card" aria-label="Champs dynamiques">
            <table className="admin-news-table">
              <thead>
                <tr>
                  <th scope="col">Champ</th>
                  <th scope="col">Type</th>
                  <th scope="col">Obligatoire</th>
                  <th scope="col">État</th>
                  <th scope="col">Ordre</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {selectedFields.map((field) => (
                  <tr key={field.id}>
                    <td data-label="Champ">
                      <p className="admin-news-title">{field.labelFr}</p>
                      <span className="admin-news-code">{field.fieldKey}</span>
                    </td>
                    <td data-label="Type">{FIELD_TYPES.find((type) => type.value === field.fieldType)?.label ?? field.fieldType}</td>
                    <td data-label="Obligatoire">{field.isRequired ? "Oui" : "Non"}</td>
                    <td data-label="État">
                      <span className={`admin-news-status ${field.isActive ? "published" : "draft"}`}>
                        {field.isActive ? "Actif" : "Inactif"}
                      </span>
                    </td>
                    <td data-label="Ordre">{field.sortOrder}</td>
                    <td data-label="Actions">
                      <div className="admin-news-actions">
                        <button className="admin-news-action" type="button" onClick={() => setEditingField(field)}>
                          Modifier
                        </button>
                        <button
                          className={`admin-news-action ${field.isActive ? "danger" : ""}`}
                          type="button"
                          disabled={isPending}
                          onClick={() => toggleField(field)}
                        >
                          {field.isActive ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </section>
      </div>

      <form
        key={editingField?.id ?? selectedServiceId}
        className="admin-news-form-sticky"
        action={formAction}
      >
        <section className="admin-news-form-card">
          <div className="admin-news-form-section-heading">
            <p>{editingField ? "Modification" : "Création"}</p>
            <h2>{editingField ? "Modifier un champ" : "Ajouter un champ"}</h2>
          </div>
          {state.message ? (
            <section className={state.ok ? "admin-news-success" : "admin-news-form-alert"} role="status">
              {state.message}
            </section>
          ) : null}
          <input type="hidden" name="field_id" value={editingField?.id ?? ""} />
          <label className="admin-news-form-field">
            <span>Type d&apos;événement</span>
            <select name="event_type_id" defaultValue={editingField?.eventTypeId ?? selectedServiceId}>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.title.fr}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-news-form-field">
            <span>Clé technique stable</span>
            <input
              name="field_key"
              defaultValue={editingField?.fieldKey ?? ""}
              readOnly={Boolean(editingField)}
              placeholder="participants_count"
            />
            <small>Ne se modifie plus après création afin de préserver les anciennes demandes.</small>
            {state.fieldErrors?.field_key ? <strong className="admin-news-form-error">{state.fieldErrors.field_key}</strong> : null}
          </label>
          <label className="admin-news-form-field">
            <span>Libellé français</span>
            <input name="label_fr" defaultValue={editingField?.labelFr ?? ""} />
          </label>
          <label className="admin-news-form-field">
            <span>Libellé anglais</span>
            <input name="label_en" defaultValue={editingField?.labelEn ?? ""} />
          </label>
          <label className="admin-news-form-field">
            <span>Type de champ</span>
            <select name="field_type" defaultValue={editingField?.fieldType ?? "text"}>
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-news-form-field">
            <span>Ordre</span>
            <input name="sort_order" type="number" min={0} defaultValue={editingField?.sortOrder ?? 0} />
          </label>
          <label className="admin-news-form-field admin-checkbox-field">
            <input name="is_required" type="checkbox" defaultChecked={editingField?.isRequired ?? false} />
            <span>Champ obligatoire</span>
          </label>
          <label className="admin-news-form-field admin-checkbox-field">
            <input name="is_active" type="checkbox" defaultChecked={editingField?.isActive ?? true} />
            <span>Champ actif</span>
          </label>
          <label className="admin-news-form-field">
            <span>Options</span>
            <textarea name="options_text" rows={5} defaultValue={optionsToText(editingField)} placeholder="value|Libellé FR|Label EN" />
            <small>Une option par ligne. Requis pour les listes, radios et cases à cocher.</small>
          </label>
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Condition simple</p>
              <h2>Affichage conditionnel</h2>
            </div>
            <label className="admin-news-form-field">
              <span>Dépend du champ</span>
              <input name="conditional_depends_on" defaultValue={editingField?.conditionalLogic?.dependsOn ?? ""} placeholder="coffee_break" />
            </label>
            <label className="admin-news-form-field">
              <span>Opérateur</span>
              <select name="conditional_operator" defaultValue={editingField?.conditionalLogic?.operator ?? ""}>
                <option value="">Aucune condition</option>
                <option value="equals">Égal à</option>
                <option value="not_equals">Différent de</option>
                <option value="contains">Contient</option>
                <option value="greater_than">Supérieur à</option>
              </select>
            </label>
            <label className="admin-news-form-field">
              <span>Valeur attendue</span>
              <input name="conditional_value" defaultValue={String(editingField?.conditionalLogic?.value ?? "")} placeholder="true" />
            </label>
          </section>
          <div className="admin-news-form-actions">
            <button className="admin-news-form-button primary" type="submit">
              {editingField ? "Enregistrer le champ" : "Créer le champ"}
            </button>
            {editingField ? (
              <button className="admin-news-form-button secondary" type="button" onClick={() => setEditingField(null)}>
                Annuler
              </button>
            ) : null}
          </div>
        </section>
      </form>
    </div>
  );
}
