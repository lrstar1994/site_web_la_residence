import "server-only";

import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import type { AdminEventService } from "@/lib/admin/events/admin-event-service-types";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { mapEventService } from "@/lib/events/get-event-services";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type EventServiceRow = Parameters<typeof mapEventService>[0];

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

    return {
      ok: true,
      services: ((data ?? []) as unknown as EventServiceRow[]).map(mapEventService),
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

    return {
      ok: true,
      service: mapEventService(data as unknown as EventServiceRow),
    };
  } catch (error) {
    console.error(
      "[admin-events] Service loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { ok: false, service: null, error: "unavailable" };
  }
}
