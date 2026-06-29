import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/data/site";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { Container } from "@/components/ui/Container";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Navbar } from "@/components/layout/Navbar";

type HeaderProps = {
  locale: Locale;
};

export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <header className="border-b border-border bg-background/95">
      <Container className="flex min-h-16 items-center justify-between gap-4 py-4">
        <Link href="/" className="text-base font-semibold sm:text-lg">
          {siteConfig.name}
        </Link>
        <Navbar locale={locale} />
        <div className="flex items-center gap-3">
          <LanguageSwitcher locale={locale} />
          <Link
            href="/"
            className="hidden rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground sm:inline-flex"
          >
            {t("book_now")}
          </Link>
        </div>
      </Container>
    </header>
  );
}
