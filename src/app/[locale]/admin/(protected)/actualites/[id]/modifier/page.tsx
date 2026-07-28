import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminNewsForm } from "@/components/admin/news/AdminNewsForm";
import { getAdminNewsArticle } from "@/lib/admin/news/get-admin-news-article";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier un article | Administration",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function EditAdminNewsArticlePage({ params }: PageProps) {
  const { locale, id } = await params;

  if (locale !== "fr") {
    redirect(`/fr/admin/actualites/${id}/modifier`);
  }

  const result = await getAdminNewsArticle(id);

  if (!result.ok && result.error === "not_found") {
    notFound();
  }

  if (!result.ok) {
    return (
      <section className="admin-news-error" role="alert">
        <h2>Impossible de charger l&apos;article.</h2>
        <p>Réessayez dans quelques instants.</p>
      </section>
    );
  }

  return (
    <AdminNewsForm
      mode="edit"
      article={result.article}
      categories={result.categories}
    />
  );
}
