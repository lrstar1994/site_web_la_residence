import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminVenueForm } from "@/components/admin/venues/AdminVenueForm";
import { getAdminVenueSetups } from "@/lib/admin/venues/get-admin-venues";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = { params: Promise<{ locale: string }> };
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nouvelle salle | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function NewVenuePage({ params }: PageProps) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/salles/nouveau");
  await requireAdmin(locale as Locale);
  const setups = await getAdminVenueSetups();
  return <AdminVenueForm mode="create" setups={setups.ok ? setups.setups : []} />;
}
