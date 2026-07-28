import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNewsExplorer } from "@/components/admin/news/AdminNewsExplorer";
import { AdminNewsHeader } from "@/components/admin/news/AdminNewsHeader";
import { getAdminNews } from "@/lib/admin/news/get-admin-news";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Actualités | Administration",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function AdminNewsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};

  if (locale !== "fr") {
    redirect("/fr/admin/actualites");
  }

  const admin = await requireAdmin(locale as Locale);
  const news = await getAdminNews();

  return (
    <section className="admin-news-page">
      {news.ok ? (
        <>
          {query.notice === "created" ? (
            <section className="admin-news-success" role="status">
              Article créé avec succès.
            </section>
          ) : null}
          {query.notice === "updated" ? (
            <section className="admin-news-success" role="status">
              Article mis à jour avec succès.
            </section>
          ) : null}
          <AdminNewsHeader />
          <AdminNewsExplorer
            articles={news.articles}
            categories={news.categories}
            role={admin.role}
          />
        </>
      ) : (
        <section className="admin-news-error" role="alert">
          <h2>Impossible de charger les actualités.</h2>
          <p>Réessayez dans quelques instants.</p>
        </section>
      )}
    </section>
  );
}
