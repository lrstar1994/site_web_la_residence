import type { Metadata } from "next";
import { AccommodationGrid } from "@/components/accommodation/AccommodationGrid";
import { AccommodationHero } from "@/components/accommodation/AccommodationHero";
import { AccommodationIntro } from "@/components/accommodation/AccommodationIntro";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAccommodations } from "@/lib/accommodations/get-accommodations";
import type { Locale } from "@/lib/i18n/routing";
import { getAccommodationMetadata, getBaseUrl } from "@/lib/seo/metadata";
import { buildAccommodationPageSchema } from "@/lib/seo/schema";

type PageProps = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getAccommodationMetadata(locale);
}

export default async function HebergementPage({ params }: PageProps) {
  const { locale } = await params;
  const baseUrl = getBaseUrl();
  const accommodations = await getAccommodations();
  const gridState = accommodations.ok
    ? accommodations.cards.length > 0
      ? "ready"
      : "empty"
    : "error";

  return (
    <div className="page-accommodation">
      <AccommodationHero locale={locale} />
      <AccommodationIntro locale={locale} />
      <AccommodationGrid
        locale={locale}
        accommodations={accommodations.cards}
        state={gridState}
      />
      <JsonLd
        data={buildAccommodationPageSchema(
          baseUrl,
          locale,
          accommodations.ok ? accommodations.accommodations : [],
        )}
      />
    </div>
  );
}
