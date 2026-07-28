import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminVenueSetupForm } from "@/components/admin/venues/AdminVenueSetupForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nouvelle configuration | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function NewVenueSetupPage({ params }: PageProps) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/salles/configurations/nouveau");
  await requireAdmin(locale as Locale);
  return <AdminVenueSetupForm mode="create" />;
}
