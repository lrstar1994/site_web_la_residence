import { notFound, redirect } from "next/navigation";
import { AdminEventQuoteDetail } from "@/components/admin/event-quotes/AdminEventQuoteDetail";
import { getAdminEventQuoteRequest } from "@/lib/admin/event-quotes/get-admin-event-quotes";

export const dynamic = "force-dynamic";

export default async function AdminEventQuoteRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/demandes-de-devis/${id}`);

  const { request, config } = await getAdminEventQuoteRequest(id);
  if (!request) notFound();

  return <AdminEventQuoteDetail request={request} fields={config.fields} />;
}
