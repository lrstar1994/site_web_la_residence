import { notFound, redirect } from "next/navigation";
import { AdminRestaurantMenuForm } from "@/components/admin/restaurant/AdminRestaurantMenuForm";
import { getAdminRestaurantCategories, getAdminRestaurantMenu } from "@/lib/admin/restaurant/get-admin-restaurant";

export const dynamic = "force-dynamic";

export default async function EditRestaurantMenuPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/restaurant/${id}/modifier`);

  const [menu, categories] = await Promise.all([getAdminRestaurantMenu(id), getAdminRestaurantCategories()]);
  if (menu.error === "not_found") notFound();
  if (!menu.ok || !menu.menu || !categories.ok) return <section className="admin-news-empty" role="alert"><h1>Modifier la carte</h1><p>Impossible de charger la carte.</p></section>;

  return <AdminRestaurantMenuForm mode="edit" menu={menu.menu} categories={categories.categories} />;
}
