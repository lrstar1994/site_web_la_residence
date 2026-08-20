import Link from "next/link";

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="admin-action-icon"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function AdminRestaurantGalleryHeader() {
  return (
    <header className="admin-news-header">
      <div>
        <p className="admin-section-kicker">
          Restaurant
        </p>

        <h1>
          Galerie du restaurant
        </h1>

        <p>
          Gérez les photos d’ambiance affichées sur la page du restaurant Le Privilège.
        </p>
      </div>

      <div className="admin-restaurant-header-actions">
        <Link
          className="admin-news-new"
          href="/fr/admin/restaurant"
        >
          Retour aux cartes
        </Link>

        <Link
          className="admin-news-new admin-news-primary"
          href="/fr/admin/restaurant/galerie/nouveau"
        >
          <PlusIcon />

          Ajouter une image
        </Link>
      </div>
    </header>
  );
}