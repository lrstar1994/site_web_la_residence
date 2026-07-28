import { TemporaryPage } from "@/components/ui/TemporaryPage";
import { SHOP_ENABLED } from "@/config/features";
import type { Locale } from "@/lib/i18n/routing";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

type PageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { locale, slug } = await params;

  if (!SHOP_ENABLED) {
    notFound();
  }

  return <TemporaryPage locale={locale} routeKey="product" slug={slug} />;
}
