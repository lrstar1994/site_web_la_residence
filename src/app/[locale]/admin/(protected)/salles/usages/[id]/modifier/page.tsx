import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminVenueUseTypeForm } from "@/components/admin/venues/AdminVenueUseTypeForm";
import { getAdminVenueUseType } from "@/lib/admin/venues/get-admin-venues";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export const metadata: Metadata = { title: "Modifier un usage de salle | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function EditVenueUseTypePage({ params }: PageProps) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/salles/usages/${id}/modifier`);

  const result = await getAdminVenueUseType(id);
  if (!result.ok && result.error === "not_found") notFound();
  if (!result.ok) {
    return (
      <section className="admin-news-empty" role="alert">
        <h1>Modifier cet usage</h1>
        <p>Impossible de charger ce type d&apos;usage.</p>
      </section>
    );
  }

  return <AdminVenueUseTypeForm mode="edit" useType={result.useType} />;
}
