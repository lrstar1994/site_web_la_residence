import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminVenuesExplorer } from "@/components/admin/venues/AdminVenuesExplorer";
import { AdminVenuesHeader } from "@/components/admin/venues/AdminVenuesHeader";
import { getAdminVenues } from "@/lib/admin/venues/get-admin-venues";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = { params: Promise<{ locale: string }>; searchParams?: Promise<{ deleted?: string; notice?: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Salles | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function AdminVenuesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};
  if (locale !== "fr") redirect("/fr/admin/salles");
  await requireAdmin(locale as Locale);
  const result = await getAdminVenues();
  return <section className="admin-news-page">{query.notice === "created" ? <section className="admin-news-success" role="status">Salle créée avec succès.</section> : null}{query.notice === "updated" ? <section className="admin-news-success" role="status">Salle mise à jour avec succès.</section> : null}{query.deleted === "1" ? <section className="admin-news-success" role="status">La salle a été supprimée définitivement.</section> : null}{result.ok ? <><AdminVenuesHeader /><AdminVenuesExplorer venues={result.venues} /></> : <section className="admin-news-error" role="alert"><h2>Impossible de charger les salles.</h2><p>Réessayez dans quelques instants.</p></section>}</section>;
}
