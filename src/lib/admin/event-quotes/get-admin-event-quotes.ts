import "server-only";

import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import type {
  AdminEventQuoteConfig,
  AdminEventQuoteRequest,
} from "@/lib/admin/event-quotes/admin-event-quote-types";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import {
  mapEventQuoteField,
  type EventQuoteFieldRow,
} from "@/lib/events/event-quote-fields";
import { mapEventService } from "@/lib/events/get-event-services";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventQuoteStatus } from "@/types/event-quote";
import type { EventService } from "@/types/event-service";

type EventQuoteRequestRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  estimated_budget: number | null;
  additional_details: string | null;
  event_type_id: string;
  event_date: string | null;
  specific_answers: unknown;
  status: EventQuoteStatus;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
};

type EventServiceRow = Parameters<typeof mapEventService>[0];

const eventServiceSelect = [
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
].join(",");

const quoteRequestSelect = [
  "id",
  "full_name",
  "email",
  "phone",
  "whatsapp",
  "estimated_budget",
  "additional_details",
  "event_type_id",
  "event_date",
  "specific_answers",
  "status",
  "internal_notes",
  "created_at",
  "updated_at",
].join(",");

function mapAnswers(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapRequest(
  row: EventQuoteRequestRow,
  servicesById: Map<string, EventService>,
): AdminEventQuoteRequest {
  const service = servicesById.get(row.event_type_id);

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    whatsapp: row.whatsapp,
    estimatedBudget: row.estimated_budget,
    additionalDetails: row.additional_details,
    eventTypeId: row.event_type_id,
    eventTypeTitleFr: service?.title.fr ?? "Type introuvable",
    eventTypeTitleEn: service?.title.en ?? "Unknown type",
    eventDate: row.event_date,
    specificAnswers: mapAnswers(row.specific_answers),
    status: row.status,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAdminEventQuoteConfig(): Promise<AdminEventQuoteConfig> {
  await ensureAdminReadContext();
  const supabase = (await getSupabaseServerClient()).schema("site");

  const [servicesResult, fieldsResult] = await Promise.all([
    supabase
      .from("event_services")
      .select(eventServiceSelect)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("event_quote_fields")
      .select(
        [
          "id",
          "event_type_id",
          "field_key",
          "label_fr",
          "label_en",
          "field_type",
          "is_required",
          "is_active",
          "sort_order",
          "placeholder_fr",
          "placeholder_en",
          "help_text_fr",
          "help_text_en",
          "options",
          "conditional_logic",
        ].join(","),
      )
      .order("event_type_id", { ascending: true })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (servicesResult.error) {
    console.error("[admin-event-quotes] Event services load failed:", servicesResult.error.message);
    throw new Error("ADMIN_EVENT_QUOTE_SERVICES_LOAD_FAILED");
  }

  if (fieldsResult.error) {
    console.error("[admin-event-quotes] Fields load failed:", fieldsResult.error.message);
    throw new Error("ADMIN_EVENT_QUOTE_FIELDS_LOAD_FAILED");
  }

  return {
    services: ((servicesResult.data ?? []) as unknown as EventServiceRow[]).map((service) =>
      mapEventService(service),
    ),
    fields: ((fieldsResult.data ?? []) as unknown as EventQuoteFieldRow[]).map(mapEventQuoteField),
  };
}

export async function getAdminEventQuoteRequests(): Promise<AdminEventQuoteRequest[]> {
  const config = await getAdminEventQuoteConfig();
  const servicesById = new Map(config.services.map((service) => [service.id, service]));
  const supabase = (await getSupabaseServerClient()).schema("site");

  const { data, error } = await supabase
    .from("event_quote_requests")
    .select(quoteRequestSelect)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin-event-quotes] Requests load failed:", error.message);
    throw new Error("ADMIN_EVENT_QUOTE_REQUESTS_LOAD_FAILED");
  }

  return ((data ?? []) as unknown as EventQuoteRequestRow[]).map((row) =>
    mapRequest(row, servicesById),
  );
}

export async function getAdminEventQuoteRequest(
  id: string,
): Promise<{ request: AdminEventQuoteRequest | null; config: AdminEventQuoteConfig }> {
  if (!isValidUuid(id)) {
    return { request: null, config: await getAdminEventQuoteConfig() };
  }

  const config = await getAdminEventQuoteConfig();
  const servicesById = new Map(config.services.map((service) => [service.id, service]));
  const supabase = (await getSupabaseServerClient()).schema("site");

  const { data, error } = await supabase
    .from("event_quote_requests")
    .select(quoteRequestSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[admin-event-quotes] Request load failed:", error.message);
    throw new Error("ADMIN_EVENT_QUOTE_REQUEST_LOAD_FAILED");
  }

  return {
    request: data ? mapRequest(data as unknown as EventQuoteRequestRow, servicesById) : null,
    config,
  };
}
