import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAccommodationFeaturesExplorer } from "@/components/admin/accommodations/AdminAccommodationFeaturesExplorer";
import {
  getAdminAccommodationFeatureGroups,
  getAdminAccommodationFeatures,
} from "@/lib/admin/accommodations/get-admin-accommodations";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ notice?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Caractéristiques des hébergements | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function AccommodationFeaturesPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};
  if (locale !== "fr") redirect("/fr/admin/hebergements/caracteristiques");

  await requireAdmin(locale as Locale);
  const [groups, features] = await Promise.all([
    getAdminAccommodationFeatureGroups(),
    getAdminAccommodationFeatures(),
  ]);

  return (
    <section className="admin-news-page">
      {query.notice === "created" ? <section className="admin-news-success" role="status">Caractéristique créée avec succès.</section> : null}
      {query.notice === "updated" ? <section className="admin-news-success" role="status">Caractéristique mise à jour avec succès.</section> : null}
      {groups.ok && features.ok ? (
        <AdminAccommodationFeaturesExplorer groups={groups.groups} features={features.features} />
      ) : (
        <section className="admin-news-error" role="alert">
          <h2>Impossible de charger les caractéristiques.</h2>
          <p>Réessayez dans quelques instants.</p>
        </section>
      )}
    </section>
  );
}
