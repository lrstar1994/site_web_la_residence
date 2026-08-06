"use client";

import { useActionState, useMemo, useState } from "react";
import { createVenueUseTypeAction, updateVenueUseTypeAction } from "@/app/[locale]/admin/(protected)/salles/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import {
  emptyVenueUseTypeFormValues,
  type AdminVenueUseType,
  type AdminVenueUseTypeFormState,
  type AdminVenueUseTypeFormValues,
} from "@/lib/admin/venues/admin-venue-types";

function initialValues(useType?: AdminVenueUseType): AdminVenueUseTypeFormValues {
  if (!useType) return emptyVenueUseTypeFormValues;
  return {
    code: useType.code,
    nameFr: useType.nameFr,
    nameEn: useType.nameEn,
    sortOrder: String(useType.sortOrder),
    isActive: useType.isActive,
  };
}

export function AdminVenueUseTypeForm({ mode, useType }: { mode: "create" | "edit"; useType?: AdminVenueUseType }) {
  const values = useMemo(() => initialValues(useType), [useType]);
  const initialState = useMemo<AdminVenueUseTypeFormState>(() => ({ ok: false, message: "", fieldErrors: {}, values }), [values]);
  const action = mode === "create" ? createVenueUseTypeAction : updateVenueUseTypeAction.bind(null, useType?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminVenueUseTypeFormValues>(state.values);

  return (
    <form className="admin-news-form" action={formAction}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/salles/usages" />
        <div>
          <p className="admin-section-kicker">Types d&apos;usage</p>
          <h1>{mode === "create" ? "Nouvel usage" : "Modifier cet usage"}</h1>
          <p>Ces usages peuvent etre associes a plusieurs salles.</p>
        </div>
      </header>
      {state.message ? <section className="admin-news-form-alert" role="alert">{state.message}</section> : null}
      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Informations principales</p>
              <h2>Libelles</h2>
            </div>
            <label className="admin-news-form-field">
              <span>Nom francais</span>
              <input name="name_fr" value={formValues.nameFr} required onChange={(event) => setFormValues((current) => ({ ...current, nameFr: event.target.value }))} />
              {state.fieldErrors.nameFr ? <strong className="admin-news-form-error">{state.fieldErrors.nameFr}</strong> : null}
            </label>
            <label className="admin-news-form-field">
              <span>Nom anglais</span>
              <input name="name_en" value={formValues.nameEn} required onChange={(event) => setFormValues((current) => ({ ...current, nameEn: event.target.value }))} />
              {state.fieldErrors.nameEn ? <strong className="admin-news-form-error">{state.fieldErrors.nameEn}</strong> : null}
            </label>
          </section>
        </div>
        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading">
              <p>Visibilite</p>
              <h2>Affichage</h2>
            </div>
            <input type="hidden" name="code" value={formValues.code} />
            <input type="hidden" name="sort_order" value={formValues.sortOrder} />
            <AdminVisibilityField
              checked={formValues.isActive}
              label="Afficher ce type d&apos;usage"
              onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))}
            />
          </section>
          <div className="admin-news-form-actions">
            <button className="admin-news-form-button primary" type="submit">
              {mode === "create" ? "Creer cet usage" : "Enregistrer les modifications"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
