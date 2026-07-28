import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AdminEventServiceForm } from "@/components/admin/events/AdminEventServiceForm";
import { getAdminEventService } from "@/lib/admin/events/get-admin-event-services";

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier une prestation | Administration",
  robots: { index: false, follow: false, noarchive: true },
};

export default async function EditEventServicePage({ params }: PageProps) {
  const { locale, id } = await params;

  if (locale !== "fr") {
    redirect(`/fr/admin/evenements/${id}/modifier`);
  }

  const result = await getAdminEventService(id);

  if (!result.ok && result.error === "not_found") {
    notFound();
  }

  if (!result.ok) {
    return (
      <section className="admin-news-error" role="alert">
        <h2>Impossible de charger la prestation.</h2>
        <p>Réessayez dans quelques instants.</p>
      </section>
    );
  }

  return <AdminEventServiceForm mode="edit" service={result.service} />;
}
