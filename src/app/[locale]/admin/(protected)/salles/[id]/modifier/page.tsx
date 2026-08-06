import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminVenueForm } from "@/components/admin/venues/AdminVenueForm";
import { getAdminVenue, getAdminVenueSetups, getAdminVenueUseTypes } from "@/lib/admin/venues/get-admin-venues";

type PageProps = { params: Promise<{ locale: string; id: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Modifier une salle | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function EditVenuePage({ params }: PageProps) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/salles/${id}/modifier`);
  const [venue, setups, useTypes] = await Promise.all([getAdminVenue(id), getAdminVenueSetups(), getAdminVenueUseTypes()]);
  if (!venue.ok && venue.error === "not_found") notFound();
  if (!venue.ok) return <section className="admin-news-empty" role="alert"><h1>Modifier la salle</h1><p>Impossible de charger la salle.</p></section>;
  return <AdminVenueForm mode="edit" venue={venue.venue} setups={setups.ok ? setups.setups : []} useTypes={useTypes.ok ? useTypes.useTypes : []} />;
}
