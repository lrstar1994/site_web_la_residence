"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { KeyboardEvent } from "react";
import {
  archiveNewsAction,
  cancelScheduledNewsAction,
  publishNewsNowAction,
  republishNewsAction,
} from "@/app/[locale]/admin/(protected)/actualites/actions";
import { AdminConfirmDialog } from "@/components/admin/common/AdminConfirmDialog";
import { AdminNewsFilters } from "@/components/admin/news/AdminNewsFilters";
import type {
  AdminNewsFiltersState,
  AdminNewsStatusFilter,
} from "@/components/admin/news/AdminNewsFilters";
import { AdminNewsTable } from "@/components/admin/news/AdminNewsTable";
import type { AdminNewsQuickActionItem } from "@/components/admin/news/AdminNewsRow";
import type {
  AdminNewsArticle,
  AdminNewsCategory,
} from "@/lib/admin/news/admin-news-types";

type AdminRole = "admin" | "editor";

type AdminNewsExplorerProps = {
  articles: AdminNewsArticle[];
  categories: AdminNewsCategory[];
  role: AdminRole;
};

const initialFilters: AdminNewsFiltersState = {
  query: "",
  status: "all",
  category: "all",
  sort: "updated",
};

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function isScheduled(article: AdminNewsArticle) {
  return (
    article.status === "published" &&
    article.publishedAt !== null &&
    new Date(article.publishedAt).getTime() > Date.now()
  );
}

function getStatus(article: AdminNewsArticle) {
  if (isScheduled(article)) {
    return {
      label: "Programmé",
      tone: "scheduled" as const,
    };
  }

  if (article.status === "published") {
    return {
      label: "Publié",
      tone: "published" as const,
    };
  }

  if (article.status === "archived") {
    return {
      label: "Archivé",
      tone: "archived" as const,
    };
  }

  return {
    label: "Brouillon",
    tone: "draft" as const,
  };
}

function getQuickActions(article: AdminNewsArticle): AdminNewsQuickActionItem[] {
  if (isScheduled(article)) {
    return [
      {
        id: "cancel_schedule",
        label: "Annuler la programmation",
        title: "Annuler cette programmation ?",
        description:
          "L'article reviendra au statut brouillon et ne sera pas publié automatiquement.",
        confirmLabel: "Confirmer l'annulation",
        pendingLabel: "Annulation...",
      },
      {
        id: "archive",
        label: "Archiver",
        title: "Archiver cet article ?",
        description:
          "Il ne sera plus visible sur le site public, mais restera disponible dans le back-office.",
        confirmLabel: "Confirmer l'archivage",
        pendingLabel: "Archivage...",
        variant: "danger",
      },
    ];
  }

  if (article.status === "draft") {
    return [
      {
        id: "publish_now",
        label: "Publier maintenant",
        title: "Publier cet article maintenant ?",
        description: "Il sera immédiatement visible sur le site public.",
        confirmLabel: "Confirmer la publication",
        pendingLabel: "Publication...",
      },
      {
        id: "archive",
        label: "Archiver",
        title: "Archiver cet article ?",
        description:
          "Il ne sera plus visible sur le site public, mais restera disponible dans le back-office.",
        confirmLabel: "Confirmer l'archivage",
        pendingLabel: "Archivage...",
        variant: "danger",
      },
    ];
  }

  if (article.status === "archived") {
    return [
      {
        id: "republish",
        label: "Republier",
        title: "Republier cet article ?",
        description: "Il sera publié immédiatement avec la date actuelle.",
        confirmLabel: "Confirmer la republication",
        pendingLabel: "Republication...",
      },
    ];
  }

  return [
    {
      id: "archive",
      label: "Archiver",
      title: "Archiver cet article ?",
      description:
        "Il ne sera plus visible sur le site public, mais restera disponible dans le back-office.",
      confirmLabel: "Confirmer l'archivage",
      pendingLabel: "Archivage...",
      variant: "danger",
    },
  ];
}

function matchesStatus(article: AdminNewsArticle, status: AdminNewsStatusFilter) {
  if (status === "all") {
    return true;
  }

  if (status === "scheduled") {
    return isScheduled(article);
  }

  if (status === "published") {
    return article.status === "published" && !isScheduled(article);
  }

  return article.status === status;
}

function getTimestamp(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Non planifiée";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Indian/Antananarivo",
  }).format(new Date(value));
}

function isEnglishComplete(article: AdminNewsArticle) {
  return Boolean(
    article.titleEn.trim() &&
      article.excerptEn.trim() &&
      article.contentEn.trim() &&
      article.imageAltEn.trim(),
  );
}

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

