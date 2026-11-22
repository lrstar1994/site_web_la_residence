import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { HomeHeroImage } from "@/types/home-hero";

type HomeHeroImageRow = {
  id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminHomeHeroImages(): Promise<HomeHeroImage[]> {
  const client = await createSupabaseServerClient();
  const { data, error } = await client
    .schema("site")
    .from("home_hero_images")
    .select("id,image_path,alt_fr,alt_en,sort_order,is_active,created_at,updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin-home-hero] Unable to load images", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Unable to load home hero images.");
  }

  return ((data ?? []) as HomeHeroImageRow[]).map((row) => {
    const { data: publicData } = client.storage
      .from("site-news")
      .getPublicUrl(row.image_path);

    return {
      id: row.id,
      imagePath: row.image_path,
      publicUrl: publicData.publicUrl,
      alt: {
        fr: row.alt_fr?.trim() ?? "",
        en: row.alt_en?.trim() ?? "",
      },
      sortOrder: row.sort_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}
