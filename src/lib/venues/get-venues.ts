import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Venue,
  VenueCardModel,
  VenueSetup,
  VenueUsePresentation,
} from "@/types/venue";

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
  category_id: string | null;
  created_at: string;
  updated_at: string;

  category: {
    id: string;
    code: string;
    name_fr: string;
    name_en: string;
    is_active: boolean;
  } | null;
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

type UsePresentationRow = {
  id: string;
  venue_id: string;
  use_type_id: string;
  title_fr: string;
  title_en: string;
  description_fr: string;
  description_en: string;
  sort_order: number;
  is_active: boolean;

  use_type: {
    id: string;
    code: string;
    name_fr: string;
    name_en: string;
    sort_order: number;
    is_active: boolean;
  } | null;
};

type UseImageRow = {
  id: string;
  venue_use_presentation_id: string;
  image_path: string;
  alt_fr: string | null;
  alt_en: string | null;
  sort_order: number;
  is_cover: boolean;
  is_active: boolean;
};

export type VenuesResult =
  | {
      ok: true;
      venues: Venue[];
      cards: VenueCardModel[];
    }
  | {
      ok: false;
      venues: Venue[];
      cards: VenueCardModel[];
      error: string;
    };

function formatArea(surfaceM2: number | null) {
  return surfaceM2 ? `${Number(surfaceM2)} m²` : "";
}

/* =========================================================
   Images mixtes pour le diaporama des cartes
   ========================================================= */

type CardImage = {
  src: string;
  alt: {
    fr: string;
    en: string;
  };
};

function buildMixedVenueImages(venue: Venue): CardImage[] {
  const sortedGeneralImages = [...venue.images].sort(
    (a, b) =>
      Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder,
  );

  const generalCover =
    sortedGeneralImages.find((image) => image.isCover) ??
    sortedGeneralImages[0];

  const generalWithoutCover = sortedGeneralImages
    .filter((image) => image.id !== generalCover?.id)
    .map((image) => ({
      src: image.imagePath,
      alt: image.alt,
    }));

  const useSources = venue.uses
    .filter((use) => use.isActive)
    .map((use) =>
      [...use.images]
        .filter((image) => image.isActive)
        .sort(
          (a, b) =>
            Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder,
        )
        .map((image) => ({
          src: image.imagePath,
          alt: image.alt,
        })),
    )
    .filter((images) => images.length > 0);

  const sources: CardImage[][] = [generalWithoutCover, ...useSources].filter(
    (source) => source.length > 0,
  );

  const mixed: CardImage[] = [];

  let index = 0;
  let hasRemainingImages = true;

  while (hasRemainingImages) {
    hasRemainingImages = false;

    for (const source of sources) {
      const image = source[index];

      if (image) {
        mixed.push(image);
        hasRemainingImages = true;
      }
    }

    index += 1;
  }

  const firstImage: CardImage | null = generalCover
    ? {
        src: generalCover.imagePath,
        alt: generalCover.alt,
      }
    : (useSources[0]?.[0] ?? null);

  const combined = firstImage ? [firstImage, ...mixed] : mixed;

  return Array.from(
    new Map(combined.map((image) => [image.src, image])).values(),
  );
}

/* =========================================================
   Conversion en cartes publiques
   ========================================================= */

