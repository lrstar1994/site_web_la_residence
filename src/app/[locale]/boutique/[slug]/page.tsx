import { TemporaryPage } from "@/components/ui/TemporaryPage";
import type { Locale } from "@/lib/i18n/routing";

type PageProps = {
  params: Promise<{ locale: Locale; slug: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { locale, slug } = await params;
  return <TemporaryPage locale={locale} routeKey="product" slug={slug} />;
}
