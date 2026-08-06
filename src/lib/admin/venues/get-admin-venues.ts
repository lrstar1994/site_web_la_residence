import "server-only";

import { ensureAdminReadContext } from "@/lib/admin/admin-read-context";
import type {
  AdminVenue,
  AdminVenueDetail,
  AdminVenueSetup,
  AdminVenueUsePresentation,
  AdminVenueUsePresentationSummary,
  AdminVenueUseType,
} from "@/lib/admin/venues/admin-venue-types";
import { isValidUuid } from "@/lib/admin/validate-uuid";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type VenueRow = {
  id: string;
  code: string;
  name: string;
  location_fr: string;
  location_en: string;
  short_description_fr: string;
  short_description_en: string;
  capacity: number;
  surface_m2: number | null;
  sort_order: number;
  is_active: boolean;
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
type LinkRow = { venue_id: string; setup_type_id: string; is_active: boolean };
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
  updated_at: string;
  use_type: {
    id: string;
    code: string;
    name_fr: string;
    name_en: string;
    sort_order: number;
    is_active: boolean;
  } | null;
  venue?: {
    id: string;
    code: string;
    name: string;
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
type SetupRow = {
  id: string;
  code: string;
  name_fr: string;
  name_en: string;
  icon_key: string | null;
  sort_order: number;
  is_active: boolean;
  updated_at: string;
};

function mapVenue(row: VenueRow, images: ImageRow[], setupCount: number, useCount = 0): AdminVenue {
  const cover = [...images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)[0];
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    locationFr: row.location_fr,
    locationEn: row.location_en,
    shortDescriptionFr: row.short_description_fr,
    shortDescriptionEn: row.short_description_en,
    capacity: row.capacity,
    surfaceM2: row.surface_m2,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    updatedAt: row.updated_at,
    coverImage: cover?.image_path ?? null,
    imageCount: images.length,
    setupCount,
    useCount,
  };
}

function mapUseSummary(row: UsePresentationRow, images: UseImageRow[]): AdminVenueUsePresentationSummary {
  const cover = [...images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order)[0];
  return {
    id: row.id,
    venueId: row.venue_id,
    useTypeId: row.use_type_id,
    useTypeCode: row.use_type?.code ?? "",
    useTypeNameFr: row.use_type?.name_fr ?? "Usage",
    useTypeNameEn: row.use_type?.name_en ?? "Use",
    titleFr: row.title_fr,
    titleEn: row.title_en,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    imageCount: images.length,
    coverImage: cover?.image_path ?? null,
    updatedAt: row.updated_at,
  };
}

export async function getAdminVenues() {
  const supabase = (await getSupabaseServerClient()).schema("site");
  const [venues, images, links, uses] = await Promise.all([
    supabase
      .from("venues")
      .select(
        "id,code,name,location_fr,location_en,short_description_fr,short_description_en,capacity,surface_m2,sort_order,is_active,updated_at",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("venue_images").select("*").eq("is_active", true),
    supabase.from("venue_setup_links").select("venue_id,setup_type_id,is_active").eq("is_active", true),
    supabase.from("venue_use_presentations").select("venue_id").eq("is_active", true),
  ]);

  if (venues.error) {
    console.error("[admin-venues] Load failed:", venues.error.message);
    return { ok: false as const, venues: [] };
  }

  const imagesByVenue = new Map<string, ImageRow[]>();
  for (const image of (images.data ?? []) as unknown as ImageRow[]) {
    const current = imagesByVenue.get(image.venue_id) ?? [];
    current.push(image);
    imagesByVenue.set(image.venue_id, current);
  }
  const setupCounts = new Map<string, number>();
  for (const link of (links.data ?? []) as unknown as LinkRow[]) {
    setupCounts.set(link.venue_id, (setupCounts.get(link.venue_id) ?? 0) + 1);
  }
  const useCounts = new Map<string, number>();
  for (const use of (uses.data ?? []) as unknown as Array<{ venue_id: string }>) {
    useCounts.set(use.venue_id, (useCounts.get(use.venue_id) ?? 0) + 1);
  }

  return {
    ok: true as const,
    venues: ((venues.data ?? []) as unknown as VenueRow[]).map((row) =>
      mapVenue(row, imagesByVenue.get(row.id) ?? [], setupCounts.get(row.id) ?? 0, useCounts.get(row.id) ?? 0),
    ),
  };
}

export async function getAdminVenue(id: string) {
  if (!isValidUuid(id)) {
    return { ok: false as const, venue: null, error: "not_found" };
  }

  const supabase = (await getSupabaseServerClient()).schema("site");
  await ensureAdminReadContext();
  const [venue, images, links, uses, useImages] = await Promise.all([
    supabase
      .from("venues")
      .select(
        "id,code,name,location_fr,location_en,short_description_fr,short_description_en,capacity,surface_m2,sort_order,is_active,updated_at",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("venue_images").select("*").eq("venue_id", id).order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("venue_setup_links").select("setup_type_id,is_active").eq("venue_id", id).eq("is_active", true),
    supabase
      .from("venue_use_presentations")
      .select("id,venue_id,use_type_id,title_fr,title_en,description_fr,description_en,sort_order,is_active,updated_at,use_type:use_type_id(id,code,name_fr,name_en,sort_order,is_active)")
      .eq("venue_id", id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("venue_use_images").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
  ]);

  if (venue.error || images.error || links.error || uses.error || useImages.error) {
    console.error("[admin-venues] Detail load failed:", venue.error?.message ?? images.error?.message ?? links.error?.message ?? uses.error?.message ?? useImages.error?.message);
    return { ok: false as const, venue: null, error: "unavailable" };
  }
  if (!venue.data) return { ok: false as const, venue: null, error: "not_found" };

  const row = venue.data as unknown as VenueRow;
  const imagesByUse = new Map<string, UseImageRow[]>();
  for (const image of (useImages.data ?? []) as unknown as UseImageRow[]) {
    const current = imagesByUse.get(image.venue_use_presentation_id) ?? [];
    current.push(image);
    imagesByUse.set(image.venue_use_presentation_id, current);
  }
  const usePresentations = ((uses.data ?? []) as unknown as UsePresentationRow[]).map((use) =>
    mapUseSummary(use, imagesByUse.get(use.id) ?? []),
  );
  const detail: AdminVenueDetail = {
    ...mapVenue(row, (images.data ?? []) as unknown as ImageRow[], ((links.data ?? []) as unknown as LinkRow[]).length, usePresentations.length),
    surfaceM2: row.surface_m2 ? String(row.surface_m2) : "",
    sortOrder: String(row.sort_order),
    images: ((images.data ?? []) as unknown as ImageRow[]).map((image) => ({
      id: image.id,
      imagePath: image.image_path,
      altFr: image.alt_fr,
      altEn: image.alt_en,
      sortOrder: image.sort_order,
      isCover: image.is_cover,
      isActive: image.is_active,
    })),
    selectedSetupIds: ((links.data ?? []) as unknown as Array<{ setup_type_id: string }>).map((link) => link.setup_type_id),
    usePresentations,
  };

  return { ok: true as const, venue: detail };
}

export async function getAdminVenueUseTypes() {
  const supabase = (await getSupabaseServerClient()).schema("site");
  const [types, uses] = await Promise.all([
    supabase.from("venue_use_types").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("venue_use_presentations").select("use_type_id"),
  ]);

  if (types.error) {
    console.error("[admin-venues] Use types load failed:", types.error.message);
    return { ok: false as const, useTypes: [] };
  }

  const usage = new Map<string, number>();
  for (const use of (uses.data ?? []) as unknown as Array<{ use_type_id: string }>) {
    usage.set(use.use_type_id, (usage.get(use.use_type_id) ?? 0) + 1);
  }

  return {
    ok: true as const,
    useTypes: ((types.data ?? []) as unknown as Array<{
      id: string;
      code: string;
      name_fr: string;
      name_en: string;
      sort_order: number;
      is_active: boolean;
      updated_at: string;
    }>).map(
      (type): AdminVenueUseType => ({
        id: type.id,
        code: type.code,
        nameFr: type.name_fr,
        nameEn: type.name_en,
        sortOrder: type.sort_order,
        isActive: type.is_active,
        updatedAt: type.updated_at,
        usageCount: usage.get(type.id) ?? 0,
      }),
    ),
  };
}

export async function getAdminVenueUseType(id: string) {
  if (!isValidUuid(id)) return { ok: false as const, useType: null, error: "not_found" };

  const supabase = (await getSupabaseServerClient()).schema("site");
  await ensureAdminReadContext();
  const [typeResult, uses] = await Promise.all([
    supabase.from("venue_use_types").select("*").eq("id", id).maybeSingle(),
    supabase.from("venue_use_presentations").select("use_type_id").eq("use_type_id", id),
  ]);

  if (typeResult.error || uses.error) {
    console.error("[admin-venues] Use type detail load failed:", typeResult.error?.message ?? uses.error?.message);
    return { ok: false as const, useType: null, error: "unavailable" };
  }

  if (!typeResult.data) return { ok: false as const, useType: null, error: "not_found" };

  const type = typeResult.data as unknown as {
    id: string;
    code: string;
    name_fr: string;
    name_en: string;
    sort_order: number;
    is_active: boolean;
    updated_at: string;
  };
  return {
    ok: true as const,
    useType: {
      id: type.id,
      code: type.code,
      nameFr: type.name_fr,
      nameEn: type.name_en,
      sortOrder: type.sort_order,
      isActive: type.is_active,
      updatedAt: type.updated_at,
      usageCount: ((uses.data ?? []) as unknown[]).length,
    } satisfies AdminVenueUseType,
  };
}

export async function getAdminVenueUsePresentation(venueId: string, presentationId: string) {
  if (!isValidUuid(venueId) || !isValidUuid(presentationId)) {
    return { ok: false as const, presentation: null, error: "not_found" };
  }

  const supabase = (await getSupabaseServerClient()).schema("site");
  await ensureAdminReadContext();
  const [presentation, images] = await Promise.all([
    supabase
      .from("venue_use_presentations")
      .select("id,venue_id,use_type_id,title_fr,title_en,description_fr,description_en,sort_order,is_active,updated_at,use_type:use_type_id(id,code,name_fr,name_en,sort_order,is_active),venue:venue_id(id,code,name)")
      .eq("id", presentationId)
      .eq("venue_id", venueId)
      .maybeSingle(),
    supabase
      .from("venue_use_images")
      .select("*")
      .eq("venue_use_presentation_id", presentationId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (presentation.error || images.error) {
    console.error("[admin-venues] Use presentation load failed:", presentation.error?.message ?? images.error?.message);
    return { ok: false as const, presentation: null, error: "unavailable" };
  }

  if (!presentation.data) return { ok: false as const, presentation: null, error: "not_found" };

  const row = presentation.data as unknown as UsePresentationRow;
  const imageRows = (images.data ?? []) as unknown as UseImageRow[];
  const summary = mapUseSummary(row, imageRows);
  return {
    ok: true as const,
    presentation: {
      ...summary,
      venueCode: row.venue?.code ?? "",
      venueName: row.venue?.name ?? "",
      descriptionFr: row.description_fr,
      descriptionEn: row.description_en,
      images: imageRows.map((image) => ({
        id: image.id,
        imagePath: image.image_path,
        altFr: image.alt_fr ?? "",
        altEn: image.alt_en ?? "",
        sortOrder: image.sort_order,
        isCover: image.is_cover,
        isActive: image.is_active,
      })),
    } satisfies AdminVenueUsePresentation,
  };
}

export async function getAdminVenueSetups() {
  const supabase = (await getSupabaseServerClient()).schema("site");
  const [setups, links] = await Promise.all([
    supabase.from("venue_setup_types").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("venue_setup_links").select("setup_type_id").eq("is_active", true),
  ]);

  if (setups.error) {
    console.error("[admin-venues] Setups load failed:", setups.error.message);
    return { ok: false as const, setups: [] };
  }

  const usage = new Map<string, number>();
  for (const link of (links.data ?? []) as unknown as Array<{ setup_type_id: string }>) {
    usage.set(link.setup_type_id, (usage.get(link.setup_type_id) ?? 0) + 1);
  }

  return {
    ok: true as const,
    setups: ((setups.data ?? []) as unknown as SetupRow[]).map(
      (setup): AdminVenueSetup => ({
        id: setup.id,
        code: setup.code,
        nameFr: setup.name_fr,
        nameEn: setup.name_en,
        iconKey: setup.icon_key ?? "",
        sortOrder: setup.sort_order,
        isActive: setup.is_active,
        updatedAt: setup.updated_at,
        usageCount: usage.get(setup.id) ?? 0,
      }),
    ),
  };
}

export async function getAdminVenueSetup(id: string) {
  if (!isValidUuid(id)) {
    return { ok: false as const, setup: null, error: "not_found" };
  }

  const supabase = (await getSupabaseServerClient()).schema("site");
  await ensureAdminReadContext();
  const [setupResult, links] = await Promise.all([
    supabase.from("venue_setup_types").select("*").eq("id", id).maybeSingle(),
    supabase.from("venue_setup_links").select("setup_type_id").eq("setup_type_id", id).eq("is_active", true),
  ]);

  if (setupResult.error || links.error) {
    console.error(
      "[admin-venues] Setup detail load failed:",
      setupResult.error?.message ?? links.error?.message,
    );
    return { ok: false as const, setup: null, error: "unavailable" };
  }

  if (!setupResult.data) {
    return { ok: false as const, setup: null, error: "not_found" };
  }

  const setup = setupResult.data as unknown as SetupRow;
  return {
    ok: true as const,
    setup: {
      id: setup.id,
      code: setup.code,
      nameFr: setup.name_fr,
      nameEn: setup.name_en,
      iconKey: setup.icon_key ?? "",
      sortOrder: setup.sort_order,
      isActive: setup.is_active,
      updatedAt: setup.updated_at,
      usageCount: ((links.data ?? []) as unknown as Array<{ setup_type_id: string }>).length,
    },
  };
}
