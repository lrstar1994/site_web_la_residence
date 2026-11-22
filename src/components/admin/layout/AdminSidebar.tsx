import Link from "next/link";
import { SHOP_ENABLED } from "@/config/features";

const futureItems = SHOP_ENABLED ? ["Boutique"] : [];

type AdminSidebarProps = {
  active: "home" | "news" | "events" | "quotes" | "accommodations" | "venues" | "restaurant";
  locale: "fr" | "en";
  canManageHomeHero: boolean;
};

export function AdminSidebar({ active, locale, canManageHomeHero }: AdminSidebarProps) {
  const adminBase = `/${locale}/admin`;

  return (
    <aside className="admin-sidebar" aria-label="Navigation administration">
      <Link className="admin-sidebar-brand" href={`${adminBase}/hebergements`} aria-label="Administration La Résidence Ankerana">
        <span>La Résidence Ankerana</span>
      </Link>
      <nav className="admin-sidebar-nav">
        {canManageHomeHero ? (
          <Link
            href={`${adminBase}/accueil/diaporama`}
            className={active === "home" ? "admin-sidebar-link active" : "admin-sidebar-link"}
          >
            {locale === "fr" ? "Diaporama de l’accueil" : "Homepage slideshow"}
          </Link>
        ) : null}
        <Link
          href={`${adminBase}/hebergements`}
          className={active === "accommodations" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Hébergements
        </Link>
        <Link
          href={`${adminBase}/salles`}
          className={active === "venues" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Salles
        </Link>
        <Link
          href={`${adminBase}/restaurant`}
          className={active === "restaurant" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Restaurant
        </Link>
        <Link
          href={`${adminBase}/evenements`}
          className={active === "events" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Prestations événementielles
        </Link>
        <Link
          href={`${adminBase}/demandes-de-devis`}
          className={active === "quotes" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Demandes de devis
        </Link>
        <Link
          href={`${adminBase}/actualites`}
          className={active === "news" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Actualités
        </Link>
        {futureItems.length > 0 ? (
          <div className="admin-sidebar-future" aria-label="Sections futures">
            {futureItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
