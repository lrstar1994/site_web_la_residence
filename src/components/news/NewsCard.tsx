import Image from "next/image";
import type { MouseEvent } from "react";
import type { NewsArticle } from "@/data/news";
import type { Locale } from "@/lib/i18n/routing";

type NewsCardProps = {
  article: NewsArticle;
  locale: Locale;
  categoryLabel: string;
  formattedDate: string;
  labels: {
    readMore: string;
    readArticle: string;
  };
  onOpen: (articleId: string, trigger: HTMLButtonElement) => void;
};

export function NewsCard({
  article,
  locale,
  categoryLabel,
  formattedDate,
  labels,
  onOpen,
}: NewsCardProps) {
  function handleOpen(event: MouseEvent<HTMLButtonElement>) {
    onOpen(article.id, event.currentTarget);
  }

  return (
    <article className="article-card">
      <div className="card-image">
        <Image
          src={article.image}
          alt={article.alt[locale]}
          fill
          sizes="(max-width: 768px) 92vw, (max-width: 1200px) 45vw, 360px"
        />
      </div>
      <div className="card-content">
        <div className="card-meta">
          <span className="card-category">{categoryLabel}</span>
          <time className="card-date" dateTime={article.publishedAt}>
            {formattedDate}
          </time>
        </div>
        <h3 className="card-title">{article.title[locale]}</h3>
        <p className="card-excerpt">{article.excerpt[locale]}</p>
        <div className="card-footer">
          <button
            className="read-more"
            type="button"
            aria-haspopup="dialog"
            aria-label={labels.readArticle}
            onClick={handleOpen}
          >
            {labels.readMore}
          </button>
        </div>
      </div>
    </article>
  );
}
