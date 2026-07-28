import { redirect } from "next/navigation";
import { AdminRestaurantMenuForm } from "@/components/admin/restaurant/AdminRestaurantMenuForm";
import { getAdminRestaurantCategories } from "@/lib/admin/restaurant/get-admin-restaurant";

export const dynamic = "force-dynamic";

export default async function NewRestaurantMenuPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/restaurant/nouveau");

  const categories = await getAdminRestaurantCategories();
  if (!categories.ok) return <section className="admin-news-empty" role="alert"><h1>Nouvelle carte</h1><p>Impossible de charger les catégories.</p></section>;

  return <AdminRestaurantMenuForm mode="create" categories={categories.categories} />;
}
