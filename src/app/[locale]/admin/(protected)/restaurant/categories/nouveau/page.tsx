import { redirect } from "next/navigation";
import { AdminRestaurantCategoryForm } from "@/components/admin/restaurant/AdminRestaurantCategoryForm";

export const dynamic = "force-dynamic";

export default async function NewRestaurantCategoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "fr") redirect("/fr/admin/restaurant/categories/nouveau");
  return <AdminRestaurantCategoryForm mode="create" />;
}
