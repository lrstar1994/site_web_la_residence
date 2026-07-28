import { notFound, redirect } from "next/navigation";
import { AdminRestaurantCategoryForm } from "@/components/admin/restaurant/AdminRestaurantCategoryForm";
import { getAdminRestaurantCategory } from "@/lib/admin/restaurant/get-admin-restaurant";

export const dynamic = "force-dynamic";

export default async function EditRestaurantCategoryPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (locale !== "fr") redirect(`/fr/admin/restaurant/categories/${id}/modifier`);

  const result = await getAdminRestaurantCategory(id);
  if (result.error === "not_found") notFound();
  if (!result.ok || !result.category) return <section className="admin-news-empty" role="alert"><h1>Modifier la catégorie</h1><p>Impossible de charger la catégorie.</p></section>;

  return <AdminRestaurantCategoryForm mode="edit" category={result.category} />;
}
