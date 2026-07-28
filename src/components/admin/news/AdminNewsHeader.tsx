import Link from "next/link";

export function AdminNewsHeader() {
  return (
    <section className="admin-news-header">
      <div>
        <p className="admin-section-kicker">Contenu</p>
        <h2>Actualités</h2>
        <p>Gérez les articles, brouillons et publications du site.</p>
      </div>
      <Link className="admin-news-new-button" href="/fr/admin/actualites/nouveau">
        Nouvel article
      </Link>
    </section>
  );
}