export function AdminNewsExplorer({
  articles,
  categories,
  role,
}: AdminNewsExplorerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<AdminNewsFiltersState>(initialFilters);
  const [previewArticle, setPreviewArticle] = useState<AdminNewsArticle | null>(null);
  const [quickAction, setQuickAction] = useState<{
    article: AdminNewsArticle;
    action: AdminNewsQuickActionItem;
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const hasActiveFilters =
    filters.query.trim().length > 0 ||
    filters.status !== "all" ||
    filters.category !== "all" ||
    filters.sort !== "updated";

  const filteredArticles = useMemo(() => {
    const query = normalizeSearchValue(filters.query);

    return articles
      .filter((article) => {
        const searchable = normalizeSearchValue(
          `${article.titleFr} ${article.titleEn} ${article.code}`,
        );

        return (
          (!query || searchable.includes(query)) &&
          matchesStatus(article, filters.status) &&
          (filters.category === "all" || article.category?.code === filters.category)
        );
      })
      .sort((left, right) => {
        if (filters.sort === "published_desc") {
          return getTimestamp(right.publishedAt) - getTimestamp(left.publishedAt);
        }

        if (filters.sort === "published_asc") {
          return getTimestamp(left.publishedAt) - getTimestamp(right.publishedAt);
        }

        if (filters.sort === "title_asc") {
          return left.titleFr.localeCompare(right.titleFr, "fr-FR");
        }

        if (filters.sort === "title_desc") {
          return right.titleFr.localeCompare(left.titleFr, "fr-FR");
        }

        return getTimestamp(right.updatedAt) - getTimestamp(left.updatedAt);
      });
  }, [articles, filters]);

  useEffect(() => {
    if (!previewArticle) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPreviewArticle(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [previewArticle]);

  function handleFocusTrap(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = getFocusableElements(modalRef.current);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (!first || !last) {
      return;
    }

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleConfirmQuickAction() {
    if (!quickAction) {
      return;
    }

    const actionMap = {
      publish_now: publishNewsNowAction,
      archive: archiveNewsAction,
      cancel_schedule: cancelScheduledNewsAction,
      republish: republishNewsAction,
    };
    const selectedAction = actionMap[quickAction.action.id];
    const articleId = quickAction.article.id;

    startTransition(async () => {
      const result = await selectedAction(articleId);
      setStatusMessage({
        tone: result.ok ? "success" : "error",
        text: result.message,
      });
      setQuickAction(null);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  if (articles.length === 0) {
    return (
      <section className="admin-news-empty" role="status" aria-live="polite">
        <h2>Aucun article</h2>
        <p>Aucun article n’a encore été créé.</p>
      </section>
    );
  }

  return (
    <>
      {statusMessage ? (
        <section
          className={`admin-status-message ${statusMessage.tone}`}
          role={statusMessage.tone === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {statusMessage.text}
        </section>
      ) : null}
      <AdminNewsFilters
        filters={filters}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
      />
      {filteredArticles.length > 0 ? (
        <AdminNewsTable
          articles={filteredArticles}
          formatDate={formatDate}
          getStatus={getStatus}
          isEnglishComplete={isEnglishComplete}
          onPreview={setPreviewArticle}
          getQuickActions={getQuickActions}
          onQuickAction={(article, action) => {
            setStatusMessage(null);
            setQuickAction({ article, action });
          }}
        />
      ) : (
        <section className="admin-news-empty" role="status" aria-live="polite">
          <h2>Aucun résultat</h2>
          <p>Aucun article ne correspond aux filtres sélectionnés.</p>
          <button
            className="admin-news-reset"
            type="button"
            onClick={() => setFilters(initialFilters)}
          >
            Réinitialiser les filtres
          </button>
        </section>
      )}

      {previewArticle ? (
        <div className="admin-news-modal-layer" onKeyDown={handleFocusTrap}>
          <button
            className="admin-news-modal-backdrop"
            type="button"
            aria-label="Fermer la prévisualisation"
            onClick={() => setPreviewArticle(null)}
          />
          <article
            className="admin-news-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-news-preview-title"
            ref={modalRef}
          >
            <button
              className="admin-news-modal-close"
              type="button"
              aria-label="Fermer la prévisualisation"
              onClick={() => setPreviewArticle(null)}
              ref={closeButtonRef}
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="admin-news-modal-image">
              <Image
                src={previewArticle.imagePath}
                alt={previewArticle.imageAltFr}
                fill
                sizes="(max-width: 920px) 96vw, 920px"
              />
            </div>
            <div className="admin-news-modal-body">
              <span className={`admin-news-status ${getStatus(previewArticle).tone}`}>
                {getStatus(previewArticle).label}
              </span>
              <h2 id="admin-news-preview-title">{previewArticle.titleFr}</h2>
              <p>
                Catégorie : {previewArticle.category?.nameFr ?? "Catégorie inconnue"} ·
                Publication : {formatDate(previewArticle.publishedAt)} · Rôle : {role}
              </p>
              <div className="admin-news-preview-grid">
                <article>
                  <h3>Français</h3>
                  <p>
                    <strong>{previewArticle.titleFr}</strong>
                  </p>
                  <p>{previewArticle.excerptFr}</p>
                  {previewArticle.contentFr.split("\n\n").map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
                <article>
                  <h3>Anglais</h3>
                  <p>
                    <strong>{previewArticle.titleEn}</strong>
                  </p>
                  <p>{previewArticle.excerptEn}</p>
                  {previewArticle.contentEn.split("\n\n").map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
              </div>
            </div>
          </article>
        </div>
      ) : null}

      {quickAction ? (
        <AdminConfirmDialog
          title={quickAction.action.title}
          description={quickAction.action.description}
          confirmLabel={quickAction.action.confirmLabel}
          cancelLabel="Annuler"
          variant={quickAction.action.variant}
          pending={isPending}
          pendingLabel={quickAction.action.pendingLabel}
          onConfirm={handleConfirmQuickAction}
          onCancel={() => {
            if (!isPending) {
              setQuickAction(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
