import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminVenueUseTypesExplorer } from "@/components/admin/venues/AdminVenueUseTypesExplorer";
import { getAdminVenueUseTypes } from "@/lib/admin/venues/get-admin-venues";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "Types d’usage des salles | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function VenueUseTypesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = (await searchParams) ?? {};
  if (locale !== "fr") redirect("/fr/admin/salles/usages");

  const result = await getAdminVenueUseTypes();

  return (
    <section className="admin-news-page">
      {query.notice === "created" ? <section className="admin-news-success" role="status">Type d&apos;usage cree avec succes.</section> : null}
      {query.notice === "updated" ? <section className="admin-news-success" role="status">Type d&apos;usage mis a jour avec succes.</section> : null}
      {result.ok ? (
        <AdminVenueUseTypesExplorer useTypes={result.useTypes} />
      ) : (
        <section className="admin-news-error" role="alert">
          <h2>Impossible de charger les types d&apos;usage.</h2>
          <p>Reessayez dans quelques instants.</p>
        </section>
      )}
    </section>
  );
}
