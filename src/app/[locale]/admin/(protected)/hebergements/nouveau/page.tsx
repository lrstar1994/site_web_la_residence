import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAccommodationForm } from "@/components/admin/accommodations/AdminAccommodationForm";
import {
  getAdminAccommodationFeatureGroups,
  getAdminAccommodationFeatures,
} from "@/lib/admin/accommodations/get-admin-accommodations";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouvel hébergement | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function NewAccommodationPage({ params }: PageProps) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/hebergements/nouveau");

  await requireAdmin(locale as Locale);
  const [groups, features] = await Promise.all([
    getAdminAccommodationFeatureGroups(),
    getAdminAccommodationFeatures(),
  ]);

  return (
    <AdminAccommodationForm
      mode="create"
      groups={groups.ok ? groups.groups : []}
      features={features.ok ? features.features : []}
    />
  );
}
