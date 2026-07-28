import Image from "next/image";
import Link from "next/link";
import type { AdminNewsArticle } from "@/lib/admin/news/admin-news-types";

export type AdminNewsQuickActionItem = {
  id: "publish_now" | "archive" | "cancel_schedule" | "republish";
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  variant?: "default" | "danger";
};

type AdminNewsRowProps = {
  article: AdminNewsArticle;
  status: {
    label: string;
    tone: "published" | "draft" | "archived" | "scheduled";
  };
  publicationDate: string;
  updatedDate: string;
  englishComplete: boolean;
  onPreview: (article: AdminNewsArticle) => void;
  quickActions: AdminNewsQuickActionItem[];
  onQuickAction: (article: AdminNewsArticle, action: AdminNewsQuickActionItem) => void;
};

export function AdminNewsRow({
  article,
  status,
  publicationDate,
  updatedDate,
  englishComplete,
  onPreview,
  quickActions,
  onQuickAction,
}: AdminNewsRowProps) {
  return (
    <tr>
      <td data-label="Article">
        <div className="admin-news-article-cell">
          <div className="admin-news-thumb">
            <Image
              src={article.imagePath}
              alt={article.imageAltFr}
              fill
              sizes="64px"
            />
          </div>
          <div>
            <p className="admin-news-title">{article.titleFr}</p>
            <span className="admin-news-code">{article.code}</span>
            <span className="admin-news-en-state">
              {englishComplete ? "EN complet" : "EN incomplet"}
            </span>
          </div>
        </div>
      </td>
      <td data-label="Catégorie">
        <span className="admin-news-category">
          {article.category?.nameFr ?? "Catégorie inconnue"}
          {article.category && !article.category.isActive ? (
            <span className="admin-news-inactive">Inactive</span>
          ) : null}
        </span>
      </td>
      <td data-label="Statut">
        <span className={`admin-news-status ${status.tone}`}>{status.label}</span>
      </td>
      <td data-label="Publication">{publicationDate}</td>
      <td data-label="Dernière modification">{updatedDate}</td>
      <td data-label="Actions">
        <div className="admin-news-actions">
          <button
            className="admin-news-action"
            type="button"
            onClick={() => onPreview(article)}
          >
            Voir
          </button>
          <Link
            className="admin-news-action"
            href={`/fr/admin/actualites/${article.id}/modifier`}
          >
            Modifier
          </Link>
          {quickActions.map((action) => (
            <button
              key={action.id}
              className={`admin-news-action ${action.variant === "danger" ? "danger" : ""}`}
              type="button"
              aria-haspopup="dialog"
              onClick={() => onQuickAction(article, action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}
