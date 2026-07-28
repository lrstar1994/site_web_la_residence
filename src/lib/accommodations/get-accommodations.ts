import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Accommodation,
  AccommodationCardModel,
  AccommodationFeatureGroup,
  AccommodationFeatureGroupCode,
} from "@/types/accommodation";

type AccommodationRow = {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  short_description_fr: string;
  short_description_en: string;
  description_fr: string;
  description_en: string;
  category_fr: string | null;
  category_en: string | null;
  capacity: number;
  surface_m2: number | null;
  price_from: number;
  currency: "MGA";
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ImageRow = {
  id: string;
  accommodation_id: string;
  image_path: string;
  alt_fr: string;
  alt_en: string;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

type LinkRow = {
  id: string;
  accommodation_id: string;
  sort_order: number;
  custom_label_fr: string | null;
  custom_label_en: string | null;
  feature: {
    id: string;
    code: string;
    name_fr: string;
    name_en: string;
    description_fr: string | null;
    description_en: string | null;
    icon_key: string | null;
    sort_order: number;
    group: {
      id: string;
      code: AccommodationFeatureGroupCode;
      name_fr: string;
      name_en: string;
      sort_order: number;
    } | null;
  } | null;
};

export type AccommodationsResult =
  | { ok: true; accommodations: Accommodation[]; cards: AccommodationCardModel[] }
  | { ok: false; accommodations: Accommodation[]; cards: AccommodationCardModel[]; error: string };

function formatPrice(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function toCards(accommodations: Accommodation[]): AccommodationCardModel[] {
  return accommodations.map((item) => {
    const groups = Object.fromEntries(item.featureGroups.map((group) => [group.code, group]));
    const assets = groups.assets?.features ?? [];
    const essentials = groups.essentials?.features ?? [];
    const benefits = groups["residence-benefits"]?.features ?? [];

    return {
      id: item.id,
      category: {
        fr: item.category.fr ?? "",
        en: item.category.en ?? "",
      },
      name: item.name,
      subtitle: item.shortDescription,
      price: formatPrice(item.priceFrom),
      surface: item.surfaceM2 ? `${Number(item.surfaceM2)} m²` : "",
      capacity: {
        fr: `${item.capacity} pers.`,
        en: `${item.capacity} guests`,
      },
      atouts: assets.map((feature) => ({
        fr: feature.customLabel.fr ?? feature.name.fr,
        en: feature.customLabel.en ?? feature.name.en,
      })),
      essentials: essentials.map((feature) => ({
        fr: feature.customLabel.fr ?? feature.name.fr,
        en: feature.customLabel.en ?? feature.name.en,
      })),
      plus: benefits.map((feature) => ({
        fr: feature.customLabel.fr ?? feature.name.fr,
        en: feature.customLabel.en ?? feature.name.en,
      })),
      images: item.images.map((image) => image.imagePath),
      featureGroups: item.featureGroups,
    };
  });
}

export async function getAccommodations(): Promise<AccommodationsResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");
    const [{ data: accommodationData, error: accommodationError }, { data: imageData, error: imageError }, { data: linkData, error: linkError }] =
      await Promise.all([
        supabase.from("accommodations").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase.from("accommodation_images").select("*").eq("is_active", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
        supabase
          .from("accommodation_feature_links")
          .select(
            "id,accommodation_id,sort_order,custom_label_fr,custom_label_en,feature:feature_id(id,code,name_fr,name_en,description_fr,description_en,icon_key,sort_order,group:group_id(id,code,name_fr,name_en,sort_order))",
          )
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

    if (accommodationError || imageError || linkError) {
      console.error("[accommodations] Unable to load data:", accommodationError?.message ?? imageError?.message ?? linkError?.message);
      return { ok: false, accommodations: [], cards: [], error: "accommodations_unavailable" };
    }

    const imagesByAccommodation = new Map<string, ImageRow[]>();
    for (const image of (imageData ?? []) as unknown as ImageRow[]) {
      const current = imagesByAccommodation.get(image.accommodation_id) ?? [];
      current.push(image);
      imagesByAccommodation.set(image.accommodation_id, current);
    }

    const groupsByAccommodation = new Map<string, Map<AccommodationFeatureGroupCode, AccommodationFeatureGroup>>();
    for (const link of (linkData ?? []) as unknown as LinkRow[]) {
      if (!link.feature?.group) continue;
      const group = link.feature.group;
      const accommodationGroups = groupsByAccommodation.get(link.accommodation_id) ?? new Map();
      const existing = accommodationGroups.get(group.code) ?? {
        id: group.id,
        code: group.code,
        name: { fr: group.name_fr, en: group.name_en },
        sortOrder: group.sort_order,
        features: [],
      };
      existing.features.push({
        id: link.feature.id,
        code: link.feature.code,
        groupCode: group.code,
        name: { fr: link.feature.name_fr, en: link.feature.name_en },
        description: { fr: link.feature.description_fr, en: link.feature.description_en },
        iconKey: link.feature.icon_key,
        sortOrder: link.sort_order || link.feature.sort_order,
        customLabel: { fr: link.custom_label_fr, en: link.custom_label_en },
      });
      accommodationGroups.set(group.code, existing);
      groupsByAccommodation.set(link.accommodation_id, accommodationGroups);
    }

    const accommodations = ((accommodationData ?? []) as unknown as AccommodationRow[]).map((row) => {
      const images = (imagesByAccommodation.get(row.id) ?? []).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
      const featureGroups = Array.from(groupsByAccommodation.get(row.id)?.values() ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
      featureGroups.forEach((group) => group.features.sort((a, b) => a.sortOrder - b.sortOrder));

      return {
        id: row.id,
        code: row.code,
        name: { fr: row.name_fr, en: row.name_en },
        shortDescription: { fr: row.short_description_fr, en: row.short_description_en },
        description: { fr: row.description_fr, en: row.description_en },
        category: { fr: row.category_fr, en: row.category_en },
        capacity: row.capacity,
        surfaceM2: row.surface_m2,
        priceFrom: row.price_from,
        currency: row.currency,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        images: images.map((image) => ({
          id: image.id,
          imagePath: image.image_path,
          alt: { fr: image.alt_fr, en: image.alt_en },
          sortOrder: image.sort_order,
          isCover: image.is_cover,
          isActive: image.is_active,
        })),
        featureGroups,
      } satisfies Accommodation;
    });

    return { ok: true, accommodations, cards: toCards(accommodations) };
  } catch (error) {
    console.error("[accommodations] Loading failed:", error instanceof Error ? error.message : "Unknown error");
    return { ok: false, accommodations: [], cards: [], error: "supabase_unavailable" };
  }
}
