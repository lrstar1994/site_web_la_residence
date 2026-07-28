import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Venue, VenueCardModel, VenueSetup } from "@/types/venue";

type VenueRow = {
  id: string;
  code: string;
  name: string;
  location_fr: string;
  location_en: string;
  short_description_fr: string;
  short_description_en: string;
  description_fr: string;
  description_en: string;
  capacity: number;
  surface_m2: number | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ImageRow = {
  id: string;
  venue_id: string;
  image_path: string;
  alt_fr: string;
  alt_en: string;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

type SetupLinkRow = {
  id: string;
  venue_id: string;
  capacity: number | null;
  sort_order: number;
  setup: {
    id: string;
    code: string;
    name_fr: string;
    name_en: string;
    icon_key: string | null;
    sort_order: number;
    is_active: boolean;
  } | null;
};

export type VenuesResult =
  | { ok: true; venues: Venue[]; cards: VenueCardModel[] }
  | { ok: false; venues: Venue[]; cards: VenueCardModel[]; error: string };

function formatArea(surfaceM2: number | null) {
  return surfaceM2 ? `${Number(surfaceM2)} m²` : "";
}

function toCards(venues: Venue[]): VenueCardModel[] {
  return venues.map((venue) => {
    const sortedImages = [...venue.images].sort((a, b) => Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder);
    const cover = sortedImages[0];

    return {
      id: venue.id,
      code: venue.code,
      name: { fr: venue.name, en: venue.name },
      location: venue.location,
      capacity: { fr: `${venue.capacity} personnes`, en: `${venue.capacity} guests` },
      area: formatArea(venue.surfaceM2),
      shortDescription: venue.shortDescription,
      fullDescription: venue.description,
      setups: venue.setups.map((setup) => setup.name),
      setupItems: venue.setups,
      coverImage: {
        src: cover?.imagePath ?? "/salles.jpeg",
        alt: cover?.alt ?? { fr: `Salle ${venue.name}`, en: `${venue.name} venue` },
      },
      images: sortedImages.map((image) => ({
        src: image.imagePath,
        alt: image.alt,
      })),
    };
  });
}

export async function getVenues(): Promise<VenuesResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");
    const [venuesResult, imagesResult, setupResult] = await Promise.all([
      supabase
        .from("venues")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("venue_images")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase
        .from("venue_setup_links")
        .select("id,venue_id,capacity,sort_order,setup:setup_type_id(id,code,name_fr,name_en,icon_key,sort_order,is_active)")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    if (venuesResult.error || imagesResult.error || setupResult.error) {
      console.error(
        "[venues] Unable to load data:",
        venuesResult.error?.message ?? imagesResult.error?.message ?? setupResult.error?.message,
      );
      return { ok: false, venues: [], cards: [], error: "venues_unavailable" };
    }

    const imagesByVenue = new Map<string, ImageRow[]>();
    for (const image of (imagesResult.data ?? []) as unknown as ImageRow[]) {
      const current = imagesByVenue.get(image.venue_id) ?? [];
      current.push(image);
      imagesByVenue.set(image.venue_id, current);
    }

    const setupsByVenue = new Map<string, VenueSetup[]>();
    for (const link of (setupResult.data ?? []) as unknown as SetupLinkRow[]) {
      if (!link.setup?.is_active) continue;
      const current = setupsByVenue.get(link.venue_id) ?? [];
      current.push({
        id: link.setup.id,
        code: link.setup.code,
        name: { fr: link.setup.name_fr, en: link.setup.name_en },
        iconKey: link.setup.icon_key,
        capacity: link.capacity,
        sortOrder: link.sort_order || link.setup.sort_order,
        isActive: link.setup.is_active,
      });
      setupsByVenue.set(link.venue_id, current);
    }

    const venues = ((venuesResult.data ?? []) as unknown as VenueRow[]).map((row) => {
      const images = (imagesByVenue.get(row.id) ?? []).sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
      const setups = (setupsByVenue.get(row.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        id: row.id,
        code: row.code,
        name: row.name,
        location: { fr: row.location_fr, en: row.location_en },
        shortDescription: { fr: row.short_description_fr, en: row.short_description_en },
        description: { fr: row.description_fr, en: row.description_en },
        capacity: row.capacity,
        surfaceM2: row.surface_m2,
        sortOrder: row.sort_order,
        isActive: row.is_active,
        images: images.map((image) => ({
          id: image.id,
          imagePath: image.image_path,
          alt: { fr: image.alt_fr, en: image.alt_en },
          sortOrder: image.sort_order,
          isCover: image.is_cover,
          isActive: image.is_active,
        })),
        setups,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      } satisfies Venue;
    });

    return { ok: true, venues, cards: toCards(venues) };
  } catch (error) {
    console.error("[venues] Loading failed:", error instanceof Error ? error.message : "Unknown error");
    return { ok: false, venues: [], cards: [], error: "supabase_unavailable" };
  }
}
