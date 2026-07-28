import { AdminNewsImageField } from "@/components/admin/news/AdminNewsImageField";
import type {
  AdminNewsFormState,
  AdminNewsFormValues,
} from "@/lib/admin/news/admin-news-types";

type AdminNewsFormFieldsProps = {
  values: AdminNewsFormValues;
  errors: AdminNewsFormState["fieldErrors"];
  onChange: (field: keyof AdminNewsFormValues, value: string) => void;
};

function fieldErrorId(field: keyof AdminNewsFormValues) {
  return `admin-news-${field}-error`;
}

function fieldToInputName(field: keyof AdminNewsFormValues) {
  const names: Record<keyof AdminNewsFormValues, string> = {
    code: "code",
    categoryId: "category_id",
    imagePath: "image_path",
    imageAltFr: "image_alt_fr",
    imageAltEn: "image_alt_en",
    titleFr: "title_fr",
    titleEn: "title_en",
    excerptFr: "excerpt_fr",
    excerptEn: "excerpt_en",
    contentFr: "content_fr",
    contentEn: "content_en",
    scheduledAt: "scheduled_at",
  };

  return names[field];
}

type TextFieldProps = {
  field: keyof AdminNewsFormValues;
  label: string;
  value: string;
  error?: string;
  maxLength?: number;
  minLength?: number;
  onChange: (field: keyof AdminNewsFormValues, value: string) => void;
};

function TextField({
  field,
  label,
  value,
  error,
  maxLength,
  minLength,
  onChange,
}: TextFieldProps) {
  const errorId = fieldErrorId(field);

  return (
    <label className="admin-news-form-field">
      <span>{label}</span>
      <input
        name={fieldToInputName(field)}
        value={value}
        minLength={minLength}
        maxLength={maxLength}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(field, event.target.value)}
      />
      {error ? (
        <strong id={errorId} className="admin-news-form-error">
          {error}
        </strong>
      ) : null}
    </label>
  );
}

function TextArea({
  field,
  label,
  value,
  error,
  maxLength,
  rows = 5,
  onChange,
}: {
  field: keyof AdminNewsFormValues;
  label: string;
  value: string;
  error?: string;
  maxLength?: number;
  rows?: number;
  onChange: (field: keyof AdminNewsFormValues, value: string) => void;
}) {
  const errorId = fieldErrorId(field);

  return (
    <label className="admin-news-form-field">
      <span>{label}</span>
      <textarea
        name={fieldToInputName(field)}
        value={value}
        maxLength={maxLength}
        rows={rows}
        required
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(field, event.target.value)}
      />
      {error ? (
        <strong id={errorId} className="admin-news-form-error">
          {error}
        </strong>
      ) : null}
    </label>
  );
}

export function AdminNewsFormFields({
  values,
  errors,
  onChange,
}: AdminNewsFormFieldsProps) {
  return (
    <div className="admin-news-form-main">
      <AdminNewsImageField values={values} error={errors.imagePath} onChange={onChange} />
      <input type="hidden" name="image_alt_fr" value={values.imageAltFr} />
      <input type="hidden" name="image_alt_en" value={values.imageAltEn} />

      <section className="admin-news-form-card">
        <div className="admin-news-form-section-heading">
          <p>Contenu français</p>
          <h2>Version française</h2>
        </div>
        <TextField
          field="titleFr"
          label="Titre français"
          value={values.titleFr}
          error={errors.titleFr}
          minLength={3}
          maxLength={200}
          onChange={onChange}
        />
        <TextArea
          field="excerptFr"
          label="Résumé français"
          value={values.excerptFr}
          error={errors.excerptFr}
          maxLength={500}
          rows={4}
          onChange={onChange}
        />
        <TextArea
          field="contentFr"
          label="Contenu français"
          value={values.contentFr}
          error={errors.contentFr}
          maxLength={20000}
          rows={10}
          onChange={onChange}
        />
      </section>

      <section className="admin-news-form-card">
        <div className="admin-news-form-section-heading">
          <p>Contenu anglais</p>
          <h2>Version anglaise obligatoire</h2>
        </div>
        <p className="admin-news-form-note">
          La version anglaise est obligatoire pour publier l&apos;article.
        </p>
        <TextField
          field="titleEn"
          label="Titre anglais"
          value={values.titleEn}
          error={errors.titleEn}
          minLength={3}
          maxLength={200}
          onChange={onChange}
        />
        <TextArea
          field="excerptEn"
          label="Résumé anglais"
          value={values.excerptEn}
          error={errors.excerptEn}
          maxLength={500}
          rows={4}
          onChange={onChange}
        />
        <TextArea
          field="contentEn"
          label="Contenu anglais"
          value={values.contentEn}
          error={errors.contentEn}
          maxLength={20000}
          rows={10}
          onChange={onChange}
        />
      </section>
    </div>
  );
}
