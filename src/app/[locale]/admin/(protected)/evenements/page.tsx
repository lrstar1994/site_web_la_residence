import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminEventServicesExplorer } from "@/components/admin/events/AdminEventServicesExplorer";
import { AdminEventServicesHeader } from "@/components/admin/events/AdminEventServicesHeader";
import { getAdminEventServices } from "@/lib/admin/events/get-admin-event-services";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prestations événementielles | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AdminEventServicesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};

  if (locale !== "fr") {
    redirect("/fr/admin/evenements");
  }

  await requireAdmin(locale as Locale);
  const result = await getAdminEventServices();

  return (
    <section className="admin-news-page">
      {query.notice === "created" ? (
        <section className="admin-news-success" role="status">
          Prestation créée avec succès.
        </section>
      ) : null}
      {query.notice === "updated" ? (
        <section className="admin-news-success" role="status">
          Prestation mise à jour avec succès.
        </section>
      ) : null}
      {result.ok ? (
        <>
          <AdminEventServicesHeader />
          <AdminEventServicesExplorer services={result.services} />
        </>
      ) : (
        <section className="admin-news-error" role="alert">
          <h2>Impossible de charger les prestations.</h2>
          <p>Réessayez dans quelques instants.</p>
        </section>
      )}
    </section>
  );
}
