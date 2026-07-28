import type { Metadata } from "next";
import { EventQuoteForm } from "@/components/events/EventQuoteForm";
import { EventsHero } from "@/components/events/EventsHero";
import { EventsShowcase } from "@/components/events/EventsShowcase";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPublicEventQuoteFields } from "@/lib/events/event-quote-fields";
import { getEventServices } from "@/lib/events/get-event-services";
import type { Locale } from "@/lib/i18n/routing";
import { getBaseUrl, getEventsMetadata } from "@/lib/seo/metadata";
import { buildEventsPageSchema } from "@/lib/seo/schema";

type PageProps = { params: Promise<{ locale: Locale }> };

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return getEventsMetadata(locale);
}

export default async function EvenementsPage({ params }: PageProps) {
  const { locale } = await params;
  const baseUrl = getBaseUrl();
  const [eventServices, quoteFields] = await Promise.all([
    getEventServices(),
    getPublicEventQuoteFields(),
  ]);
  const showcaseState = eventServices.ok
    ? eventServices.services.length > 0
      ? "ready"
      : "empty"
    : "error";

  return (
    <main className="page-evenement">
      <EventsHero locale={locale} />
      <EventsShowcase
        locale={locale}
        services={eventServices.services}
        state={showcaseState}
      />
      {eventServices.ok && eventServices.services.length > 0 ? (
        <EventQuoteForm locale={locale} services={eventServices.services} fields={quoteFields} />
      ) : null}
      <JsonLd
        data={buildEventsPageSchema(
          baseUrl,
          locale,
          eventServices.ok ? eventServices.services : [],
        )}
      />
    </main>
  );
}
