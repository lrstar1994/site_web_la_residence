import type { AdminNewsArticle } from "@/lib/admin/news/admin-news-types";
import {
  AdminNewsRow,
  type AdminNewsQuickActionItem,
} from "@/components/admin/news/AdminNewsRow";

type AdminNewsTableProps = {
  articles: AdminNewsArticle[];
  formatDate: (date: string | null) => string;
  getStatus: (article: AdminNewsArticle) => {
    label: string;
    tone: "published" | "draft" | "archived" | "scheduled";
  };
  isEnglishComplete: (article: AdminNewsArticle) => boolean;
  onPreview: (article: AdminNewsArticle) => void;
  getQuickActions: (article: AdminNewsArticle) => AdminNewsQuickActionItem[];
  onQuickAction: (article: AdminNewsArticle, action: AdminNewsQuickActionItem) => void;
};

export function AdminNewsTable({
  articles,
  formatDate,
  getStatus,
  isEnglishComplete,
  onPreview,
  getQuickActions,
  onQuickAction,
}: AdminNewsTableProps) {
  return (
    <section className="admin-news-table-card" aria-label="Liste des articles">
      <table className="admin-news-table">
        <thead>
          <tr>
            <th scope="col">Article</th>
            <th scope="col">Catégorie</th>
            <th scope="col">Statut</th>
            <th scope="col">Publication</th>
            <th scope="col">Dernière modification</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {articles.map((article) => (
            <AdminNewsRow
              key={article.id}
              article={article}
              status={getStatus(article)}
              publicationDate={formatDate(article.publishedAt)}
              updatedDate={formatDate(article.updatedAt)}
              englishComplete={isEnglishComplete(article)}
              onPreview={onPreview}
              quickActions={getQuickActions(article)}
              onQuickAction={onQuickAction}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}
