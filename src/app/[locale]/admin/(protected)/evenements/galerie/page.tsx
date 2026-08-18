import { AdminEventMomentsManager } from "@/components/admin/event-moments/AdminEventMomentsManager";
import type { Locale } from "@/lib/i18n/routing";
import { getAdminEventMoments } from "@/lib/admin/event-moments/get-admin-event-moments";

type AdminEventMomentsPageProps = {
  params: Promise<{
    locale: Locale;
  }>;
};

export default async function AdminEventMomentsPage({
  params,
}: AdminEventMomentsPageProps) {
  const { locale } = await params;

  const images = await getAdminEventMoments();

  return (
    <main className="admin-event-moments-page">
      <header className="admin-news-form-header">
        <div>
          <p className="admin-section-kicker">
            Événements
          </p>

          <h1>Galerie d’images</h1>

          <p>
            Gérez les images affichées dans le carrousel de la
            page publique Événements.
          </p>
        </div>
      </header>

      <AdminEventMomentsManager
        existingImages={images}
        locale={locale}
      />
    </main>
  );
}