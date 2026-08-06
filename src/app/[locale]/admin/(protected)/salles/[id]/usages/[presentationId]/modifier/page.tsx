import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminVenueUsePresentationForm } from "@/components/admin/venues/AdminVenueUsePresentationForm";
import {
  getAdminVenue,
  getAdminVenueUsePresentation,
  getAdminVenueUseTypes,
} from "@/lib/admin/venues/get-admin-venues";

type PageProps = { params: Promise<{ locale: string; id: string; presentationId: string }> };

export const metadata: Metadata = { title: "Modifier un usage de salle | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function EditVenueUsePresentationPage({ params }: PageProps) {
  const { locale, id, presentationId } = await params;
  if (locale !== "fr") redirect(`/fr/admin/salles/${id}/usages/${presentationId}/modifier`);

  const [venueResult, useTypesResult, presentationResult] = await Promise.all([
    getAdminVenue(id),
    getAdminVenueUseTypes(),
    getAdminVenueUsePresentation(id, presentationId),
  ]);

  if ((!venueResult.ok && venueResult.error === "not_found") || (!presentationResult.ok && presentationResult.error === "not_found")) {
    notFound();
  }

  if (!venueResult.ok || !useTypesResult.ok || !presentationResult.ok) {
    return (
      <section className="admin-news-empty" role="alert">
        <h1>Modifier cet usage</h1>
        <p>Impossible de charger cet usage.</p>
      </section>
    );
  }

  return (
    <AdminVenueUsePresentationForm
      mode="edit"
      venue={venueResult.venue}
      useTypes={useTypesResult.useTypes}
      presentation={presentationResult.presentation}
    />
  );
}
