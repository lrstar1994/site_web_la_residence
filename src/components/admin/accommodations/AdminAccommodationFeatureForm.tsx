"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createAccommodationFeatureAction,
  updateAccommodationFeatureAction,
} from "@/app/[locale]/admin/(protected)/hebergements/actions";
import { accommodationFeatureIconOptions } from "@/components/accommodation/AccommodationFeatureIcon";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import {
  emptyFeatureFormValues,
  type AdminAccommodationFeature,
  type AdminAccommodationFeatureGroup,
  type AdminFeatureFormState,
  type AdminFeatureFormValues,
} from "@/lib/admin/accommodations/admin-accommodation-types";

function initialValues(feature?: AdminAccommodationFeature): AdminFeatureFormValues {
  if (!feature) return emptyFeatureFormValues;

  return {
    groupId: feature.groupId,
    code: feature.code,
    nameFr: feature.nameFr,
    nameEn: feature.nameEn,
    descriptionFr: feature.descriptionFr,
    descriptionEn: feature.descriptionEn,
    iconKey: feature.iconKey,
    sortOrder: String(feature.sortOrder),
    isActive: feature.isActive,
  };
}

export function AdminAccommodationFeatureForm({
  mode,
  feature,
  groups,
}: {
  mode: "create" | "edit";
  feature?: AdminAccommodationFeature;
  groups: AdminAccommodationFeatureGroup[];
}) {
  const values = useMemo(() => initialValues(feature), [feature]);
  const initialState = useMemo<AdminFeatureFormState>(
    () => ({ ok: false, message: "", fieldErrors: {}, values }),
    [values],
  );
  const action =
    mode === "create"
      ? createAccommodationFeatureAction
      : updateAccommodationFeatureAction.bind(null, feature?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminFeatureFormValues>(state.values);

  return (
    <form className="admin-news-form" action={formAction}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/hebergements/caracteristiques" />
        <div>
          <p className="admin-section-kicker">Caractéristiques</p>
          <h1>{mode === "create" ? "Nouvelle caractéristique" : "Modifier la caractéristique"}</h1>
          <p>Ces libellés peuvent être associés à plusieurs hébergements.</p>
        </div>
      </header>
      {state.message ? <section className="admin-news-form-alert" role="alert">{state.message}</section> : null}
      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Informations principales</p>
              <h2>Libellés</h2>
            </div>
            <label className="admin-news-form-field">
              <span>Groupe</span>
              <select name="group_id" value={formValues.groupId} required onChange={(event) => setFormValues((current) => ({ ...current, groupId: event.target.value }))}>
                <option value="">Choisir un groupe</option>
                {groups.map((group) => <option key={group.id} value={group.id}>{group.nameFr}</option>)}
              </select>
              {state.fieldErrors.groupId ? <strong className="admin-news-form-error">{state.fieldErrors.groupId}</strong> : null}
            </label>
            <label className="admin-news-form-field">
              <span>Nom français</span>
              <input name="name_fr" value={formValues.nameFr} required onChange={(event) => setFormValues((current) => ({ ...current, nameFr: event.target.value }))} />
              {state.fieldErrors.nameFr ? <strong className="admin-news-form-error">{state.fieldErrors.nameFr}</strong> : null}
            </label>
            <label className="admin-news-form-field">
              <span>Nom anglais</span>
              <input name="name_en" value={formValues.nameEn} required onChange={(event) => setFormValues((current) => ({ ...current, nameEn: event.target.value }))} />
              {state.fieldErrors.nameEn ? <strong className="admin-news-form-error">{state.fieldErrors.nameEn}</strong> : null}
            </label>
            <label className="admin-news-form-field">
              <span>Icône</span>
              <select
                name="icon_key"
                value={formValues.iconKey || "generic"}
                onChange={(event) =>
                  setFormValues((current) => ({
                    ...current,
                    iconKey: event.target.value === "generic" ? "" : event.target.value,
                  }))
                }
              >
                {accommodationFeatureIconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Visibilité</p>
              <h2>Affichage</h2>
            </div>
            <input type="hidden" name="code" value={formValues.code} />
            <input type="hidden" name="sort_order" value={formValues.sortOrder} />
            <input type="hidden" name="description_fr" value={formValues.descriptionFr} />
            <input type="hidden" name="description_en" value={formValues.descriptionEn} />
            <AdminVisibilityField
              checked={formValues.isActive}
              label="Afficher cette caractéristique"
              onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))}
            />
          </section>
          <div className="admin-news-form-actions">
            <button className="admin-news-form-button primary" type="submit">
              {mode === "create" ? "Créer la caractéristique" : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
