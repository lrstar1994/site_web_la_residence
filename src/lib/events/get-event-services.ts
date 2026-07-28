import "server-only";

import type { EventService } from "@/types/event-service";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type EventServiceRow = {
  id: string;
  code: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  image_path: string;
  image_alt_fr: string;
  image_alt_en: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EventServicesResult =
  | {
      ok: true;
      services: EventService[];
    }
  | {
      ok: false;
      services: EventService[];
      error: string;
    };

export function mapEventService(row: EventServiceRow): EventService {
  return {
    id: row.id,
    code: row.code,
    title: {
      fr: row.title_fr,
      en: row.title_en,
    },
    description: {
      fr: row.description_fr,
      en: row.description_en,
    },
    imagePath: row.image_path,
    imageAlt: {
      fr: row.image_alt_fr,
      en: row.image_alt_en,
    },
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getEventServices(): Promise<EventServicesResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");
    const { data, error } = await supabase
      .from("event_services")
      .select(
        [
          "id",
          "code",
          "title_fr",
          "title_en",
          "description_fr",
          "description_en",
          "image_path",
          "image_alt_fr",
          "image_alt_en",
          "sort_order",
          "is_active",
          "created_at",
          "updated_at",
        ].join(","),
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[events] Unable to load event services:", error.message);
      return {
        ok: false,
        services: [],
        error: "event_services_unavailable",
      };
    }

    return {
      ok: true,
      services: ((data ?? []) as unknown as EventServiceRow[]).map(mapEventService),
    };
  } catch (error) {
    console.error(
      "[events] Loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      ok: false,
      services: [],
      error: "supabase_unavailable",
    };
  }
}
