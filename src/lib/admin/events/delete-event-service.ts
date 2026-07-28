import "server-only";

import { getEventServiceStoragePath } from "@/lib/admin/events/get-event-service-storage-path";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteEventServiceResult = {
  ok: boolean;
  message: string;
};

type EventServiceDeleteRow = {
  id: string;
  code: string;
  title_fr: string;
  image_path: string;
};

export async function deleteEventService(serviceId: string): Promise<DeleteEventServiceResult> {
  await requireAdmin("fr");

  if (!isValidUuid(serviceId)) {
    return { ok: false, message: "Cette prestation n'existe plus." };
  }

  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");

  const { data: service, error: serviceError } = await supabase
    .from("event_services")
    .select("id,code,title_fr,image_path")
    .eq("id", serviceId)
    .maybeSingle();

  if (serviceError) {
    console.error("[event-admin-delete] Service load failed:", {
      serviceId,
      message: serviceError.message,
    });
    return { ok: false, message: "Impossible de supprimer cette prestation." };
  }

  if (!service) {
    return { ok: false, message: "Cette prestation n'existe plus." };
  }

  const row = service as EventServiceDeleteRow;
  const storagePath = getEventServiceStoragePath(row.image_path);

  if (storagePath) {
    const { error: storageError } = await supabaseClient.storage
      .from("site-news")
      .remove([storagePath]);

    if (storageError) {
      console.error("[event-admin-delete] Storage deletion failed:", {
        serviceId,
        path: storagePath,
        message: storageError.message,
      });
      return { ok: false, message: "Impossible de supprimer le fichier associe a cette prestation." };
    }
  }

  const { error: deleteError } = await supabase
    .from("event_services")
    .delete()
    .eq("id", serviceId);

  if (deleteError) {
    console.error("[event-admin-delete] Row deletion failed:", {
      serviceId,
      path: storagePath,
      message: deleteError.message,
    });
    return { ok: false, message: "L'image a ete supprimee, mais la prestation n'a pas pu etre supprimee." };
  }

  return { ok: true, message: "La prestation a ete supprimee definitivement." };
}
