import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { EventServiceDetailPage } from "@/components/events/EventServiceDetailPage";
import {
  getActiveEventServiceCodes,
  getEventServiceByCode,
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

  const result = await getEventServiceByCode(slug);

  if (!result.ok || !result.service.isActive) {
    notFound();
  }

  const t = await getTranslations({
    locale,
    namespace: "eventsPage.detail",
  });

  return (
    <EventServiceDetailPage
      service={result.service}
      locale={locale as Locale}
      labels={{
        back: t("back"),
        breadcrumbRoot: t("breadcrumb_root"),
        gallery: t("gallery"),
        requestQuote: t("request_quote"),
        description: t("description"),
        noImages: t("no_images"),
      }}
    />
  );
}
