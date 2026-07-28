import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminEventQuotesExplorer } from "@/components/admin/event-quotes/AdminEventQuotesExplorer";
import {
  getAdminEventQuoteConfig,
  getAdminEventQuoteRequests,
} from "@/lib/admin/event-quotes/get-admin-event-quotes";

export const dynamic = "force-dynamic";

export default async function AdminEventQuoteRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ deleted?: string }>;
}) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};
  if (locale !== "fr") redirect("/fr/admin/demandes-de-devis");

  const result = await (async () => {
    try {
      const [requests, config] = await Promise.all([
        getAdminEventQuoteRequests(),
        getAdminEventQuoteConfig(),
      ]);
      return { ok: true as const, requests, config };
    } catch {
      return { ok: false as const };
    }
  })();

  if (!result.ok) {
    return (
      <section className="admin-news-empty" role="alert">
        <h1>Demandes de devis</h1>
        <p>Impossible de charger les demandes pour le moment.</p>
      </section>
    );
  }

  const { requests, config } = result;

  return (
    <>
      {query.deleted === "1" ? (
        <section className="admin-news-success" role="status" aria-live="polite">
          La demande a été supprimée définitivement.
        </section>
      ) : null}
      <section className="admin-news-header">
        <div>
          <p className="admin-section-kicker">Événements</p>
          <h2>Demandes de devis</h2>
          <p>Consultez les demandes reçues depuis le formulaire public.</p>
        </div>
        <Link className="admin-news-new admin-news-secondary" href="/fr/admin/demandes-de-devis/configuration">
          Configurer les champs
        </Link>
      </section>
      <AdminEventQuotesExplorer requests={requests} services={config.services} />
    </>
  );
}
