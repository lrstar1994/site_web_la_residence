"use client";

import { useActionState, useMemo, useState } from "react";
import { createVenueSetupAction, updateVenueSetupAction } from "@/app/[locale]/admin/(protected)/salles/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import { venueSetupIconOptions } from "@/components/venues/VenueSetupIcon";
import {
  emptyVenueSetupFormValues,
  type AdminVenueSetup,
  type AdminVenueSetupFormState,
  type AdminVenueSetupFormValues,
} from "@/lib/admin/venues/admin-venue-types";

function initialValues(setup?: AdminVenueSetup): AdminVenueSetupFormValues {
  if (!setup) return emptyVenueSetupFormValues;
  return { code: setup.code, nameFr: setup.nameFr, nameEn: setup.nameEn, iconKey: setup.iconKey, sortOrder: String(setup.sortOrder), isActive: setup.isActive };
}

export function AdminVenueSetupForm({ mode, setup }: { mode: "create" | "edit"; setup?: AdminVenueSetup }) {
  const values = useMemo(() => initialValues(setup), [setup]);
  const initialState = useMemo<AdminVenueSetupFormState>(() => ({ ok: false, message: "", fieldErrors: {}, values }), [values]);
  const action = mode === "create" ? createVenueSetupAction : updateVenueSetupAction.bind(null, setup?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminVenueSetupFormValues>(state.values);
  return (
    <form className="admin-news-form" action={formAction}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/salles/configurations" />
        <div>
          <p className="admin-section-kicker">Configurations</p>
          <h1>{mode === "create" ? "Nouvelle configuration" : "Modifier la configuration"}</h1>
          <p>Ces configurations peuvent être associées à plusieurs salles.</p>
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
              <select name="icon_key" value={formValues.iconKey || "generic"} onChange={(event) => setFormValues((current) => ({ ...current, iconKey: event.target.value === "generic" ? "" : event.target.value }))}>
                {venueSetupIconOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
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
            <AdminVisibilityField
              checked={formValues.isActive}
              label="Afficher cette configuration"
              onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))}
            />
          </section>
          <div className="admin-news-form-actions">
            <button className="admin-news-form-button primary" type="submit">{mode === "create" ? "Créer la configuration" : "Enregistrer les modifications"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}
