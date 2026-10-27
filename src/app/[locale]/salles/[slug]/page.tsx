import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { VenueDetailPage } from "@/components/venues/VenueDetailPage";
import { siteConfig } from "@/data/site";
import { routing, type Locale } from "@/lib/i18n/routing";
import { getVenueDetailMetadata } from "@/lib/seo/metadata";
import {
  getActiveVenueCodes,
  getPhysicalVenueByCode,
  getVenues,
} from "@/lib/venues/get-venues";
import {
  getCanonicalVenueCode,
} from "@/lib/venues/venue-routes";
import type { Venue } from "@/types/venue";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 300;

function buildWhatsAppUrl(baseUrl: string, message: string) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}

function getCanonicalVenueList(venues: Venue[]) {
  const canonicalVenues = new Map<string, Venue>();

  for (const venue of venues) {
    const canonicalCode = getCanonicalVenueCode(venue.code);
    const current = canonicalVenues.get(canonicalCode);

    if (!current || venue.code === canonicalCode) {
      canonicalVenues.set(canonicalCode, venue);
    }
  }

  return Array.from(canonicalVenues.values());
}

export async function generateStaticParams() {
  const venues = await getActiveVenueCodes();

  if (!venues.ok) {
    return [];
  }

  return routing.locales.flatMap((locale) =>
    venues.venues.map((venue) => ({
      locale,
      slug: venue.code,
    })),
  );
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const result = await getPhysicalVenueByCode(getCanonicalVenueCode(slug));

  if (!result.ok) {
    return {};
  }

  return getVenueDetailMetadata(locale, result.venue);
}

export default async function VenueDetailRoute({ params }: PageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const canonicalCode = getCanonicalVenueCode(slug);

  const result = await getPhysicalVenueByCode(canonicalCode);

  if (!result.ok || !result.venue.isActive) {
    notFound();
  }

  const venues = await getVenues();
  const relatedVenues = venues.ok
    ? getCanonicalVenueList(venues.venues)
        .filter((venue) => venue.code !== result.venue.code)
        .slice(0, 3)
    : [];

  const t = await getTranslations({
    locale,
    namespace: "venuesPage.detail",
  });

  const whatsappBaseUrl = `https://wa.me/${siteConfig.contact.phoneHref.replace(/\D/g, "")}`;
  const whatsappUrl = buildWhatsAppUrl(
    whatsappBaseUrl,
    t("whatsapp_message", {
      name: result.venue.name,
    }),
  );
  const quoteUrl =
    locale === "en" ? "/en/events#event-quote-title" : "/fr/evenements#event-quote-title";

  return (
    <VenueDetailPage
      venue={result.venue}
      relatedVenues={relatedVenues}
      locale={locale}
      quoteUrl={quoteUrl}
      whatsappUrl={whatsappUrl}
      labels={{
        back: t("back"),
        gallery: t("gallery"),
        noImages: t("no_images"),
        breadcrumbRoot: t("breadcrumb_root"),
        viewPhotos: t("view_photos"),
        viewPhotosCount: t("view_photos_count", {
          count: result.venue.images.length,
        }),
        closeGallery: t("close_gallery"),
        previousImage: t("previous_image"),
        nextImage: t("next_image"),
        mainInfo: t("main_info"),
        capacity: t("capacity"),
        capacityValue: t("capacity_value", {
          count: result.venue.capacity,
        }),
        location: t("location"),
        surface: t("surface"),
        setupsEyebrow: t("setups_eyebrow"),
        setupsTitle: t("setups_title"),
        ctaText: t("cta_text"),
        requestQuote: t("request_quote"),
        whatsapp: t("whatsapp", {
          number: siteConfig.contact.phoneDisplay,
        }),
        heroEyebrow: t("hero_eyebrow"),
        usageSeminar: t("usage_seminar"),
        usageReception: t("usage_reception"),
        usages: t("usages"),
        usageCount: t("usage_count", {
          count: result.venue.physicalUses.length,
        }),
        configurationCount: t("configuration_count", {
          count: result.venue.setups.length,
        }),
        introEyebrow: t("intro_eyebrow"),
        introTitle: t("intro_title"),
        usageSectionEyebrow: t("usage_section_eyebrow"),
        usageSectionTitle: t("usage_section_title"),
        eventCtaEyebrow: t("event_cta_eyebrow"),
        eventCtaTitle: t("event_cta_title"),
        eventCtaText: t("event_cta_text"),
        related: t("related"),
        relatedTitle: t("related_title"),
        discover: t("discover"),
      }}
    />
  );
}
