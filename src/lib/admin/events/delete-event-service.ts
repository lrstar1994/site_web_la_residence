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

type EventServiceImageDeleteRow = {
  id: string;
  image_path: string;
};

function logSupabaseError(
  step: string,
  error: { code?: string; message?: string; details?: string; hint?: string },
  context: Record<string, unknown>,
) {
  console.error(`[event-admin-delete] ${step}`, {
    ...context,
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}

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

  const { count: quoteRequestCount, error: quoteRequestsError } = await supabase
    .from("event_quote_requests")
    .select("id", { count: "exact", head: true })
    .eq("event_type_id", serviceId);

  if (quoteRequestsError) {
    logSupabaseError("Quote request dependency check failed", quoteRequestsError, { serviceId });
    return { ok: false, message: "Impossible de verifier les demandes de devis associees a cette prestation." };
  }

  if ((quoteRequestCount ?? 0) > 0) {
    console.warn("[event-admin-delete] Deletion blocked by quote requests", {
      serviceId,
      quoteRequestCount,
    });
    return {
      ok: false,
      message:
        "Cette prestation possede des demandes de devis associees. Elle ne peut pas etre supprimee definitivement. Desactivez-la pour la retirer du site public.",
    };
  }

  const { data: images, error: imagesError } = await supabase
    .from("event_service_images")
    .select("id,image_path")
    .eq("event_service_id", serviceId);

  if (imagesError) {
    logSupabaseError("Image rows load failed", imagesError, { serviceId });
    return { ok: false, message: "Impossible de supprimer les images de cette prestation." };
  }

  const { error: deleteFieldsError } = await supabase
    .from("event_quote_fields")
    .delete()
    .eq("event_type_id", serviceId);

  if (deleteFieldsError) {
    logSupabaseError("Quote fields deletion failed", deleteFieldsError, { serviceId });
    return { ok: false, message: "Impossible de supprimer les champs de devis associes a cette prestation." };
  }

  const imageRows = (images ?? []) as EventServiceImageDeleteRow[];
  const storagePaths = [
    ...new Set(
      imageRows
        .map((image) => getEventServiceStoragePath(image.image_path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];
  const legacyStoragePath = getEventServiceStoragePath(row.image_path);

  if (
    legacyStoragePath &&
    !storagePaths.includes(legacyStoragePath) &&
    imageRows.length === 0
  ) {
    storagePaths.push(legacyStoragePath);
  }

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabaseClient.storage
      .from("site-news")
      .remove(storagePaths);

    if (storageError) {
      logSupabaseError("Storage deletion failed", storageError, { serviceId, paths: storagePaths });
      return { ok: false, message: "Impossible de supprimer les fichiers associes a cette prestation." };
    }
  }

  if (imageRows.length > 0) {
    const { error: deleteImagesError } = await supabase
      .from("event_service_images")
      .delete()
      .eq("event_service_id", serviceId)
      .in("id", imageRows.map((image) => image.id));

    if (deleteImagesError) {
      logSupabaseError("Image row deletion failed", deleteImagesError, {
        serviceId,
        imageIds: imageRows.map((image) => image.id),
        paths: storagePaths,
      });
      return {
        ok: false,
        message: "Les fichiers ont ete supprimes, mais les references des images n'ont pas pu etre supprimees.",
      };
    }
  }

  const { error: deleteError } = await supabase
    .from("event_services")
    .delete()
    .eq("id", serviceId);

  if (deleteError) {
    logSupabaseError("Event row deletion failed", deleteError, {
      serviceId,
      paths: storagePaths,
    });
    return { ok: false, message: "Les images ont ete supprimees, mais la prestation n'a pas pu etre supprimee." };
  }

  return { ok: true, message: "La prestation a ete supprimee definitivement." };
}
