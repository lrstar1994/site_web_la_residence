import Link from "next/link";

export function AdminVenuesHeader() {
  return (
    <header className="admin-news-header">
      <div>
        <p className="admin-section-kicker">Salles</p>
        <h1>Salles</h1>
        <p>Gérez les espaces, galeries et configurations affichés sur le site.</p>
      </div>
      <div className="admin-news-header-actions">
        <Link className="admin-news-new admin-news-secondary" href="/fr/admin/salles/configurations">
          Configurations
        </Link>
        <Link className="admin-news-new admin-news-secondary" href="/fr/admin/salles/usages">
          Types d&apos;usage
        </Link>
        <Link className="admin-news-new admin-news-primary" href="/fr/admin/salles/nouveau">
          <span aria-hidden="true">+</span>
          Nouvelle salle
        </Link>
      </div>
    </header>
  );
}
