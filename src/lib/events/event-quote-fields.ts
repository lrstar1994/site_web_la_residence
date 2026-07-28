import "server-only";

import type {
  EventQuoteConditionalLogic,
  EventQuoteField,
  EventQuoteFieldOption,
  EventQuoteFieldType,
} from "@/types/event-quote";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type EventQuoteFieldRow = {
  id: string;
  event_type_id: string;
  field_key: string;
  label_fr: string;
  label_en: string;
  field_type: EventQuoteFieldType;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
  placeholder_fr: string | null;
  placeholder_en: string | null;
  help_text_fr: string | null;
  help_text_en: string | null;
  options: unknown;
  conditional_logic: unknown;
};

function mapOptions(value: unknown): EventQuoteFieldOption[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((option) => {
      if (!option || typeof option !== "object") return null;
      const candidate = option as Record<string, unknown>;
      if (
        typeof candidate.value !== "string" ||
        typeof candidate.label_fr !== "string" ||
        typeof candidate.label_en !== "string"
      ) {
        return null;
      }

      return {
        value: candidate.value,
        labelFr: candidate.label_fr,
        labelEn: candidate.label_en,
      };
    })
    .filter((option): option is EventQuoteFieldOption => option !== null);
}

function mapConditionalLogic(value: unknown): EventQuoteConditionalLogic | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.dependsOn !== "string" ||
    !["equals", "not_equals", "contains", "greater_than"].includes(String(candidate.operator))
  ) {
    return null;
  }

  const comparedValue = candidate.value;
  if (
    typeof comparedValue !== "string" &&
    typeof comparedValue !== "number" &&
    typeof comparedValue !== "boolean"
  ) {
    return null;
  }

  return {
    dependsOn: candidate.dependsOn,
    operator: candidate.operator as EventQuoteConditionalLogic["operator"],
    value: comparedValue,
  };
}

export function mapEventQuoteField(row: EventQuoteFieldRow): EventQuoteField {
  return {
    id: row.id,
    eventTypeId: row.event_type_id,
    fieldKey: row.field_key,
    labelFr: row.label_fr,
    labelEn: row.label_en,
    fieldType: row.field_type,
    isRequired: row.is_required,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    placeholderFr: row.placeholder_fr,
    placeholderEn: row.placeholder_en,
    helpTextFr: row.help_text_fr,
    helpTextEn: row.help_text_en,
    options: mapOptions(row.options),
    conditionalLogic: mapConditionalLogic(row.conditional_logic),
  };
}

export async function getPublicEventQuoteFields(eventTypeId?: string) {
  const supabase = (await getSupabaseServerClient()).schema("site");
  let query = supabase
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
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (eventTypeId) {
    query = query.eq("event_type_id", eventTypeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[events-quote] Unable to load fields:", error.message);
    return [];
  }

  return ((data ?? []) as unknown as EventQuoteFieldRow[]).map(mapEventQuoteField);
}
