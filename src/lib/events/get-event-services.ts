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

type EventServiceImageRow = {
  id: string;
  event_service_id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
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

export function mapEventService(
  row: EventServiceRow,
  images: EventServiceImageRow[] = [],
): EventService {
  const activeImages = images
    .filter((image) => image.is_active)
    .sort((left, right) => left.sort_order - right.sort_order);
  const coverImage = activeImages.find((image) => image.is_cover) ?? activeImages[0] ?? null;
  const imagePath = coverImage?.image_path ?? row.image_path;
  const imageAltFr = coverImage?.alt_fr || row.image_alt_fr;
  const imageAltEn = coverImage?.alt_en || row.image_alt_en;

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
    imagePath,
    imageAlt: {
      fr: imageAltFr,
      en: imageAltEn,
    },
    images:
      activeImages.length > 0
        ? activeImages.map((image) => ({
            id: image.id,
            imagePath: image.image_path,
            alt: {
              fr: image.alt_fr || imageAltFr,
              en: image.alt_en || imageAltEn,
            },
            sortOrder: image.sort_order,
            isCover: image.is_cover,
          }))
        : row.image_path
          ? [
              {
                id: `${row.id}-legacy-image`,
                imagePath: row.image_path,
                alt: {
                  fr: row.image_alt_fr,
                  en: row.image_alt_en,
                },
                sortOrder: 0,
                isCover: true,
              },
            ]
          : [],
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

    const services = (data ?? []) as unknown as EventServiceRow[];
    const serviceIds = services.map((service) => service.id);
    const imagesByService = new Map<string, EventServiceImageRow[]>();

    if (serviceIds.length > 0) {
      const { data: imagesData, error: imagesError } = await supabase
        .from("event_service_images")
        .select("id,event_service_id,image_path,alt_fr,alt_en,sort_order,is_cover,is_active")
        .in("event_service_id", serviceIds)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (imagesError) {
        console.error("[events] Unable to load event galleries:", imagesError.message);
      } else {
        ((imagesData ?? []) as unknown as EventServiceImageRow[]).forEach((image) => {
          const list = imagesByService.get(image.event_service_id) ?? [];
          list.push(image);
          imagesByService.set(image.event_service_id, list);
        });
      }
    }

    return {
      ok: true,
      services: services.map((service) =>
        mapEventService(service, imagesByService.get(service.id) ?? []),
      ),
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
