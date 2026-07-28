import type { Metadata } from "next";
import { NewsExplorer } from "@/components/news/NewsExplorer";
import { NewsHeader } from "@/components/news/NewsHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import type { Locale } from "@/lib/i18n/routing";
import { getPublishedNews } from "@/lib/news/get-published-news";
import { getBaseUrl, getNewsMetadata } from "@/lib/seo/metadata";
import { buildNewsPageSchema } from "@/lib/seo/schema";
import { getTranslations } from "next-intl/server";

type PageProps = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getNewsMetadata(locale);
}

async function NewsPageState({
  locale,
  variant,
}: {
  locale: Locale;
  variant: "unavailable" | "no-published";
}) {
  const t = await getTranslations({ locale, namespace: "newsPage.empty" });
  const title =
    variant === "unavailable"
      ? t("unavailable_title")
      : t("no_published_title");
  const text =
    variant === "unavailable" ? t("unavailable_text") : t("no_published_text");

  return (
    <main className="news-feed-main">
      <div className="empty-state" role="status" aria-live="polite">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </main>
  );
}

export default async function ActualitesPage({ params }: PageProps) {
  const { locale } = await params;
  const baseUrl = getBaseUrl();
  const news = await getPublishedNews();
  const articles = news.ok ? news.articles : [];

  return (
    <div className="page-news">
      <NewsHeader locale={locale} />
      {news.ok && news.articles.length > 0 ? (
        <NewsExplorer
          articles={news.articles}
          categories={news.categories}
          locale={locale}
        />
      ) : (
        <NewsPageState
          locale={locale}
          variant={news.ok ? "no-published" : "unavailable"}
        />
      )}
      <JsonLd data={buildNewsPageSchema(baseUrl, locale, articles)} />
    </div>
  );
}
