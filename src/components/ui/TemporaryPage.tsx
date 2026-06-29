import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/Container";
import type { Locale, RouteKey } from "@/lib/i18n/routing";

type TemporaryPageProps = {
  locale: Locale;
  routeKey: Exclude<RouteKey, "home"> | "article" | "product";
  slug?: string;
};

export async function TemporaryPage({
  locale,
  routeKey,
  slug,
}: TemporaryPageProps) {
  const common = await getTranslations({ locale, namespace: "common" });
  const t = await getTranslations({ locale, namespace: `pages.${routeKey}` });

  return (
    <Container className="py-16 sm:py-24">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted">
        {common("temporary_page")}
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-normal sm:text-5xl">
        {t("title")}
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted">{t("description")}</p>
      {slug ? (
        <p className="mt-6 inline-flex rounded-md border border-border px-3 py-2 font-mono text-sm text-muted">
          {slug}
        </p>
      ) : null}
    </Container>
  );
}
