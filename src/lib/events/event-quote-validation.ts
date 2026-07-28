import type { EventQuoteField } from "@/types/event-quote";

export type EventQuoteFormState = {
  ok: boolean;
  message: string;
  fieldErrors: Record<string, string>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function asText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isVisible(field: EventQuoteField, answers: Record<string, unknown>) {
  const condition = field.conditionalLogic;
  if (!condition) return true;
  const dependency = answers[condition.dependsOn];

  switch (condition.operator) {
    case "equals":
      return dependency === condition.value;
    case "not_equals":
      return dependency !== condition.value;
    case "contains":
      return Array.isArray(dependency) && dependency.includes(condition.value);
    case "greater_than":
      return Number(dependency) > Number(condition.value);
    default:
      return false;
  }
}

function optionValues(field: EventQuoteField) {
  return new Set(field.options.map((option) => option.value));
}

export function validateEventQuoteRequest(formData: FormData, fields: EventQuoteField[]) {
  const fieldErrors: Record<string, string> = {};
  const fullName = asText(formData.get("full_name"));
  const email = asText(formData.get("email"));
  const phone = asText(formData.get("phone"));
  const whatsapp = asText(formData.get("whatsapp"));
  const eventTypeId = asText(formData.get("event_type_id"));
  const eventDate = asText(formData.get("event_date"));
  const budgetRaw = asText(formData.get("estimated_budget"));
  const additionalDetails = asText(formData.get("additional_details"));
  const honeypot = asText(formData.get("website"));

  if (honeypot) fieldErrors.form = "Impossible d'envoyer la demande.";
  if (fullName.length < 2) fieldErrors.full_name = "Indiquez votre nom complet.";
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Indiquez une adresse email valide.";
  if (phone.length < 4) fieldErrors.phone = "Indiquez un numéro de téléphone.";
  if (!eventTypeId) fieldErrors.event_type_id = "Choisissez un type d'événement.";
  if (additionalDetails.length > 3000) fieldErrors.additional_details = "Le message est trop long.";

  const estimatedBudget = budgetRaw ? Number(budgetRaw) : null;
  if (estimatedBudget !== null && (!Number.isFinite(estimatedBudget) || estimatedBudget < 0)) {
    fieldErrors.estimated_budget = "Indiquez un budget valide.";
  }

  const answers: Record<string, unknown> = {};
  const activeFields = fields.filter((field) => field.eventTypeId === eventTypeId && field.isActive);

  for (const field of activeFields) {
    const key = `specific_${field.fieldKey}`;
    const allowedValues = optionValues(field);
    let value: unknown = null;

    if (field.fieldType === "checkbox_group" || field.fieldType === "multi_select") {
      const values = formData.getAll(key).map((item) => String(item));
      const cleanValues = values.filter((item) => allowedValues.has(item));
      if (values.length !== cleanValues.length) {
        fieldErrors[field.fieldKey] = "Une option sélectionnée est invalide.";
      }
      value = cleanValues;
    } else if (field.fieldType === "boolean") {
      value = formData.get(key) === "true";
    } else if (field.fieldType === "number") {
      const raw = asText(formData.get(key));
      const numericValue = raw ? Number(raw) : null;
      value = numericValue;
      if (numericValue !== null && (!Number.isFinite(numericValue) || numericValue < 0)) {
        fieldErrors[field.fieldKey] = "Indiquez un nombre valide.";
      }
      if (field.fieldKey === "participants_count" && (numericValue === null || numericValue < 1)) {
        fieldErrors[field.fieldKey] = "Indiquez au moins 1 participant.";
      }
    } else {
      value = asText(formData.get(key));
      if ((field.fieldType === "select" || field.fieldType === "radio") && value) {
        if (!allowedValues.has(String(value))) {
          fieldErrors[field.fieldKey] = "L'option sélectionnée est invalide.";
        }
      }
    }

    answers[field.fieldKey] = value;
  }

  const visibleAnswers: Record<string, unknown> = {};
  for (const field of activeFields) {
    if (!isVisible(field, answers)) continue;
    const value = answers[field.fieldKey];

    if (
      field.isRequired &&
      (value === null || value === "" || (Array.isArray(value) && value.length === 0))
    ) {
      fieldErrors[field.fieldKey] = "Ce champ est obligatoire.";
    }

    if (value !== null && value !== "" && (!Array.isArray(value) || value.length > 0)) {
      visibleAnswers[field.fieldKey] = value;
    }
  }

  if (JSON.stringify(visibleAnswers).length > 12000) {
    fieldErrors.form = "La demande contient trop d'informations.";
  }

  return {
    ok: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    values: {
      fullName,
      email,
      phone,
      whatsapp: whatsapp || null,
      eventTypeId,
      eventDate: eventDate || null,
      estimatedBudget,
      additionalDetails: additionalDetails || null,
      specificAnswers: visibleAnswers,
    },
  };
}
