import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminAccommodationFeatureForm } from "@/components/admin/accommodations/AdminAccommodationFeatureForm";
import { getAdminAccommodationFeatureGroups } from "@/lib/admin/accommodations/get-admin-accommodations";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouvelle caractéristique | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function NewAccommodationFeaturePage({ params }: PageProps) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/hebergements/caracteristiques/nouveau");

  await requireAdmin(locale as Locale);
  const groups = await getAdminAccommodationFeatureGroups();

  return <AdminAccommodationFeatureForm mode="create" groups={groups.ok ? groups.groups : []} />;
}
