import Link from "next/link";

export function AdminEventServicesHeader() {
  return (
    <section className="admin-news-header">
      <div>
        <p className="admin-section-kicker">Événements</p>
        <h2>Prestations événementielles</h2>
        <p>Gérez les prestations affichées sur la page Événements.</p>
      </div>
      <Link className="admin-news-new-button" href="/fr/admin/evenements/nouveau">
        Nouvelle prestation
      </Link>
    </section>
  );
}
