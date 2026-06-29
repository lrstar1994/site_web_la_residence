import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { siteConfig } from "@/data/site";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { getHomeMetadata } from "@/lib/seo/metadata";

type HomePageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return getHomeMetadata(locale);
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const common = await getTranslations({ locale, namespace: "common" });

  return (
    <Container className="py-16 sm:py-24">
      <section className="mx-auto max-w-4xl text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-muted">
          {t("eyebrow")}
        </p>
        <h1 className="text-4xl font-semibold tracking-normal sm:text-6xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted sm:text-xl">
          {t("subtitle")}
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/">{common("book_now")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/hebergement">{common("discover_rooms")}</Link>
          </Button>
        </div>
      </section>

      <section className="mt-16">
        <SectionTitle title={t("navigation_title")} />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.primaryRoutes.map((route) => (
            <Link
              key={route.key}
              href={route.internalPath}
              className="rounded-lg border border-border bg-white/70 p-5 font-medium transition hover:border-accent hover:text-accent"
            >
              {common(`routes.${route.key}`)}
            </Link>
          ))}
        </div>
      </section>
    </Container>
  );
}
