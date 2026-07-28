import "server-only";

import type {
  AdminAccommodationDetail,
  AdminAccommodationFeature,
  AdminAccommodationFeatureGroup,
} from "@/lib/admin/accommodations/admin-accommodation-types";
import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type AdminAccommodation = {
  id: string;
  code: string;
  nameFr: string;
  nameEn: string;
  categoryFr: string | null;
  categoryEn: string | null;
  shortDescriptionFr: string;
  shortDescriptionEn: string;
  capacity: number;
  surfaceM2: number | null;
  priceFrom: number;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
  coverImage: string | null;
  featureCount: number;
};

type Row = {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  category_fr: string | null;
  category_en: string | null;
  short_description_fr: string;
  short_description_en: string;
  capacity: number;
  surface_m2: number | null;
  price_from: number;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

type ImageRow = { accommodation_id: string; image_path: string; is_cover: boolean; sort_order: number };
type LinkRow = { accommodation_id: string };
type DetailImageRow = {
  id: string;
  image_path: string;
  alt_fr: string;
  alt_en: string;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};
type DetailLinkRow = { feature_id: string; is_active: boolean };
type GroupRow = {
  id: string;
  code: "assets" | "essentials" | "residence-benefits";
  name_fr: string;
  name_en: string;
  sort_order: number;
};
type FeatureRow = {
  id: string;
  group_id: string;
  code: string;
  name_fr: string;
  name_en: string;
  description_fr: string | null;
  description_en: string | null;
  icon_key: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
  group: { code: "assets" | "essentials" | "residence-benefits" } | null;
};

export async function getAdminAccommodations() {
  const supabase = (await getSupabaseServerClient()).schema("site");
  const [accommodations, images, links] = await Promise.all([
    supabase.from("accommodations").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("accommodation_images").select("accommodation_id,image_path,is_cover,sort_order").eq("is_active", true),
    supabase.from("accommodation_feature_links").select("accommodation_id").eq("is_active", true),
  ]);

  if (accommodations.error) {
    console.error("[admin-accommodations] Load failed:", accommodations.error.message);
    return { ok: false as const, accommodations: [], error: "unavailable" };
  }

  const imagesById = new Map<string, ImageRow[]>();
  for (const image of (images.data ?? []) as unknown as ImageRow[]) {
    const current = imagesById.get(image.accommodation_id) ?? [];
    current.push(image);
    imagesById.set(image.accommodation_id, current);
  }

  const featureCounts = new Map<string, number>();
  for (const link of (links.data ?? []) as unknown as LinkRow[]) {
    featureCounts.set(link.accommodation_id, (featureCounts.get(link.accommodation_id) ?? 0) + 1);
  }

  return {
    ok: true as const,
    accommodations: ((accommodations.data ?? []) as unknown as Row[]).map((row) => {
      const cover = (imagesById.get(row.id) ?? []).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)[0];
      return {
        id: row.id,
        code: row.code,
        nameFr: row.name_fr,
        nameEn: row.name_en,
        categoryFr: row.category_fr,
        categoryEn: row.category_en,
        shortDescriptionFr: row.short_description_fr,
        shortDescriptionEn: row.short_description_en,
        capacity: row.capacity,
        surfaceM2: row.surface_m2,
        priceFrom: row.price_from,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        updatedAt: row.updated_at,
        coverImage: cover?.image_path ?? null,
        featureCount: featureCounts.get(row.id) ?? 0,
      } satisfies AdminAccommodation;
    }),
  };
}

