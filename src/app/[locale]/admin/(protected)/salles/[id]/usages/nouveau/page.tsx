import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminVenueUsePresentationForm } from "@/components/admin/venues/AdminVenueUsePresentationForm";
import { getAdminVenue, getAdminVenueUseTypes } from "@/lib/admin/venues/get-admin-venues";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = { title: "Ajouter un usage a une salle | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function NewVenueUsePresentationPage({ params, searchParams }: PageProps) {
  const { locale, id } = await params;
  const query = (await searchParams) ?? {};
  if (locale !== "fr") redirect(`/fr/admin/salles/${id}/usages/nouveau`);

  const [venueResult, useTypesResult] = await Promise.all([getAdminVenue(id), getAdminVenueUseTypes()]);
  if (!venueResult.ok && venueResult.error === "not_found") notFound();
  if (!venueResult.ok || !useTypesResult.ok) {
    return (
      <section className="admin-news-empty" role="alert">
        <h1>Ajouter un usage</h1>
        <p>Impossible de charger les donnees de cette salle.</p>
      </section>
    );
  }

  const useTypeId = typeof query.useTypeId === "string" ? query.useTypeId : undefined;

  return (
    <AdminVenueUsePresentationForm
      mode="create"
      venue={venueResult.venue}
      useTypes={useTypesResult.useTypes}
      selectedUseTypeId={useTypeId}
    />
  );
}
