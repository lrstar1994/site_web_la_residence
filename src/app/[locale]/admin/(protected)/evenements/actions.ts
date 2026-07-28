"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteEventService } from "@/lib/admin/events/delete-event-service";
import {
  getDefaultEventServiceFormState,
  getEventServiceFormValues,
  saveEventService,
} from "@/lib/admin/events/save-event-service";
import { getEventServiceImageFileFromFormData } from "@/lib/admin/events/upload-event-service-image";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function revalidateEventServicePaths(id?: string) {
  revalidatePath("/fr/evenements");
  revalidatePath("/en/events");
  revalidatePath("/fr/admin/evenements");

  if (id) {
    revalidatePath(`/fr/admin/evenements/${id}/modifier`);
  }
}

export async function createEventServiceAction(
  previousState = getDefaultEventServiceFormState(),
  formData: FormData,
) {
  void previousState;

  const result = await saveEventService({
    mode: "create",
    values: getEventServiceFormValues(formData),
    imageFile: getEventServiceImageFileFromFormData(formData),
  });

  if (!result.ok) {
    return result;
  }

  revalidateEventServicePaths();
  redirect("/fr/admin/evenements?notice=created");
}

export async function updateEventServiceAction(
  serviceId: string,
  previousState = getDefaultEventServiceFormState(),
  formData: FormData,
) {
  void previousState;

  const result = await saveEventService({
    mode: "update",
    serviceId,
    values: getEventServiceFormValues(formData),
    imageFile: getEventServiceImageFileFromFormData(formData),
  });

  if (!result.ok) {
    return result;
  }

  revalidateEventServicePaths(serviceId);
  redirect("/fr/admin/evenements?notice=updated");
}

export async function deleteEventServiceAction(serviceId: string) {
  const result = await deleteEventService(serviceId);

  if (!result.ok) {
    return result;
  }

  revalidateEventServicePaths(serviceId);
  redirect("/fr/admin/evenements?deleted=1");
}

export async function toggleEventServiceAction(serviceId: string, nextActive: boolean) {
  await requireAdmin("fr");
  const supabase = (await createSupabaseServerClient()).schema("site");
  const { error } = await supabase
    .from("event_services")
    .update({ is_active: nextActive })
    .eq("id", serviceId);

  if (error) {
    console.error("[admin-events] Toggle failed:", error.message);
    return {
      ok: false,
      message:
        error.code === "42501"
          ? "Votre session a expiré. Veuillez vous reconnecter."
          : "Impossible de modifier son état.",
    };
  }

  revalidateEventServicePaths(serviceId);

  return {
    ok: true,
    message: nextActive ? "Prestation activée avec succès." : "Prestation désactivée avec succès.",
  };
}
