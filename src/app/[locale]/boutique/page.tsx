import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemporaryPage } from "@/components/ui/TemporaryPage";
import { SHOP_ENABLED } from "@/config/features";
import type { Locale } from "@/lib/i18n/routing";
import { getRouteMetadata } from "@/lib/seo/metadata";

type PageProps = { params: Promise<{ locale: Locale }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!SHOP_ENABLED) {
    return {
      robots: {
        index: false,
        follow: false,
        noarchive: true,
      },
    };
  }

  return {
    ...getRouteMetadata(locale, "boutique"),
    robots: {
      index: false,
      follow: false,
      noarchive: true,
    },
  };
}

export default async function BoutiquePage({ params }: PageProps) {
  const { locale } = await params;

  if (!SHOP_ENABLED) {
    notFound();
  }

  return <TemporaryPage locale={locale} routeKey="boutique" />;
}
