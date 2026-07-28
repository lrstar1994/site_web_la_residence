"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createAdminNewsArticle,
  updateAdminNewsArticle,
} from "@/app/[locale]/admin/(protected)/actualites/actions";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminNewsFormActions } from "@/components/admin/news/AdminNewsFormActions";
import { AdminNewsFormFields } from "@/components/admin/news/AdminNewsFormFields";
import { AdminNewsStatusPanel } from "@/components/admin/news/AdminNewsStatusPanel";
import {
  type AdminNewsArticle,
  type AdminNewsCategory,
  emptyAdminNewsFormValues,
  type AdminNewsFormState,
  type AdminNewsFormValues,
} from "@/lib/admin/news/admin-news-types";

type AdminNewsFormProps = {
  mode: "create" | "edit";
  categories: AdminNewsCategory[];
  article?: AdminNewsArticle;
};

function toMadagascarDateTimeLocal(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const madagascarDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  const year = madagascarDate.getUTCFullYear();
  const month = String(madagascarDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(madagascarDate.getUTCDate()).padStart(2, "0");
  const hour = String(madagascarDate.getUTCHours()).padStart(2, "0");
  const minute = String(madagascarDate.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function getStatusLabel(article?: AdminNewsArticle) {
  if (!article) {
    return "Brouillon";
  }

  if (
    article.status === "published" &&
    article.publishedAt &&
    new Date(article.publishedAt).getTime() > Date.now()
  ) {
    return `Programmé pour le ${new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Indian/Antananarivo",
    }).format(new Date(article.publishedAt))}`;
  }

  if (article.status === "published") {
    return "Publié";
  }

  if (article.status === "archived") {
    return "Archivé";
  }

  return "Brouillon";
}

function getInitialValues(article?: AdminNewsArticle): AdminNewsFormValues {
  if (!article) {
    return emptyAdminNewsFormValues;
  }

  return {
    code: article.code,
    categoryId: article.categoryId,
    imagePath: article.imagePath,
    imageAltFr: article.imageAltFr,
    imageAltEn: article.imageAltEn,
    titleFr: article.titleFr,
    titleEn: article.titleEn,
    excerptFr: article.excerptFr,
    excerptEn: article.excerptEn,
    contentFr: article.contentFr,
    contentEn: article.contentEn,
    scheduledAt: toMadagascarDateTimeLocal(article.publishedAt),
  };
}

export function AdminNewsForm({ mode, categories, article }: AdminNewsFormProps) {
  const initialValues = useMemo(() => getInitialValues(article), [article]);
  const initialState = useMemo<AdminNewsFormState>(
    () => ({
      ok: false,
      message: "",
      fieldErrors: {},
      values: initialValues,
    }),
    [initialValues],
  );
  const action =
    mode === "create"
      ? createAdminNewsArticle
      : updateAdminNewsArticle.bind(null, article?.id ?? "");
  const [state, formAction] = useActionState(action, initialState);
  const [values, setValues] = useState<AdminNewsFormValues>(initialValues);
  const [selectedIntent, setSelectedIntent] = useState("");

  function updateField(field: keyof AdminNewsFormValues, value: string) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <form className="admin-news-form" action={formAction}>
      <header className="admin-news-form-header">
        <AdminBackButton fallbackHref="/fr/admin/actualites" />
        <div>
          <p className="admin-section-kicker">Actualités</p>
          <h2>{mode === "create" ? "Nouvel article" : "Modifier l'article"}</h2>
          <p>
            Renseignez les contenus français et anglais, puis choisissez le mode de
            publication.
          </p>
        </div>
      </header>

      {state.message ? (
        <section className="admin-news-form-alert" role="alert">
          {state.message}
        </section>
      ) : null}

      <div className="admin-news-form-grid">
        <AdminNewsFormFields values={values} errors={state.fieldErrors} onChange={updateField} />
        <div className="admin-news-form-sticky">
          <AdminNewsStatusPanel
            mode={mode}
            values={values}
            errors={state.fieldErrors}
            categories={categories}
            article={article}
            statusLabel={getStatusLabel(article)}
            selectedIntent={selectedIntent}
            onChange={updateField}
          />
          <AdminNewsFormActions mode={mode} onIntentChange={setSelectedIntent} />
        </div>
      </div>
    </form>
  );
}
