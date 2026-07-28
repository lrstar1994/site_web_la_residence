import Link from "next/link";
import { SHOP_ENABLED } from "@/config/features";

const futureItems = SHOP_ENABLED ? ["Boutique"] : [];

type AdminSidebarProps = {
  active: "news" | "events" | "quotes" | "accommodations" | "venues" | "restaurant";
};

export function AdminSidebar({ active }: AdminSidebarProps) {
  return (
    <aside className="admin-sidebar" aria-label="Navigation administration">
      <Link className="admin-sidebar-brand" href="/fr/admin/hebergements" aria-label="Administration La Résidence Ankerana">
        <span>La Résidence Ankerana</span>
      </Link>
      <nav className="admin-sidebar-nav">
        <Link
          href="/fr/admin/hebergements"
          className={active === "accommodations" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Hébergements
        </Link>
        <Link
          href="/fr/admin/salles"
          className={active === "venues" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Salles
        </Link>
        <Link
          href="/fr/admin/restaurant"
          className={active === "restaurant" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Restaurant
        </Link>
        <Link
          href="/fr/admin/evenements"
          className={active === "events" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Prestations événementielles
        </Link>
        <Link
          href="/fr/admin/demandes-de-devis"
          className={active === "quotes" ? "admin-sidebar-link active" : "admin-sidebar-link"}
        >
          Demandes de devis
        </Link>
        <Link
          href="/fr/admin/actualites"
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
