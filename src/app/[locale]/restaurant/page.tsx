import type { Metadata } from "next";
import { TemporaryPage } from "@/components/ui/TemporaryPage";
import type { Locale } from "@/lib/i18n/routing";
import { getRouteMetadata } from "@/lib/seo/metadata";

type PageProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getRouteMetadata(locale, "restaurant");
}

export default async function RestaurantPage({ params }: PageProps) {
  const { locale } = await params;
  return <TemporaryPage locale={locale} routeKey="restaurant" />;
}
