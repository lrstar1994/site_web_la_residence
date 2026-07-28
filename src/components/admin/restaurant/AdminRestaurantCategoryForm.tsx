"use client";

import { useActionState, useMemo, useState } from "react";
import { createRestaurantCategoryAction, updateRestaurantCategoryAction } from "@/app/[locale]/admin/(protected)/restaurant/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminVisibilityField } from "@/components/admin/common/AdminVisibilityField";
import { emptyRestaurantCategoryFormValues, type AdminRestaurantCategory, type AdminRestaurantCategoryFormValues, type AdminRestaurantFormState } from "@/lib/admin/restaurant/admin-restaurant-types";

type Props = { mode: "create" | "edit"; category?: AdminRestaurantCategory };

function initialValues(category?: AdminRestaurantCategory): AdminRestaurantCategoryFormValues {
  if (!category) return emptyRestaurantCategoryFormValues;
  return {
    code: category.code,
    nameFr: category.nameFr,
    nameEn: category.nameEn,
    descriptionFr: category.descriptionFr,
    descriptionEn: category.descriptionEn,
    sortOrder: String(category.sortOrder),
    isActive: category.isActive,
  };
}

function Field({ name, label, value, error, onChange }: { name: string; label: string; value: string; error?: string; onChange: (value: string) => void }) {
  return <label className="admin-news-form-field"><span>{label}</span><input name={name} value={value} required onChange={(event) => onChange(event.target.value)} />{error ? <strong className="admin-news-form-error">{error}</strong> : null}</label>;
}

export function AdminRestaurantCategoryForm({ mode, category }: Props) {
  const values = useMemo(() => initialValues(category), [category]);
  const initialState = useMemo<AdminRestaurantFormState<AdminRestaurantCategoryFormValues>>(() => ({ ok: false, message: "", fieldErrors: {}, values }), [values]);
  const action = mode === "create" ? createRestaurantCategoryAction : updateRestaurantCategoryAction.bind(null, category?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [formValues, setFormValues] = useState<AdminRestaurantCategoryFormValues>(state.values);
  const update = (field: keyof AdminRestaurantCategoryFormValues, value: string) => setFormValues((current) => ({ ...current, [field]: value }));

  return (
    <form className="admin-news-form" action={formAction}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/restaurant/categories" />
        <div>
          <p className="admin-section-kicker">Restaurant</p>
          <h1>{mode === "create" ? "Nouvelle catégorie" : "Modifier la catégorie"}</h1>
          <p>Les catégories alimentent les filtres de la page publique Restaurant.</p>
        </div>
      </header>
      {state.message ? <section className="admin-news-form-alert" role="alert">{state.message}</section> : null}
      <div className="admin-news-form-grid">
        <div className="admin-news-form-main">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Informations principales</p><h2>Libellés</h2></div>
            <Field name="name_fr" label="Nom français" value={formValues.nameFr} error={state.fieldErrors.nameFr} onChange={(value) => update("nameFr", value)} />
            <Field name="name_en" label="Nom anglais" value={formValues.nameEn} error={state.fieldErrors.nameEn} onChange={(value) => update("nameEn", value)} />
          </section>
        </div>
        <div className="admin-news-form-sticky">
          <section className="admin-news-form-card">
            <div className="admin-news-form-section-heading"><p>Visibilité</p><h2>Affichage</h2></div>
            <input type="hidden" name="code" value={formValues.code} />
            <input type="hidden" name="sort_order" value={formValues.sortOrder} />
            <input type="hidden" name="description_fr" value={formValues.descriptionFr} />
            <input type="hidden" name="description_en" value={formValues.descriptionEn} />
            <AdminVisibilityField checked={formValues.isActive} label="Afficher cette catégorie" onChange={(checked) => setFormValues((current) => ({ ...current, isActive: checked }))} />
          </section>
          <div className="admin-news-form-actions"><button className="admin-news-form-button primary" type="submit">{mode === "create" ? "Créer la catégorie" : "Enregistrer les modifications"}</button></div>
        </div>
      </div>
    </form>
  );
}
