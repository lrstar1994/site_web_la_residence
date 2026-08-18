import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventMomentImage } from "@/types/event-moment";

type EventMomentRow = {
  id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getAdminEventMoments(): Promise<EventMomentImage[]> {
  const supabase = (await getSupabaseServerClient()).schema("site");

  const { data, error } = await supabase
    .from("event_moment_images")
    .select(
      "id,image_path,alt_fr,alt_en,sort_order,is_active,created_at,updated_at",
    )
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin-event-moments] Unable to load images", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("Impossible de charger la galerie d’ambiance.");
  }

  return ((data ?? []) as EventMomentRow[]).map((row) => ({
    id: row.id,
    imagePath: row.image_path,
    altFr: row.alt_fr ?? "",
    altEn: row.alt_en ?? "",
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
