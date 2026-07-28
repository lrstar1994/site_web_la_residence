import Link from "next/link";

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="admin-action-icon">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function AdminRestaurantCategoriesHeader() {
  return (
    <header className="admin-news-header">
      <div>
        <p className="admin-section-kicker">Restaurant</p>
        <h1>Catégories du restaurant</h1>
        <p>Gérez les catégories utilisées par les filtres publics et les cartes du restaurant.</p>
      </div>
      <Link className="admin-news-new admin-news-primary" href="/fr/admin/restaurant/categories/nouveau">
        <PlusIcon />
        Nouvelle catégorie
      </Link>
    </header>
  );
}
