import { redirect } from "next/navigation";
import { AdminRestaurantCategoriesExplorer } from "@/components/admin/restaurant/AdminRestaurantCategoriesExplorer";
import { AdminRestaurantCategoriesHeader } from "@/components/admin/restaurant/AdminRestaurantCategoriesHeader";
import { getAdminRestaurantCategories } from "@/lib/admin/restaurant/get-admin-restaurant";

export const dynamic = "force-dynamic";

export default async function AdminRestaurantCategoriesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/restaurant/categories");

  const result = await getAdminRestaurantCategories();
  if (!result.ok) return <section className="admin-news-empty" role="alert"><h1>Catégories du restaurant</h1><p>Impossible de charger les catégories du restaurant.</p></section>;
  return (
    <>
      <AdminRestaurantCategoriesHeader />
      <AdminRestaurantCategoriesExplorer categories={result.categories} />
    </>
  );
}
