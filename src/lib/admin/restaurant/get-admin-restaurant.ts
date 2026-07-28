import "server-only";

import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import type { AdminRestaurantCategory, AdminRestaurantMenu, AdminRestaurantMenuDetail } from "@/lib/admin/restaurant/admin-restaurant-types";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CategoryRow = { id: string; code: string; name_fr: string; name_en: string; description_fr: string | null; description_en: string | null; sort_order: number; is_active: boolean; updated_at: string };
type MenuRow = { id: string; category_id: string; code: string; title_fr: string; title_en: string; short_description_fr: string; short_description_en: string; sort_order: number; is_active: boolean; updated_at: string };
type ImageRow = { id: string; menu_id: string; image_path: string; alt_fr: string; alt_en: string; sort_order: number; is_cover: boolean; is_active: boolean };

export async function getAdminRestaurantCategories() {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");
    const [categories, menus] = await Promise.all([
      supabase.from("restaurant_menu_categories").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("restaurant_menus").select("category_id"),
    ]);
    if (categories.error) return { ok: false as const, categories: [] };
    const counts = new Map<string, number>();
    for (const menu of (menus.data ?? []) as unknown as Array<{ category_id: string }>) counts.set(menu.category_id, (counts.get(menu.category_id) ?? 0) + 1);
    return {
      ok: true as const,
      categories: ((categories.data ?? []) as unknown as CategoryRow[]).map((row): AdminRestaurantCategory => ({
        id: row.id,
        code: row.code,
        nameFr: row.name_fr,
        nameEn: row.name_en,
        descriptionFr: row.description_fr ?? "",
        descriptionEn: row.description_en ?? "",
        sortOrder: row.sort_order,
        isActive: row.is_active,
        updatedAt: row.updated_at,
        usageCount: counts.get(row.id) ?? 0,
      })),
    };
  } catch (error) {
    console.error(
      "[admin-restaurant] Categories loading failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    throw new Error("ADMIN_RESTAURANT_CATEGORIES_LOAD_FAILED");
  }
}

export async function getAdminRestaurantMenus() {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");
    const [menus, categories, images] = await Promise.all([
      supabase.from("restaurant_menus").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
      supabase.from("restaurant_menu_categories").select("*"),
      supabase.from("restaurant_menu_images").select("*").eq("is_active", true),
    ]);
    if (menus.error) return { ok: false as const, menus: [] };
    const categoryById = new Map(((categories.data ?? []) as unknown as CategoryRow[]).map((category) => [category.id, category]));
    const imagesByMenu = new Map<string, ImageRow[]>();
    for (const image of (images.data ?? []) as unknown as ImageRow[]) {
      const current = imagesByMenu.get(image.menu_id) ?? [];
      current.push(image);
      imagesByMenu.set(image.menu_id, current);
    }
    return {
      ok: true as const,
      menus: ((menus.data ?? []) as unknown as MenuRow[]).map((row): AdminRestaurantMenu => {
        const category = categoryById.get(row.category_id);
        const menuImages = imagesByMenu.get(row.id) ?? [];
        const cover = [...menuImages].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)[0];
        return {
          id: row.id,
          code: row.code,
          categoryId: row.category_id,
          categoryNameFr: category?.name_fr ?? "Catégorie",
          titleFr: row.title_fr,
          titleEn: row.title_en,
          shortDescriptionFr: row.short_description_fr,
          shortDescriptionEn: row.short_description_en,
          sortOrder: row.sort_order,
          isActive: row.is_active,
          updatedAt: row.updated_at,
          coverImage: cover?.image_path ?? null,
          imageCount: menuImages.length,
        };
      }),
    };
  } catch (error) {
    console.error(
      "[admin-restaurant] Menus loading failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    throw new Error("ADMIN_RESTAURANT_MENUS_LOAD_FAILED");
  }
}

