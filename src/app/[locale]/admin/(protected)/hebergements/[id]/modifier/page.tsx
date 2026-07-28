import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminAccommodationForm } from "@/components/admin/accommodations/AdminAccommodationForm";
import {
  getAdminAccommodation,
  getAdminAccommodationFeatureGroups,
  getAdminAccommodationFeatures,
} from "@/lib/admin/accommodations/get-admin-accommodations";

type PageProps = { params: Promise<{ locale: string; id: string }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier un hébergement | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function EditAccommodationPage({ params }: PageProps) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/hebergements/${id}/modifier`);

  const [accommodation, groups, features] = await Promise.all([
    getAdminAccommodation(id),
    getAdminAccommodationFeatureGroups(),
    getAdminAccommodationFeatures(),
  ]);

  if (!accommodation.ok && accommodation.error === "not_found") notFound();
  if (!accommodation.ok) {
    return (
      <section className="admin-news-empty" role="alert">
        <h1>Modifier l&apos;hébergement</h1>
        <p>Impossible de charger l&apos;hébergement.</p>
      </section>
    );
  }

  return (
    <AdminAccommodationForm
      mode="edit"
      accommodation={accommodation.accommodation}
      groups={groups.ok ? groups.groups : []}
      features={features.ok ? features.features : []}
    />
  );
}
