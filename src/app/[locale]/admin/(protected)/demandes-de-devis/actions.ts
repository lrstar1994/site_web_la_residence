"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EVENT_QUOTE_STATUSES } from "@/lib/admin/event-quotes/admin-event-quote-types";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  EventQuoteConditionalLogic,
  EventQuoteFieldOption,
  EventQuoteFieldType,
  EventQuoteStatus,
} from "@/types/event-quote";

const FIELD_TYPES: EventQuoteFieldType[] = [
  "text",
  "textarea",
  "number",
  "date",
  "boolean",
  "select",
  "radio",
  "checkbox_group",
  "multi_select",
];

type AdminActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

function cleanText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseOptions(value: string): EventQuoteFieldOption[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, labelFr, labelEn] = line.split("|").map((part) => part.trim());
      return {
        value: rawValue,
        label_fr: labelFr || rawValue,
        label_en: labelEn || labelFr || rawValue,
      };
    })
    .filter((option) => option.value.length > 0)
    .map((option) => ({
      value: option.value,
      labelFr: option.label_fr,
      labelEn: option.label_en,
    }));
}

function parseCondition(formData: FormData): EventQuoteConditionalLogic | null {
  const dependsOn = cleanText(formData, "conditional_depends_on");
  const operator = cleanText(formData, "conditional_operator");
  const rawValue = cleanText(formData, "conditional_value");

  if (!dependsOn || !operator || !rawValue) return null;
  if (!["equals", "not_equals", "contains", "greater_than"].includes(operator)) return null;

  const value =
    rawValue === "true"
      ? true
      : rawValue === "false"
        ? false
        : Number.isFinite(Number(rawValue))
          ? Number(rawValue)
          : rawValue;

  return {
    dependsOn,
    operator: operator as EventQuoteConditionalLogic["operator"],
    value,
  };
}

function toDatabaseOptions(options: EventQuoteFieldOption[]) {
  return options.map((option) => ({
    value: option.value,
    label_fr: option.labelFr,
    label_en: option.labelEn,
  }));
}

function revalidateQuoteAdminPaths(id?: string) {
  revalidatePath("/fr/admin/demandes-de-devis");
  revalidatePath("/fr/admin/demandes-de-devis/configuration");
  if (id) revalidatePath(`/fr/admin/demandes-de-devis/${id}`);
}

export async function updateEventQuoteRequestAction(
  requestId: string,
  previousState: AdminActionResult = { ok: false, message: "" },
  formData: FormData,
): Promise<AdminActionResult> {
  void previousState;
  await requireAdmin("fr");

  if (!isValidUuid(requestId)) {
    return { ok: false, message: "Cette demande est introuvable." };
  }

  const status = cleanText(formData, "status") as EventQuoteStatus;
  const internalNotes = cleanText(formData, "internal_notes");

  if (!EVENT_QUOTE_STATUSES.includes(status)) {
    return { ok: false, message: "Le statut sélectionné est invalide." };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase
    .from("event_quote_requests")
    .update({
      status,
      internal_notes: internalNotes || null,
    })
    .eq("id", requestId);

  if (error) {
    console.error("[admin-event-quotes] Request update failed:", error.message);
    return { ok: false, message: "Impossible de mettre à jour la demande." };
  }

  revalidateQuoteAdminPaths(requestId);
  return { ok: true, message: "La demande a été mise à jour." };
}

export async function deleteEventQuoteRequestAction(requestId: string): Promise<AdminActionResult> {
  await requireAdmin("fr");

  if (!isValidUuid(requestId)) {
    return { ok: false, message: "Cette demande est introuvable." };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase
    .from("event_quote_requests")
    .delete()
    .eq("id", requestId);

  if (error) {
    console.error("[admin-event-quotes] Request deletion failed:", error.message);
    return { ok: false, message: "Impossible de supprimer la demande." };
  }

  revalidateQuoteAdminPaths(requestId);
  redirect("/fr/admin/demandes-de-devis?deleted=1");
}

export async function saveEventQuoteFieldAction(
  previousState: AdminActionResult = { ok: false, message: "" },
  formData: FormData,
): Promise<AdminActionResult> {
  void previousState;
  await requireAdmin("fr");

  const fieldId = cleanText(formData, "field_id");
  const eventTypeId = cleanText(formData, "event_type_id");
  const fieldKey = cleanText(formData, "field_key");
  const labelFr = cleanText(formData, "label_fr");
  const labelEn = cleanText(formData, "label_en");
  const fieldType = cleanText(formData, "field_type") as EventQuoteFieldType;
  const sortOrder = Number(cleanText(formData, "sort_order") || "0");
  const options = parseOptions(cleanText(formData, "options_text"));
  const conditionalLogic = parseCondition(formData);
  const fieldErrors: Record<string, string> = {};

  if (!isValidUuid(eventTypeId)) fieldErrors.event_type_id = "Choisissez un type d'événement.";
  if (fieldId && !isValidUuid(fieldId)) fieldErrors.field_id = "Champ introuvable.";
  if (!/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(fieldKey)) {
    fieldErrors.field_key = "Utilisez une clé stable en minuscules, avec des underscores.";
  }
  if (labelFr.length < 2) fieldErrors.label_fr = "Le libellé français est obligatoire.";
  if (labelEn.length < 2) fieldErrors.label_en = "Le libellé anglais est obligatoire.";
  if (!FIELD_TYPES.includes(fieldType)) fieldErrors.field_type = "Le type de champ est invalide.";
  if (!Number.isFinite(sortOrder) || sortOrder < 0) fieldErrors.sort_order = "L'ordre est invalide.";
  if (["select", "radio", "checkbox_group", "multi_select"].includes(fieldType) && options.length === 0) {
    fieldErrors.options_text = "Ajoutez au moins une option.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, message: "Vérifiez les champs du formulaire.", fieldErrors };
  }

  const payload = {
    event_type_id: eventTypeId,
    field_key: fieldKey,
    label_fr: labelFr,
    label_en: labelEn,
    field_type: fieldType,
    is_required: formData.get("is_required") === "on",
    is_active: formData.get("is_active") === "on",
    sort_order: sortOrder,
    placeholder_fr: cleanText(formData, "placeholder_fr") || null,
    placeholder_en: cleanText(formData, "placeholder_en") || null,
    help_text_fr: cleanText(formData, "help_text_fr") || null,
    help_text_en: cleanText(formData, "help_text_en") || null,
    options: toDatabaseOptions(options),
    conditional_logic: conditionalLogic,
  };

  const supabase = (await createSupabaseServerClient()).schema("site");
  const query = fieldId
    ? supabase.from("event_quote_fields").update(payload).eq("id", fieldId)
    : supabase.from("event_quote_fields").insert(payload);
  const { error } = await query;

  if (error) {
    console.error("[admin-event-quotes] Field save failed:", error.message);
    return { ok: false, message: "Impossible d'enregistrer le champ." };
  }

  revalidateQuoteAdminPaths();
  return { ok: true, message: "Le champ a été enregistré." };
}

export async function toggleEventQuoteFieldAction(fieldId: string, nextActive: boolean) {
  await requireAdmin("fr");

  if (!isValidUuid(fieldId)) {
    return { ok: false, message: "Champ introuvable." };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase
    .from("event_quote_fields")
    .update({ is_active: nextActive })
    .eq("id", fieldId);

  if (error) {
    console.error("[admin-event-quotes] Field toggle failed:", error.message);
    return { ok: false, message: "Impossible de modifier l'état du champ." };
  }

  revalidateQuoteAdminPaths();
  return { ok: true, message: nextActive ? "Champ activé." : "Champ désactivé." };
}