export async function getAdminRestaurantMenu(id: string) {
  if (!isValidUuid(id)) {
    return { ok: false as const, menu: null, error: "not_found" };
  }

  try {
    await ensureAdminReadContext();
    const supabase = (await getSupabaseServerClient()).schema("site");
    const menuResult = await supabase
      .from("restaurant_menus")
      .select(
        [
          "id",
          "category_id",
          "code",
          "title_fr",
          "title_en",
          "short_description_fr",
          "short_description_en",
          "sort_order",
          "is_active",
          "updated_at",
        ].join(","),
      )
      .eq("id", id)
      .maybeSingle();

    if (menuResult.error) {
      console.error("[admin-restaurant] Menu detail load failed:", {
        code: menuResult.error.code,
        message: menuResult.error.message,
      });
      throw new Error("ADMIN_RESTAURANT_MENU_LOAD_FAILED");
    }

    if (!menuResult.data) {
      return { ok: false as const, menu: null, error: "not_found" };
    }

    const [categories, images] = await Promise.all([
      supabase.from("restaurant_menu_categories").select("*"),
      supabase
        .from("restaurant_menu_images")
        .select("*")
        .eq("menu_id", id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (categories.error || images.error) {
      console.error("[admin-restaurant] Menu related data load failed:", {
        code: categories.error?.code ?? images.error?.code,
        message: categories.error?.message ?? images.error?.message,
      });
      throw new Error("ADMIN_RESTAURANT_MENU_LOAD_FAILED");
    }

    const row = menuResult.data as unknown as MenuRow;
    const categoryById = new Map(
      ((categories.data ?? []) as unknown as CategoryRow[]).map((category) => [category.id, category]),
    );
    const category = categoryById.get(row.category_id);
    const menuImages = (images.data ?? []) as unknown as ImageRow[];
    const cover = [...menuImages].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)[0];
    const menu: AdminRestaurantMenu = {
      id: row.id,
      code: row.code,
      categoryId: row.category_id,
      categoryNameFr: category?.name_fr ?? "Catégorie",
      titleFr: row.title_fr,
      titleEn: row.title_en,
      shortDescriptionFr: row.short_description_fr,
      shortDescriptionEn: row.short_description_en,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      updatedAt: row.updated_at,
      coverImage: cover?.image_path ?? null,
      imageCount: menuImages.length,
    };
    const detail: AdminRestaurantMenuDetail = {
      ...menu,
      sortOrder: String(menu.sortOrder),
      images: menuImages.map((image) => ({
        id: image.id,
        imagePath: image.image_path,
        altFr: image.alt_fr,
        altEn: image.alt_en,
        isCover: image.is_cover,
        isActive: image.is_active,
      })),
    };
    return { ok: true as const, menu: detail };
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_RESTAURANT_MENU_LOAD_FAILED") {
      throw error;
    }

    console.error(
      "[admin-restaurant] Menu detail loading failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    throw new Error("ADMIN_RESTAURANT_MENU_LOAD_FAILED");
  }
}

export async function getAdminRestaurantCategory(id: string) {
  if (!isValidUuid(id)) {
    return { ok: false as const, category: null, error: "not_found" };
  }

  try {
    await ensureAdminReadContext();
    const supabase = (await getSupabaseServerClient()).schema("site");
    const [categoryResult, menus] = await Promise.all([
      supabase.from("restaurant_menu_categories").select("*").eq("id", id).maybeSingle(),
      supabase.from("restaurant_menus").select("category_id").eq("category_id", id),
    ]);

    if (categoryResult.error || menus.error) {
      console.error("[admin-restaurant] Category detail load failed:", {
        code: categoryResult.error?.code ?? menus.error?.code,
        message: categoryResult.error?.message ?? menus.error?.message,
      });
      throw new Error("ADMIN_RESTAURANT_CATEGORY_LOAD_FAILED");
    }

    if (!categoryResult.data) {
      return { ok: false as const, category: null, error: "not_found" };
    }

    const row = categoryResult.data as unknown as CategoryRow;
    return {
      ok: true as const,
      category: {
        id: row.id,
        code: row.code,
        nameFr: row.name_fr,
        nameEn: row.name_en,
        descriptionFr: row.description_fr ?? "",
        descriptionEn: row.description_en ?? "",
        sortOrder: row.sort_order,
        isActive: row.is_active,
        updatedAt: row.updated_at,
        usageCount: ((menus.data ?? []) as unknown as Array<{ category_id: string }>).length,
      },
    };
  } catch (error) {
    if (error instanceof Error && error.message === "ADMIN_RESTAURANT_CATEGORY_LOAD_FAILED") {
      throw error;
    }

    console.error(
      "[admin-restaurant] Category detail loading failed:",
      error instanceof Error ? error.name : "Unknown error",
    );
    throw new Error("ADMIN_RESTAURANT_CATEGORY_LOAD_FAILED");
  }
}
