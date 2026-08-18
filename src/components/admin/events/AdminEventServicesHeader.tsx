import Link from "next/link";

export function AdminEventServicesHeader() {
  return (
    <section className="admin-news-header">
      <div>
        <p className="admin-section-kicker">
          Événements
        </p>

        <h2>Prestations événementielles</h2>

        <p>
          Gérez les prestations affichées sur la page Événements.
        </p>
      </div>

      <div className="admin-events-header-actions">
        <Link
          className="admin-events-gallery-button"
          href="/fr/admin/evenements/galerie"
        >
          Galerie d’images
        </Link>

        <Link
          className="admin-news-new-button"
          href="/fr/admin/evenements/nouveau"
        >
          Nouvelle prestation
        </Link>
      </div>
    </section>
  );
}