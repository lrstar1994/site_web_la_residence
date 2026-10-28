import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EventServiceDetailPage } from "@/components/events/EventServiceDetailPage";
import {
  getActiveEventServiceCodes,
  getEventServiceByCode,
  getEventServices,
} from "@/lib/events/get-event-services";
import { routing, type Locale } from "@/lib/i18n/routing";
import { getEventServiceDetailMetadata } from "@/lib/seo/metadata";

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const services = await getActiveEventServiceCodes();

  if (!services.ok) {
    return [];
  }

  return routing.locales.flatMap((locale) =>
    services.services.map((service) => ({
      locale,
      slug: service.code,
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

  const result = await getEventServiceByCode(slug);

  if (!result.ok) {
    return {};
  }

  return getEventServiceDetailMetadata(locale, result.service);
}

export default async function EventServiceDetailRoute({ params }: PageProps) {
  const { locale, slug } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const servicesResult = await getEventServices();
  const service = servicesResult.ok
    ? servicesResult.services.find((item) => item.code === slug)
    : null;

  if (!service || !service.isActive) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: "eventsPage.detail",
  });
  const relatedServices = servicesResult.ok
    ? servicesResult.services
        .filter((item) => item.code !== service.code)
        .slice(0, 2)
    : [];

  return (
    <EventServiceDetailPage
      service={service}
      relatedServices={relatedServices}
      locale={locale as Locale}
      labels={{
        breadcrumbRoot: t("breadcrumb_root"),
        requestQuote: t("request_quote"),
        description: t("description"),
        noImages: t("no_images"),
        galleryEyebrow: t("gallery_eyebrow"),
        galleryTitle: t("gallery_title"),
        viewAllPhotos: t("view_all_photos"),
        closeGallery: t("close_gallery"),
        previousImage: t("previous_image"),
        nextImage: t("next_image"),
        otherEyebrow: t("other_eyebrow"),
        otherTitle: t("other_title"),
        discoverService: t("discover_service"),
      }}
    />
  );
}
