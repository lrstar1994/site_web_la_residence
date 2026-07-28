import "server-only";

import { getRestaurantStoragePath } from "@/lib/admin/restaurant/get-restaurant-storage-path";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteRestaurantMenuResult = {
  ok: boolean;
  message: string;
};

type RestaurantMenuImageRow = {
  id: string;
  menu_id: string;
  image_path: string;
  is_cover: boolean;
};

export async function deleteAdminRestaurantMenu(menuId: string): Promise<DeleteRestaurantMenuResult> {
  await requireAdmin("fr");

  if (!isValidUuid(menuId)) {
    return { ok: false, message: "Cette carte n'existe plus." };
  }

  const supabaseClient = await createSupabaseServerClient();
  const supabase = supabaseClient.schema("site");

  const { data: menu, error: menuError } = await supabase
    .from("restaurant_menus")
    .select("id,code,title_fr")
    .eq("id", menuId)
    .maybeSingle();

  if (menuError) {
    console.error("[admin-restaurant-delete] Menu load failed:", {
      menuId,
      message: menuError.message,
    });
    return { ok: false, message: "Impossible de supprimer cette carte." };
  }

  if (!menu) {
    return { ok: false, message: "Cette carte n'existe plus." };
  }

  const { data: images, error: imagesError } = await supabase
    .from("restaurant_menu_images")
    .select("id,menu_id,image_path,is_cover")
    .eq("menu_id", menuId);

  if (imagesError) {
    console.error("[admin-restaurant-delete] Images load failed:", {
      menuId,
      message: imagesError.message,
    });
    return { ok: false, message: "Impossible de charger les images associees a cette carte." };
  }

  const imageRows = (images ?? []) as RestaurantMenuImageRow[];
  const storagePaths = [
    ...new Set(
      imageRows
        .map((image) => getRestaurantStoragePath(image.image_path))
        .filter((path): path is string => Boolean(path)),
    ),
  ];

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabaseClient.storage.from("site-news").remove(storagePaths);

    if (storageError) {
      console.error("[admin-restaurant-delete] Storage deletion failed:", {
        menuId,
        imageIds: imageRows.map((image) => image.id),
        paths: storagePaths,
        message: storageError.message,
      });
      return { ok: false, message: "Impossible de supprimer les fichiers associes a cette carte." };
    }
  }

  if (imageRows.length > 0) {
    const { error: deleteImagesError } = await supabase
      .from("restaurant_menu_images")
      .delete()
      .eq("menu_id", menuId)
      .in("id", imageRows.map((image) => image.id));

    if (deleteImagesError) {
      console.error("[admin-restaurant-delete] Image row deletion failed:", {
        menuId,
        imageIds: imageRows.map((image) => image.id),
        paths: storagePaths,
        message: deleteImagesError.message,
      });
      return {
        ok: false,
        message: "Les fichiers ont ete supprimes, mais les references des images n'ont pas pu etre supprimees.",
      };
    }
  }

  const { error: deleteMenuError } = await supabase.from("restaurant_menus").delete().eq("id", menuId);

  if (deleteMenuError) {
    console.error("[admin-restaurant-delete] Menu row deletion failed:", {
      menuId,
      imageIds: imageRows.map((image) => image.id),
      message: deleteMenuError.message,
    });
    return { ok: false, message: "Les images ont ete supprimees, mais la carte n'a pas pu etre supprimee." };
  }

  return { ok: true, message: "La carte a ete supprimee definitivement." };
}
