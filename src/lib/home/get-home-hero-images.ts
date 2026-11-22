import "server-only";

import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";
import type { PublicHomeHeroImage } from "@/types/home-hero";

type HomeHeroImageRow = {
  id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
};

export async function getActiveHomeHeroImages(): Promise<PublicHomeHeroImage[]> {
  try {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await supabase
      .schema("site")
      .from("home_hero_images")
      .select("id,image_path,alt_fr,alt_en,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(6);

    if (error) {
      console.error("[home-hero] Unable to load active images", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    return ((data ?? []) as HomeHeroImageRow[]).map((row) => {
      const { data: publicData } = supabase.storage
        .from("site-news")
        .getPublicUrl(row.image_path);

      return {
        id: row.id,
        publicUrl: publicData.publicUrl,
        alt: {
          fr: row.alt_fr?.trim() ?? "",
          en: row.alt_en?.trim() ?? "",
        },
        sortOrder: row.sort_order,
      };
    });
  } catch (error) {
    console.error(
      "[home-hero] Unexpected image loading error",
      error instanceof Error ? error.message : "Unknown error",
    );
    return [];
  }
}
