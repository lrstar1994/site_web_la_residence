import "server-only";

import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import type { AdminRestaurantGalleryImage } from "@/lib/admin/restaurant/admin-restaurant-gallery-types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RestaurantGalleryImageRow = {
  id: string;

  image_path: string;

  alt_fr: string;
  alt_en: string;

  sort_order: number;

  is_featured: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
};

function mapRestaurantGalleryImage(
  row: RestaurantGalleryImageRow,
): AdminRestaurantGalleryImage {
  return {
    id: row.id,

    imagePath: row.image_path,

    altFr: row.alt_fr,
    altEn: row.alt_en,

    sortOrder: row.sort_order,

    isFeatured: row.is_featured,
    isActive: row.is_active,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAdminRestaurantGallery() {
  await ensureAdminReadContext();

  const supabase = (await getSupabaseServerClient()).schema("site");

  const { data, error } = await supabase
    .from("restaurant_gallery_images")
    .select(
      "id,image_path,alt_fr,alt_en,sort_order,is_featured,is_active,created_at,updated_at",
    )
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    console.error("[admin-restaurant-gallery] Load failed:", error.message);

    return {
      ok: false as const,

      images: [] as AdminRestaurantGalleryImage[],
    };
  }

  const images = ((data ?? []) as unknown as RestaurantGalleryImageRow[]).map(
    mapRestaurantGalleryImage,
  );

  return {
    ok: true as const,

    images,
  };
}
