import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PublicEventMomentImage = {
  id: string;
  imagePath: string;
  alt: {
    fr: string;
    en: string;
  };
  sortOrder: number;
};

type EventMomentRow = {
  id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
};

export async function getEventMoments(): Promise<PublicEventMomentImage[]> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");

    const { data, error } = await supabase
      .from("event_moment_images")
      .select("id,image_path,alt_fr,alt_en,sort_order")
      .eq("is_active", true)
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error("[event-moments] Unable to load public gallery", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });

      return [];
    }

    return ((data ?? []) as EventMomentRow[]).map((row) => ({
      id: row.id,
      imagePath: row.image_path,
      alt: {
        fr: row.alt_fr?.trim() || "Événement à La Résidence Ankerana",
        en: row.alt_en?.trim() || "Event at La Résidence Ankerana",
      },
      sortOrder: row.sort_order,
    }));
  } catch (error) {
    console.error(
      "[event-moments] Public gallery loading failed",
      error instanceof Error ? error.message : "Unknown error",
    );

    return [];
  }
}
