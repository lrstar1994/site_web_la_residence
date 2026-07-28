import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { siteConfig } from "@/data/site";
import type { Locale } from "@/lib/i18n/routing";

type HeaderProps = {
  locale: Locale;
};

export async function Header({ locale }: HeaderProps) {
  const t = await getTranslations({ locale, namespace: "common" });
  const layout = await getTranslations({ locale, namespace: "layout" });
  const navItems = [
    {
      key: "home",
      label: t("routes.home"),
      href: siteConfig.homeRoute.paths[locale],
    },
    ...siteConfig.primaryRoutes.map((route) => ({
      key: route.key,
      label: t(`routes.${route.key}`),
      href: route.paths[locale],
    })),
  ];

  return (
    <header className="site-header">
      <Navbar
        locale={locale}
        navItems={navItems}
        reservationUrl={siteConfig.reservationUrl[locale]}
        labels={{
          logoAlt:
            locale === "fr"
              ? "Logo officiel La Résidence Ankerana"
              : "Official logo of La Résidence Ankerana",
          reservation: layout("reservation"),
          languageName: layout(`languages.${locale}`),
          menuOpen: layout("menu.open"),
          menuClose: layout("menu.close"),
          primaryNavigation: t("primary_navigation"),
        }}
      />
    </header>
  );
}
