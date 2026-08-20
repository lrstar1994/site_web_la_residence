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

function GalleryIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="admin-action-icon"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
      />

      <circle
        cx="8.5"
        cy="9"
        r="1.5"
      />

      <path d="M4 17l5-5 4 4 2.5-2.5L20 18" />
    </svg>
  );
}

export function AdminRestaurantMenusHeader() {
  return (
    <header className="admin-news-header">
      <div>
        <p className="admin-section-kicker">
          Restaurant
        </p>

        <h1>
          Cartes du restaurant
        </h1>

        <p>
          Gérez les cartes, catégories et images du
          restaurant Le Privilège.
        </p>
      </div>

      <div className="admin-restaurant-header-actions">
        <Link
          className="admin-news-new"
          href="/fr/admin/restaurant/galerie"
        >
          <GalleryIcon />

          Galerie du restaurant
        </Link>

        <Link
          className="admin-news-new admin-news-primary"
          href="/fr/admin/restaurant/nouveau"
        >
          <PlusIcon />

          Nouvelle carte
        </Link>
      </div>
    </header>
  );
}