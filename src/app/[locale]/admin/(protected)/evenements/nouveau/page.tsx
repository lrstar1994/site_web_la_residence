import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminEventServiceForm } from "@/components/admin/events/AdminEventServiceForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouvelle prestation | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function NewEventServicePage({ params }: PageProps) {
  const { locale } = await params;

  if (locale !== "fr") {
    redirect("/fr/admin/evenements/nouveau");
  }

  await requireAdmin(locale as Locale);

  return <AdminEventServiceForm mode="create" />;
}
