import Link from "next/link";

export function AdminAccommodationsHeader() {
  return (
    <header className="admin-news-header">
      <div>
        <p className="admin-section-kicker">Hébergements</p>
        <h1>Hébergements</h1>
        <p>Gérez les chambres, studios et appartements affichés sur le site.</p>
      </div>
      <div className="admin-news-header-actions">
        <Link className="admin-news-new admin-news-secondary" href="/fr/admin/hebergements/caracteristiques">
          Caractéristiques
        </Link>
        <Link className="admin-news-new admin-news-primary" href="/fr/admin/hebergements/nouveau">
          <span aria-hidden="true">+</span>
          Nouvel hébergement
        </Link>
      </div>
    </header>
  );
}
