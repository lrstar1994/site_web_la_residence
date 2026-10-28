import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AccommodationDetailPage } from "@/components/accommodation/AccommodationDetailPage";
import { siteConfig } from "@/data/site";
import {
  getAccommodationByCode,
  getAccommodations,
  getActiveAccommodationCodes,
} from "@/lib/accommodations/get-accommodations";
import { routing, type Locale } from "@/lib/i18n/routing";
import { getAccommodationDetailMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 300;

function buildWhatsAppUrl(baseUrl: string, message: string) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}

export async function generateStaticParams() {
  const accommodations = await getActiveAccommodationCodes();

  if (!accommodations.ok) {
    return [];
  }

  return routing.locales.flatMap((locale) =>
    accommodations.accommodations.map((accommodation) => ({
      locale,
      slug: accommodation.code,
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

  const result = await getAccommodationByCode(slug);

  if (!result.ok) {
    return {};
  }

  return getAccommodationDetailMetadata(locale, result.accommodation);
}

export default async function AccommodationDetailRoute({ params }: PageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const result = await getAccommodationByCode(slug);

  if (!result.ok || !result.accommodation.isActive) {
    notFound();
  }

  const accommodations = await getAccommodations();
  const relatedAccommodations = accommodations.ok
    ? accommodations.accommodations
        .filter((accommodation) => accommodation.code !== result.accommodation.code)
        .slice(0, 3)
    : [];

  const t = await getTranslations({
    locale,
    namespace: "accommodationPage.detail",
  });
  const whatsappBaseUrl = `https://wa.me/${siteConfig.contact.phoneHref.replace(/\D/g, "")}`;
  const whatsappUrl = buildWhatsAppUrl(
    whatsappBaseUrl,
    t("whatsapp_message", {
      name: result.accommodation.name[locale],
    }),
  );

  return (
    <AccommodationDetailPage
      accommodation={result.accommodation}
      relatedAccommodations={relatedAccommodations}
      locale={locale}
      onlineBookingUrl={siteConfig.reservationUrl[locale]}
      whatsappUrl={whatsappUrl}
      labels={{
        back: t("back"),
        gallery: t("gallery"),
        noImages: t("no_images"),
        breadcrumbRoot: t("breadcrumb_root"),
        viewPhotos: t("view_photos"),
        viewPhotosCount: t("view_photos_count", {
          count: result.accommodation.images.length,
        }),
        closeGallery: t("close_gallery"),
        previousImage: t("previous_image"),
        nextImage: t("next_image"),
        mainInfo: t("main_info"),
        galleryTitle: t("gallery_title"),
        surface: t("surface"),
        capacity: t("capacity"),
        guests: t("guests"),
        priceFrom: t("price_from"),
        priceUnit: t("price_unit"),
        features: t("features"),
        featuresTitle: t("features_title"),
        booking: t("booking"),
        bookingRateUnit: t("booking_rate_unit"),
        bookingText: t("booking_text"),
        bookOnline: t("book_online"),
        whatsapp: t("whatsapp", {
          number: siteConfig.contact.phoneDisplay,
        }),
        related: t("related"),
        relatedTitle: t("related_title"),
        relatedPrice: t("related_price"),
        discover: t("discover"),
      }}
    />
  );
}
