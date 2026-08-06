import "server-only";

import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import type {
  AdminEventService,
  AdminEventServiceImage,
} from "@/lib/admin/events/admin-event-service-types";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { mapEventService } from "@/lib/events/get-event-services";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type EventServiceRow = Parameters<typeof mapEventService>[0];

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

function mapAdminEventService(
  row: EventServiceRow,
  images: EventServiceImageRow[] = [],
): AdminEventService {
  const base = mapEventService(row, images);
  const adminImages: AdminEventServiceImage[] = images.map((image) => ({
    id: image.id,
    imagePath: image.image_path,
    altFr: image.alt_fr || base.imageAlt.fr,
    altEn: image.alt_en || base.imageAlt.en,
    sortOrder: image.sort_order,
    isCover: image.is_cover,
    isActive: image.is_active,
  }));

  return {
    ...base,
    images: adminImages,
  };
}

export type AdminEventServicesResult =
  | {
      ok: true;
      services: AdminEventService[];
    }
  | {
      ok: false;
      services: AdminEventService[];
      error: string;
    };

export async function getAdminEventServices(): Promise<AdminEventServicesResult> {
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
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[admin-events] Unable to load services:", error.message);
      return { ok: false, services: [], error: "event_services_unavailable" };
    }

    const rows = (data ?? []) as unknown as EventServiceRow[];
    const serviceIds = rows.map((service) => service.id);
    const imagesByService = new Map<string, EventServiceImageRow[]>();

    if (serviceIds.length > 0) {
      const { data: imagesData, error: imagesError } = await supabase
        .from("event_service_images")
        .select("id,event_service_id,image_path,alt_fr,alt_en,sort_order,is_cover,is_active")
        .in("event_service_id", serviceIds)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (imagesError) {
        console.error("[admin-events] Unable to load service images:", imagesError.message);
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
      services: rows.map((service) =>
        mapAdminEventService(service, imagesByService.get(service.id) ?? []),
      ),
    };
  } catch (error) {
    console.error(
      "[admin-events] Loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return { ok: false, services: [], error: "supabase_unavailable" };
  }
}

export async function getAdminEventService(
  id: string,
): Promise<
  | { ok: true; service: AdminEventService }
  | { ok: false; service: null; error: "not_found" | "unavailable" }
> {
  if (!isValidUuid(id)) {
    return { ok: false, service: null, error: "not_found" };
  }

  try {
    await ensureAdminReadContext();
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
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[admin-events] Unable to load service:", error.message);
      return { ok: false, service: null, error: "unavailable" };
    }

    if (!data) {
      return { ok: false, service: null, error: "not_found" };
    }

    const row = data as unknown as EventServiceRow;
    const { data: imagesData, error: imagesError } = await supabase
      .from("event_service_images")
      .select("id,event_service_id,image_path,alt_fr,alt_en,sort_order,is_cover,is_active")
      .eq("event_service_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (imagesError) {
      console.error("[admin-events] Unable to load service images:", imagesError.message);
    }

    return {
      ok: true,
      service: mapAdminEventService(row, (imagesData ?? []) as unknown as EventServiceImageRow[]),
    };
  } catch (error) {
    console.error(
      "[admin-events] Service loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { ok: false, service: null, error: "unavailable" };
  }
}
