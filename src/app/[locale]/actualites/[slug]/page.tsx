import { TemporaryPage } from "@/components/ui/TemporaryPage";
import type { Locale } from "@/lib/i18n/routing";
import type { Metadata } from "next";

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

export default async function ArticlePage({ params }: PageProps) {
  const { locale, slug } = await params;
  return <TemporaryPage locale={locale} routeKey="article" slug={slug} />;
}
