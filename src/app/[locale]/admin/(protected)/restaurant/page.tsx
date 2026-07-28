import { redirect } from "next/navigation";
import { AdminRestaurantMenusExplorer } from "@/components/admin/restaurant/AdminRestaurantMenusExplorer";
import { AdminRestaurantMenusHeader } from "@/components/admin/restaurant/AdminRestaurantMenusHeader";
import { getAdminRestaurantCategories, getAdminRestaurantMenus } from "@/lib/admin/restaurant/get-admin-restaurant";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ deleted?: string; notice?: string }>;
}) {
  const { locale } = await params;
  const query = searchParams ? await searchParams : {};
  if (locale !== "fr") redirect("/fr/admin/restaurant");

  const [menusResult, categoriesResult] = await Promise.all([getAdminRestaurantMenus(), getAdminRestaurantCategories()]);
  if (!menusResult.ok || !categoriesResult.ok) {
    return <section className="admin-news-empty" role="alert"><h1>Restaurant</h1><p>Impossible de charger les cartes du restaurant.</p></section>;
  }

  return (
    <>
      {query.deleted === "1" ? (
        <section className="admin-news-success" role="status" aria-live="polite">
          La carte a été supprimée définitivement.
        </section>
      ) : null}
      <AdminRestaurantMenusHeader />
      <AdminRestaurantMenusExplorer menus={menusResult.menus} categories={categoriesResult.categories} />
    </>
  );
}
