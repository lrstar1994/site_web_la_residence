import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminNewsForm } from "@/components/admin/news/AdminNewsForm";
import { getAdminNews } from "@/lib/admin/news/get-admin-news";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouvel article | Administration",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function NewAdminNewsArticlePage({ params }: PageProps) {
  const { locale } = await params;

  if (locale !== "fr") {
    redirect("/fr/admin/actualites/nouveau");
  }

  await requireAdmin(locale as Locale);
  const news = await getAdminNews();

  if (!news.ok) {
    return (
      <section className="admin-news-error" role="alert">
        <h2>Impossible de charger les catégories.</h2>
        <p>Réessayez dans quelques instants.</p>
      </section>
    );
  }

  return <AdminNewsForm mode="create" categories={news.categories} />;
}
