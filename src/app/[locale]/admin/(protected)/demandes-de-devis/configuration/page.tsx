import { redirect } from "next/navigation";
import { AdminBackButton } from "@/components/admin/common/AdminBackButton";
import { AdminEventQuoteFieldsManager } from "@/components/admin/event-quotes/AdminEventQuoteFieldsManager";
import { getAdminEventQuoteConfig } from "@/lib/admin/event-quotes/get-admin-event-quotes";

export const dynamic = "force-dynamic";

export default async function AdminEventQuoteConfigurationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/demandes-de-devis/configuration");

  const result = await (async () => {
    try {
      const config = await getAdminEventQuoteConfig();
      return { ok: true as const, config };
    } catch {
      return { ok: false as const };
    }
  })();

  if (!result.ok) {
    return (
      <section className="admin-news-empty" role="alert">
        <h1>Configuration des champs</h1>
        <p>Impossible de charger la configuration pour le moment.</p>
      </section>
    );
  }

  return (
    <>
      <AdminBackButton fallbackHref="/fr/admin/demandes-de-devis" />
      <section className="admin-news-header">
        <div>
          <p className="admin-section-kicker">Demandes de devis</p>
          <h2>Configuration des champs</h2>
          <p>Configurez les questions propres à chaque type d&apos;événement.</p>
        </div>
      </section>
      <AdminEventQuoteFieldsManager services={result.config.services} fields={result.config.fields} />
    </>
  );
}
