import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminVenueUseTypeForm } from "@/components/admin/venues/AdminVenueUseTypeForm";

type PageProps = { params: Promise<{ locale: string }> };

export const metadata: Metadata = { title: "Nouvel usage de salle | Administration", robots: { index: false, follow: false, noarchive: true } };

export default async function NewVenueUseTypePage({ params }: PageProps) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/salles/usages/nouveau");
  return <AdminVenueUseTypeForm mode="create" />;
}
