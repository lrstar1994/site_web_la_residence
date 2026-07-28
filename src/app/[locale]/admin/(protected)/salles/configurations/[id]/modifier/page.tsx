import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminVenueSetupForm } from "@/components/admin/venues/AdminVenueSetupForm";
import { getAdminVenueSetup } from "@/lib/admin/venues/get-admin-venues";

type PageProps = { params: Promise<{ locale: string; id: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Modifier une configuration | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function EditVenueSetupPage({ params }: PageProps) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/salles/configurations/${id}/modifier`);
  const setup = await getAdminVenueSetup(id);
  if (!setup.ok && setup.error === "not_found") notFound();
  if (!setup.ok) return <section className="admin-news-empty" role="alert"><h1>Modifier la configuration</h1><p>Impossible de charger la configuration.</p></section>;
  return <AdminVenueSetupForm mode="edit" setup={setup.setup} />;
}
