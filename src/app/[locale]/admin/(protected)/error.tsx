"use client";

type AdminProtectedErrorProps = {
  reset: () => void;
};

export default function AdminProtectedError({ reset }: AdminProtectedErrorProps) {
  return (
    <section className="admin-news-empty" role="alert">
      <h1>Impossible de charger cet élément.</h1>
      <p>Réessayez dans quelques instants.</p>
      <button className="admin-news-action" type="button" onClick={reset}>
        Réessayer
      </button>
    </section>
  );
}
