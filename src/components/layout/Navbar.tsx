import { getTranslations } from "next-intl/server";
import { siteConfig } from "@/data/site";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

type NavbarProps = {
  locale: Locale;
};

export async function Navbar({ locale }: NavbarProps) {
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <nav aria-label={t("primary_navigation")} className="hidden lg:block">
      <ul className="flex items-center gap-5 text-sm text-muted">
        {siteConfig.primaryRoutes.map((route) => (
          <li key={route.key}>
            <Link href={route.internalPath} className="transition hover:text-accent">
              {t(`routes.${route.key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
