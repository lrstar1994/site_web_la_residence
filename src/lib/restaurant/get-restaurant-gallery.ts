import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  RestaurantGalleryImage,
  RestaurantGalleryResult,
} from "@/types/restaurant-gallery";

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
): RestaurantGalleryImage {
  return {
    id: row.id,

    imagePath: row.image_path,

    alt: {
      fr: row.alt_fr,
      en: row.alt_en,
    },

    sortOrder: row.sort_order,

    isFeatured: row.is_featured,

    isActive: row.is_active,

    createdAt: row.created_at,

    updatedAt: row.updated_at,
  };
}

export async function getRestaurantGallery(): Promise<RestaurantGalleryResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");

    const { data, error } = await supabase
      .from("restaurant_gallery_images")
      .select(
        "id,image_path,alt_fr,alt_en,sort_order,is_featured,is_active,created_at,updated_at",
      )
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error("[restaurant-gallery] Load failed:", error.message);

      return {
        ok: false,
        images: [],
        featuredImages: [],
        error: "restaurant_gallery_unavailable",
      };
    }

    const images = ((data ?? []) as unknown as RestaurantGalleryImageRow[]).map(
      mapRestaurantGalleryImage,
    );

    const featuredImages = images
      .filter((image) => image.isFeatured)
      .slice(0, 5);

    return {
      ok: true,
      images,
      featuredImages,
    };
  } catch (error) {
    console.error(
      "[restaurant-gallery] Loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      ok: false,
      images: [],
      featuredImages: [],
      error: "supabase_unavailable",
    };
  }
}
