import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";
import { Container } from "@/components/ui/Container";

type FooterProps = {
  locale: Locale;
};

export async function Footer({ locale }: FooterProps) {
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <footer className="mt-20 border-t border-border">
      <Container className="flex flex-col gap-2 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{siteConfig.name}</p>
        <p>{t("footer_location")}</p>
      </Container>
    </footer>
  );
}
