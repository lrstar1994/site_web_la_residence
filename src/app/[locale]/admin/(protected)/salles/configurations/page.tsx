import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminVenueSetupsExplorer } from "@/components/admin/venues/AdminVenueSetupsExplorer";
import { getAdminVenueSetups } from "@/lib/admin/venues/get-admin-venues";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = { params: Promise<{ locale: string }>; searchParams?: Promise<{ notice?: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurations de salles | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function VenueSetupsPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};
  if (locale !== "fr") redirect("/fr/admin/salles/configurations");
  await requireAdmin(locale as Locale);
  const setups = await getAdminVenueSetups();
  return <section className="admin-news-page">{query.notice === "created" ? <section className="admin-news-success" role="status">Configuration créée avec succès.</section> : null}{query.notice === "updated" ? <section className="admin-news-success" role="status">Configuration mise à jour avec succès.</section> : null}{setups.ok ? <AdminVenueSetupsExplorer setups={setups.setups} /> : <section className="admin-news-error" role="alert"><h2>Impossible de charger les configurations.</h2><p>Réessayez dans quelques instants.</p></section>}</section>;
}
