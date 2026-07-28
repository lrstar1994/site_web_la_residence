import type { Metadata } from "next";
import { AdminAccommodationsExplorer } from "@/components/admin/accommodations/AdminAccommodationsExplorer";
import { AdminAccommodationsHeader } from "@/components/admin/accommodations/AdminAccommodationsHeader";
import { getAdminAccommodations } from "@/lib/admin/accommodations/get-admin-accommodations";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Hébergements | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminAccommodationsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};

  await requireAdmin(locale as Locale);
  const result = await getAdminAccommodations();

  return (
    <section className="admin-news-page">
      {query.notice === "created" ? <section className="admin-news-success" role="status">Hébergement créé avec succès.</section> : null}
      {query.notice === "updated" ? <section className="admin-news-success" role="status">Hébergement mis à jour avec succès.</section> : null}
      {query.notice === "deleted" ? <section className="admin-news-success" role="status">Hebergement supprime definitivement.</section> : null}
      {result.ok ? (
        <>
          <AdminAccommodationsHeader />
          <AdminAccommodationsExplorer accommodations={result.accommodations} />
        </>
      ) : (
        <section className="admin-news-error" role="alert">
          <h2>Impossible de charger les hébergements.</h2>
          <p>Réessayez dans quelques instants.</p>
        </section>
      )}
    </section>
  );
}
