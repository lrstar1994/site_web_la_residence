import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminRestaurantGalleryExplorer } from "@/components/admin/restaurant/AdminRestaurantGalleryExplorer";
import { AdminRestaurantGalleryHeader } from "@/components/admin/restaurant/AdminRestaurantGalleryHeader";
import { getAdminRestaurantGallery } from "@/lib/admin/restaurant/get-admin-restaurant-gallery";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{
    locale: string;
  }>;

  searchParams?: Promise<{
    notice?: string;
    deleted?: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerie du restaurant | Administration",

  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default async function AdminRestaurantGalleryPage({
  params,
  searchParams,
}: PageProps) {
  const { locale } = await params;

  const query = searchParams
    ? await searchParams
    : {};

  if (locale !== "fr") {
    redirect(
      "/fr/admin/restaurant/galerie",
    );
  }

  await requireAdmin(
    locale as Locale,
  );

  const gallery =
    await getAdminRestaurantGallery();

  return (
    <section className="admin-news-page">
      {query.notice === "created" ? (
        <section
          className="admin-news-success"
          role="status"
        >
          Image ajoutée avec succès.
        </section>
      ) : null}

      {query.notice === "updated" ? (
        <section
          className="admin-news-success"
          role="status"
        >
          Image mise à jour avec succès.
        </section>
      ) : null}

      {query.deleted === "1" ? (
        <section
          className="admin-news-success"
          role="status"
        >
          Image supprimée avec succès.
        </section>
      ) : null}

      <AdminRestaurantGalleryHeader />

      {gallery.ok ? (
        <AdminRestaurantGalleryExplorer
          images={gallery.images}
        />
      ) : (
        <section
          className="admin-news-empty"
          role="alert"
        >
          <h2>
            Impossible de charger la galerie.
          </h2>

          <p>
            Réessayez dans quelques instants.
          </p>
        </section>
      )}
    </section>
  );
}