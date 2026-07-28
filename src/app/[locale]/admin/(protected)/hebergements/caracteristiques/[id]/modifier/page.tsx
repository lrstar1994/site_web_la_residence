import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminAccommodationFeatureForm } from "@/components/admin/accommodations/AdminAccommodationFeatureForm";
import {
  getAdminAccommodationFeature,
  getAdminAccommodationFeatureGroups,
} from "@/lib/admin/accommodations/get-admin-accommodations";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier une caractéristique | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function EditAccommodationFeaturePage({ params }: PageProps) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/hebergements/caracteristiques/${id}/modifier`);

  const [feature, groups] = await Promise.all([
    getAdminAccommodationFeature(id),
    getAdminAccommodationFeatureGroups(),
  ]);

  if (!feature.ok && feature.error === "not_found") notFound();
  if (!feature.ok) {
    return (
      <section className="admin-news-empty" role="alert">
        <h1>Modifier la caractéristique</h1>
        <p>Impossible de charger la caractéristique.</p>
      </section>
    );
  }

  return (
    <AdminAccommodationFeatureForm
      mode="edit"
      feature={feature.feature}
      groups={groups.ok ? groups.groups : []}
    />
  );
}
