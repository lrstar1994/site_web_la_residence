import type {
  AdminNewsArticle,
  AdminNewsCategory,
  AdminNewsFormState,
  AdminNewsFormValues,
} from "@/lib/admin/news/admin-news-types";

type AdminNewsStatusPanelProps = {
  mode: "create" | "edit";
  values: AdminNewsFormValues;
  errors: AdminNewsFormState["fieldErrors"];
  categories: AdminNewsCategory[];
  article?: AdminNewsArticle;
  statusLabel: string;
  selectedIntent: string;
  onChange: (field: keyof AdminNewsFormValues, value: string) => void;
};

function errorId(field: keyof AdminNewsFormValues) {
  return `admin-news-${field}-error`;
}

export function AdminNewsStatusPanel({
  mode,
  values,
  errors,
  categories,
  article,
  statusLabel,
  selectedIntent,
  onChange,
}: AdminNewsStatusPanelProps) {
  const selectedCategory = categories.find((category) => category.id === values.categoryId);
  const keepsInactiveCategory =
    mode === "edit" &&
    article?.categoryId === values.categoryId &&
    selectedCategory?.isActive === false;

  return (
    <aside className="admin-news-form-side" aria-label="Paramètres de publication">
      <input type="hidden" name="code" value={values.code} />
      <section className="admin-news-form-card">
        <div className="admin-news-form-section-heading">
          <p>Informations principales</p>
          <h2>Catégorie</h2>
        </div>

        <label className="admin-news-form-field">
          <span>Catégorie</span>
          <select
            name="category_id"
            value={values.categoryId}
            required
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={errors.categoryId ? errorId("categoryId") : undefined}
            onChange={(event) => onChange("categoryId", event.target.value)}
          >
            <option value="">Choisir une catégorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.nameFr}
                {category.isActive ? "" : " — inactive"}
              </option>
            ))}
          </select>
          {keepsInactiveCategory ? (
            <small className="admin-news-form-warning">
              Cette catégorie est inactive. Vous pouvez la conserver pour cet article ou choisir
              une catégorie active.
            </small>
          ) : null}
          {errors.categoryId ? (
            <strong id={errorId("categoryId")} className="admin-news-form-error">
              {errors.categoryId}
            </strong>
          ) : null}
        </label>
      </section>

      <section className="admin-news-form-card">
        <div className="admin-news-form-section-heading">
          <p>Publication</p>
          <h2>{statusLabel}</h2>
        </div>
        {selectedIntent === "schedule" ? (
          <label className="admin-news-form-field">
            <span>Date de programmation</span>
            <input
              name="scheduled_at"
              type="datetime-local"
              value={values.scheduledAt}
              aria-invalid={Boolean(errors.scheduledAt)}
              aria-describedby={errors.scheduledAt ? errorId("scheduledAt") : undefined}
              onChange={(event) => onChange("scheduledAt", event.target.value)}
            />
            <small>Heure locale Madagascar.</small>
            {errors.scheduledAt ? (
              <strong id={errorId("scheduledAt")} className="admin-news-form-error">
                {errors.scheduledAt}
              </strong>
            ) : null}
          </label>
        ) : (
          <input type="hidden" name="scheduled_at" value={values.scheduledAt} />
        )}
        {errors.intent ? (
          <strong className="admin-news-form-error" role="alert">
            {errors.intent}
          </strong>
        ) : null}
      </section>

      <section className="admin-news-form-card admin-news-form-preview-card">
        <div className="admin-news-form-section-heading">
          <p>Prévisualisation</p>
          <h2>{values.titleFr || "Titre de l'article"}</h2>
        </div>
        <span className="admin-news-form-preview-category">
          {selectedCategory?.nameFr ?? "Catégorie non choisie"}
        </span>
        <p>{values.excerptFr || "Le résumé français apparaîtra ici."}</p>
      </section>
    </aside>
  );
}
