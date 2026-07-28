"use client";

import { AdminBackButton } from "@/components/admin/common/AdminBackButton";

type RestaurantAdminErrorProps = {
  reset: () => void;
};

export default function RestaurantAdminError({ reset }: RestaurantAdminErrorProps) {
  return (
    <section className="admin-news-empty" role="alert">
      <h1>Impossible de charger cette carte.</h1>
      <p>Vérifiez votre connexion puis réessayez.</p>
      <div className="admin-news-actions">
        <button className="admin-news-action" type="button" onClick={reset}>
          Réessayer
        </button>
        <AdminBackButton className="admin-news-action" fallbackHref="/fr/admin/restaurant" />
      </div>
    </section>
  );
}
