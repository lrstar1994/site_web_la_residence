import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { RestaurantMenu, RestaurantMenuCardModel, RestaurantMenuCategory } from "@/types/restaurant-menu";

type CategoryRow = {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  description_fr: string | null;
  description_en: string | null;
  sort_order: number;
  is_active: boolean;
};
type MenuRow = {
  id: string;
  category_id: string;
  code: string;
  title_fr: string;
  title_en: string;
  short_description_fr: string;
  short_description_en: string;
  description_fr: string | null;
  description_en: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type ImageRow = {
  id: string;
  menu_id: string;
  image_path: string;
  alt_fr: string;
  alt_en: string;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

export type RestaurantMenusResult =
  | { ok: true; categories: RestaurantMenuCategory[]; menus: RestaurantMenu[]; cards: RestaurantMenuCardModel[] }
  | { ok: false; categories: RestaurantMenuCategory[]; menus: RestaurantMenu[]; cards: RestaurantMenuCardModel[]; error: string };

function toCards(menus: RestaurantMenu[]): RestaurantMenuCardModel[] {
  return menus.map((menu) => {
    const images = [...menu.images].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
    const cover = images[0];
    return {
      id: menu.id,
      categoryId: menu.categoryId,
      label: menu.categoryName,
      title: menu.title,
      description: menu.shortDescription,
      cover: cover?.imagePath ?? "/hero-restau-light.jpg",
      images: images.map((image, index) => ({
        id: image.id,
        src: image.imagePath,
        title: index === 0 ? menu.title : menu.title,
        alt: image.alt,
      })),
      sortOrder: menu.sortOrder,
      isActive: menu.isActive,
    };
  });
}

export async function getRestaurantMenus(): Promise<RestaurantMenusResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");
    const [categoriesResult, menusResult, imagesResult] = await Promise.all([
      supabase.from("restaurant_menu_categories").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("restaurant_menus").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("restaurant_menu_images").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    ]);

    if (categoriesResult.error || menusResult.error || imagesResult.error) {
      console.error("[restaurant] Unable to load menus:", categoriesResult.error?.message ?? menusResult.error?.message ?? imagesResult.error?.message);
      return { ok: false, categories: [], menus: [], cards: [], error: "restaurant_menus_unavailable" };
    }

    const categoriesById = new Map<string, RestaurantMenuCategory>();
    for (const category of (categoriesResult.data ?? []) as unknown as CategoryRow[]) {
      if (!categoriesById.has(category.id)) {
        categoriesById.set(category.id, {
          id: category.id,
          code: category.code,
          name: { fr: category.name_fr, en: category.name_en },
          description: { fr: category.description_fr, en: category.description_en },
          sortOrder: category.sort_order,
          isActive: category.is_active,
        });
      }
    }
    const categories = [...categoriesById.values()];
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const imagesByMenu = new Map<string, ImageRow[]>();
    for (const image of (imagesResult.data ?? []) as unknown as ImageRow[]) {
      const current = imagesByMenu.get(image.menu_id) ?? [];
      current.push(image);
      imagesByMenu.set(image.menu_id, current);
    }
    const menus = ((menusResult.data ?? []) as unknown as MenuRow[])
      .filter((menu) => categoryById.has(menu.category_id))
      .map((menu) => {
        const category = categoryById.get(menu.category_id)!;
        const images = (imagesByMenu.get(menu.id) ?? []).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
        return {
          id: menu.id,
          code: menu.code,
          categoryId: menu.category_id,
          categoryCode: category.code,
          categoryName: category.name,
          title: { fr: menu.title_fr, en: menu.title_en },
          shortDescription: { fr: menu.short_description_fr, en: menu.short_description_en },
          description: { fr: menu.description_fr, en: menu.description_en },
          sortOrder: menu.sort_order,
          isActive: menu.is_active,
          images: images.map((image) => ({
            id: image.id,
            imagePath: image.image_path,
            alt: { fr: image.alt_fr, en: image.alt_en },
            sortOrder: image.sort_order,
            isCover: image.is_cover,
            isActive: image.is_active,
          })),
          createdAt: menu.created_at,
          updatedAt: menu.updated_at,
        } satisfies RestaurantMenu;
      });

    return { ok: true, categories, menus, cards: toCards(menus) };
  } catch (error) {
    console.error("[restaurant] Loading failed:", error instanceof Error ? error.message : "Unknown error");
    return { ok: false, categories: [], menus: [], cards: [], error: "supabase_unavailable" };
  }
}