function toCards(venues: Venue[]): VenueCardModel[] {
  return venues.map((venue) => {
    const sortedImages = [...venue.images].sort(
      (a, b) =>
        Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder,
    );

    const allImages = buildMixedVenueImages(venue);
    const cover = allImages[0];

    return {
      id: venue.id,
      code: venue.code,

      name: {
        fr: venue.name,
        en: venue.name,
      },

      location: venue.location,

      capacity: {
        fr: `${venue.capacity} personnes`,
        en: `${venue.capacity} guests`,
      },

      area: formatArea(venue.surfaceM2),

      shortDescription: venue.shortDescription,

      fullDescription: venue.description,

      category: venue.category,

      setups: venue.setups.map((setup) => setup.name),

      setupItems: venue.setups,

      coverImage: {
        src: cover?.src ?? "/salles.jpeg",

        alt: cover?.alt ?? {
          fr: `Salle ${venue.name}`,
          en: `${venue.name} venue`,
        },
      },

      images: sortedImages.map((image) => ({
        src: image.imagePath,
        alt: image.alt,
      })),

      allImages,

      uses: venue.uses.map((use) => {
        const sortedUseImages = [...use.images].sort(
          (a, b) =>
            Number(b.isCover) - Number(a.isCover) || a.sortOrder - b.sortOrder,
        );

        return {
          id: use.id,

          useTypeCode: use.useTypeCode,

          useTypeName: use.useTypeName,

          title: use.title,

          description: use.description,

          images: sortedUseImages.map((image) => ({
            src: image.imagePath,
            alt: image.alt,
          })),
        };
      }),
    };
  });
}

/* =========================================================
   Chargement public des salles
   ========================================================= */