export async function getAdminAccommodation(id: string) {
  if (!isValidUuid(id)) {
    return { ok: false as const, accommodation: null, error: "not_found" };
  }

  const supabase = (await getSupabaseServerClient()).schema("site");
  await ensureAdminReadContext();
  const [accommodation, images, links] = await Promise.all([
    supabase.from("accommodations").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("accommodation_images")
      .select("id,image_path,alt_fr,alt_en,sort_order,is_cover,is_active")
      .eq("accommodation_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("accommodation_feature_links")
      .select("feature_id,is_active")
      .eq("accommodation_id", id)
      .eq("is_active", true),
  ]);

  if (accommodation.error || images.error || links.error) {
    console.error(
      "[admin-accommodations] Load detail failed:",
      accommodation.error?.message ?? images.error?.message ?? links.error?.message,
    );
    return { ok: false as const, accommodation: null, error: "unavailable" };
  }

  if (!accommodation.data) {
    return { ok: false as const, accommodation: null, error: "not_found" };
  }

  const row = accommodation.data as unknown as Row;
  const detail: AdminAccommodationDetail = {
    id: row.id,
    code: row.code,
    nameFr: row.name_fr,
    nameEn: row.name_en,
    categoryFr: row.category_fr ?? "",
    categoryEn: row.category_en ?? "",
    shortDescriptionFr: row.short_description_fr,
    shortDescriptionEn: row.short_description_en,
    capacity: row.capacity,
    surfaceM2: row.surface_m2 ? String(row.surface_m2) : "",
    priceFrom: String(row.price_from),
    sortOrder: String(row.sort_order),
    isActive: row.is_active,
    images: ((images.data ?? []) as unknown as DetailImageRow[]).map((image) => ({
      id: image.id,
      imagePath: image.image_path,
      altFr: image.alt_fr,
      altEn: image.alt_en,
      sortOrder: image.sort_order,
      isCover: image.is_cover,
      isActive: image.is_active,
    })),
    selectedFeatureIds: ((links.data ?? []) as unknown as DetailLinkRow[]).map((link) => link.feature_id),
  };

  return { ok: true as const, accommodation: detail };
}

export async function getAdminAccommodationFeatureGroups() {
  const supabase = (await getSupabaseServerClient()).schema("site");
  const { data, error } = await supabase
    .from("accommodation_feature_groups")
    .select("id,code,name_fr,name_en,sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin-accommodations] Load groups failed:", error.message);
    return { ok: false as const, groups: [] };
  }

  return {
    ok: true as const,
    groups: ((data ?? []) as unknown as GroupRow[]).map(
      (group): AdminAccommodationFeatureGroup => ({
        id: group.id,
        code: group.code,
        nameFr: group.name_fr,
        nameEn: group.name_en,
        sortOrder: group.sort_order,
      }),
    ),
  };
}

export async function getAdminAccommodationFeatures() {
  const supabase = (await getSupabaseServerClient()).schema("site");
  const [features, links] = await Promise.all([
    supabase
      .from("accommodation_features")
      .select("id,group_id,code,name_fr,name_en,description_fr,description_en,icon_key,sort_order,is_active,updated_at,group:group_id(code)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("accommodation_feature_links").select("feature_id").eq("is_active", true),
  ]);

  if (features.error) {
    console.error("[admin-accommodations] Load features failed:", features.error.message);
    return { ok: false as const, features: [] };
  }

  const usage = new Map<string, number>();
  for (const link of (links.data ?? []) as unknown as Array<{ feature_id: string }>) {
    usage.set(link.feature_id, (usage.get(link.feature_id) ?? 0) + 1);
  }

  return {
    ok: true as const,
    features: ((features.data ?? []) as unknown as FeatureRow[]).map(
      (feature): AdminAccommodationFeature => ({
        id: feature.id,
        groupId: feature.group_id,
        groupCode: feature.group?.code ?? "assets",
        code: feature.code,
        nameFr: feature.name_fr,
        nameEn: feature.name_en,
        descriptionFr: feature.description_fr ?? "",
        descriptionEn: feature.description_en ?? "",
        iconKey: feature.icon_key ?? "",
        sortOrder: feature.sort_order,
        isActive: feature.is_active,
        updatedAt: feature.updated_at,
        usageCount: usage.get(feature.id) ?? 0,
      }),
    ),
  };
}

export async function getAdminAccommodationFeature(id: string) {
  if (!isValidUuid(id)) {
    return { ok: false as const, feature: null, error: "not_found" };
  }

  const supabase = (await getSupabaseServerClient()).schema("site");
  await ensureAdminReadContext();
  const [featureResult, links] = await Promise.all([
    supabase
      .from("accommodation_features")
      .select(
        "id,group_id,code,name_fr,name_en,description_fr,description_en,icon_key,sort_order,is_active,updated_at,group:group_id(code)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("accommodation_feature_links")
      .select("feature_id")
      .eq("feature_id", id)
      .eq("is_active", true),
  ]);

  if (featureResult.error || links.error) {
    console.error(
      "[admin-accommodations] Feature detail load failed:",
      featureResult.error?.message ?? links.error?.message,
    );
    return { ok: false as const, feature: null, error: "unavailable" };
  }

  if (!featureResult.data) {
    return { ok: false as const, feature: null, error: "not_found" };
  }

  const feature = featureResult.data as unknown as FeatureRow;
  return {
    ok: true as const,
    feature: {
      id: feature.id,
      groupId: feature.group_id,
      groupCode: feature.group?.code ?? "assets",
      code: feature.code,
      nameFr: feature.name_fr,
      nameEn: feature.name_en,
      descriptionFr: feature.description_fr ?? "",
      descriptionEn: feature.description_en ?? "",
      iconKey: feature.icon_key ?? "",
      sortOrder: feature.sort_order,
      isActive: feature.is_active,
      updatedAt: feature.updated_at,
      usageCount: ((links.data ?? []) as unknown as Array<{ feature_id: string }>).length,
    },
  };
}
