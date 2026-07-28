"use server";

import { revalidatePath } from "next/cache";
import { getPublicEventQuoteFields } from "@/lib/events/event-quote-fields";
import {
  type EventQuoteFormState,
  validateEventQuoteRequest,
} from "@/lib/events/event-quote-validation";
import type { Locale } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function submitEventQuoteRequestAction(
  locale: Locale,
  _previousState: EventQuoteFormState,
  formData: FormData,
): Promise<EventQuoteFormState> {
  const fields = await getPublicEventQuoteFields();
  const validation = validateEventQuoteRequest(formData, fields);

  if (!validation.ok) {
    return {
      ok: false,
      message:
        locale === "fr"
          ? "Vérifiez les champs du formulaire."
          : "Please check the form fields.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase.from("event_quote_requests").insert({
    full_name: validation.values.fullName,
    email: validation.values.email,
    phone: validation.values.phone,
    whatsapp: validation.values.whatsapp,
    estimated_budget: validation.values.estimatedBudget,
    additional_details: validation.values.additionalDetails,
    event_type_id: validation.values.eventTypeId,
    event_date: validation.values.eventDate,
    specific_answers: validation.values.specificAnswers,
    status: "new",
  });

  if (error) {
    console.error("[events-quote] Insert failed:", error.message);
    return {
      ok: false,
      message:
        locale === "fr"
          ? "Impossible d'envoyer votre demande pour le moment."
          : "Unable to send your request right now.",
      fieldErrors: {},
    };
  }

  revalidatePath("/fr/admin/demandes-de-devis");

  return {
    ok: true,
    message:
      locale === "fr"
        ? "Votre demande de devis a bien été envoyée. Notre équipe vous contactera prochainement."
        : "Your quote request has been sent successfully. Our team will contact you shortly.",
    fieldErrors: {},
  };
}