export async function getVenues(): Promise<VenuesResult> {
  try {
    const supabase = (await getSupabaseServerClient()).schema("site");

    const [
      venuesResult,
      imagesResult,
      setupResult,
      usesResult,
      useImagesResult,
    ] = await Promise.all([
      supabase
        .from("venues")
        .select(
          `
            id,
            code,
            name,
            location_fr,
            location_en,
            short_description_fr,
            short_description_en,
            description_fr,
            description_en,
            capacity,
            surface_m2,
            sort_order,
            is_active,
            category_id,
            created_at,
            updated_at,
            category:category_id(
              id,
              code,
              name_fr,
              name_en,
              is_active
            )
          `,
        )
        .eq("is_active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("venue_images")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("venue_setup_links")
        .select(
          "id,venue_id,capacity,sort_order,setup:setup_type_id(id,code,name_fr,name_en,icon_key,sort_order,is_active)",
        )
        .eq("is_active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("venue_use_presentations")
        .select(
          "id,venue_id,use_type_id,title_fr,title_en,description_fr,description_en,sort_order,is_active,use_type:use_type_id(id,code,name_fr,name_en,sort_order,is_active)",
        )
        .eq("is_active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("venue_use_images")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", {
          ascending: true,
        })
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (
      venuesResult.error ||
      imagesResult.error ||
      setupResult.error ||
      usesResult.error ||
      useImagesResult.error
    ) {
      console.error(
        "[venues] Unable to load data:",
        venuesResult.error?.message ??
          imagesResult.error?.message ??
          setupResult.error?.message ??
          usesResult.error?.message ??
          useImagesResult.error?.message,
      );

      return {
        ok: false,
        venues: [],
        cards: [],
        error: "venues_unavailable",
      };
    }

    /* =====================================================
       Images générales par salle
       ===================================================== */

    const imagesByVenue = new Map<string, ImageRow[]>();

    for (const image of (imagesResult.data ?? []) as unknown as ImageRow[]) {
      const current = imagesByVenue.get(image.venue_id) ?? [];

      current.push(image);

      imagesByVenue.set(image.venue_id, current);
    }

    /* =====================================================
       Configurations par salle
       ===================================================== */

    const setupsByVenue = new Map<string, VenueSetup[]>();

    for (const link of (setupResult.data ?? []) as unknown as SetupLinkRow[]) {
      if (!link.setup?.is_active) {
        continue;
      }

      const current = setupsByVenue.get(link.venue_id) ?? [];

      current.push({
        id: link.setup.id,

        code: link.setup.code,

        name: {
          fr: link.setup.name_fr,

          en: link.setup.name_en,
        },

        iconKey: link.setup.icon_key,

        capacity: link.capacity,

        sortOrder: link.sort_order || link.setup.sort_order,

        isActive: link.setup.is_active,
      });

      setupsByVenue.set(link.venue_id, current);
    }

    /* =====================================================
       Images des anciens usages
       ===================================================== */

    const useImagesByPresentation = new Map<string, UseImageRow[]>();

    for (const image of (useImagesResult.data ??
      []) as unknown as UseImageRow[]) {
      const current =
        useImagesByPresentation.get(image.venue_use_presentation_id) ?? [];

      current.push(image);

      useImagesByPresentation.set(image.venue_use_presentation_id, current);
    }

    /* =====================================================
       Anciennes présentations d'usage
       ===================================================== */

    const usesByVenue = new Map<string, VenueUsePresentation[]>();

    for (const use of (usesResult.data ??
      []) as unknown as UsePresentationRow[]) {
      if (!use.use_type?.is_active) {
        continue;
      }

      const images = (useImagesByPresentation.get(use.id) ?? []).sort(
        (a, b) =>
          Number(b.is_cover) - Number(a.is_cover) ||
          a.sort_order - b.sort_order,
      );

      const mappedImages = images.map((image) => ({
        id: image.id,

        imagePath: image.image_path,

        alt: {
          fr: image.alt_fr ?? use.title_fr,

          en: image.alt_en ?? use.title_en,
        },

        sortOrder: image.sort_order,

        isCover: image.is_cover,

        isActive: image.is_active,
      }));

      const current = usesByVenue.get(use.venue_id) ?? [];

      current.push({
        id: use.id,

        useTypeId: use.use_type_id,

        useTypeCode: use.use_type.code,

        useTypeName: {
          fr: use.use_type.name_fr,

          en: use.use_type.name_en,
        },

        title: {
          fr: use.title_fr,

          en: use.title_en,
        },

        description: {
          fr: use.description_fr,

          en: use.description_en,
        },

        images: mappedImages,

        coverImage: mappedImages[0] ?? null,

        sortOrder: use.sort_order || use.use_type.sort_order,

        isActive: use.is_active,
      });

      usesByVenue.set(use.venue_id, current);
    }

    /* =====================================================
       Mapping final
       ===================================================== */

    const venues = ((venuesResult.data ?? []) as unknown as VenueRow[]).map(
      (row) => {
        const images = (imagesByVenue.get(row.id) ?? []).sort(
          (a, b) =>
            Number(b.is_cover) - Number(a.is_cover) ||
            a.sort_order - b.sort_order,
        );

        const setups = (setupsByVenue.get(row.id) ?? []).sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );

        const uses = (usesByVenue.get(row.id) ?? []).sort(
          (a, b) => a.sortOrder - b.sortOrder,
        );

        const category =
          row.category && row.category.is_active
            ? {
                id: row.category.id,

                code: row.category.code,

                name: {
                  fr: row.category.name_fr,

                  en: row.category.name_en,
                },
              }
            : null;

        return {
          id: row.id,

          code: row.code,

          name: row.name,

          location: {
            fr: row.location_fr,

            en: row.location_en,
          },

          shortDescription: {
            fr: row.short_description_fr,

            en: row.short_description_en,
          },

          description: {
            fr: row.description_fr,

            en: row.description_en,
          },

          capacity: row.capacity,

          surfaceM2: row.surface_m2,

          sortOrder: row.sort_order,

          isActive: row.is_active,

          categoryId: row.category_id ?? "",

          category,

          images: images.map((image) => ({
            id: image.id,

            imagePath: image.image_path,

            alt: {
              fr: image.alt_fr,

              en: image.alt_en,
            },

            sortOrder: image.sort_order,

            isCover: image.is_cover,

            isActive: image.is_active,
          })),

          setups,

          uses,

          createdAt: row.created_at,

          updatedAt: row.updated_at,
        } satisfies Venue;
      },
    );

    return {
      ok: true,
      venues,
      cards: toCards(venues),
    };
  } catch (error) {
    console.error(
      "[venues] Loading failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return {
      ok: false,
      venues: [],
      cards: [],
      error: "supabase_unavailable",
    };
  }
}
