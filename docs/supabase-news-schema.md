# Schéma Supabase Actualités

Cette phase prépare les Actualités dans un schéma PostgreSQL dédié `site`. Les tables métier ne sont pas créées dans `public`.

## Objets créés

- `site.news_categories` : catégories stables des articles (`event`, `restaurant`, `venues`, `accommodation`, `offers`).
- `site.news_articles` : articles bilingues avec contenu texte, image, statut et date de publication.
- `site.set_updated_at()` : fonction réutilisable pour maintenir `updated_at`.

Les articles utilisent un champ technique `code` unique (`brunch`, `restaurant-menu`, `seminar`). Ce code n'est pas une URL publique.

## Statuts d'article

- `draft` : brouillon non public.
- `published` : visible publiquement si `published_at` est renseigné et inférieur ou égal à `now()`.
- `archived` : archivé non public.

## RLS

RLS est activé sur les deux tables.

- Les visiteurs `anon` et `authenticated` peuvent lire uniquement les catégories actives.
- Les visiteurs `anon` et `authenticated` peuvent lire uniquement les articles publiés, datés et non futurs.
- Aucun droit d'écriture public n'est accordé.
- `service_role` conserve les droits serveur nécessaires aux futures opérations d'administration sécurisées.

## Exposer le schéma `site`

Après application de la migration dans Supabase, exposer le schéma personnalisé :

Supabase Dashboard → Project Settings / API ou Integrations / Data API → Exposed schemas → ajouter `site`.

Sans cette étape, le client Supabase ne pourra pas interroger `site.news_categories` ou `site.news_articles` via la Data API.

## Fichiers

- Migration : `supabase/migrations/20260715190000_create_site_news_schema.sql`
- Données initiales : `supabase/seed.sql`

## Étapes manuelles prévues

1. Relire la migration SQL.
2. Appliquer la migration avec la méthode Supabase choisie.
3. Exécuter `supabase/seed.sql` pour insérer les catégories et les trois articles initiaux.
4. Ajouter `site` aux schémas exposés dans le Dashboard Supabase.
5. Plus tard, connecter Next.js avec `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Aucune clé `service_role` ne doit être exposée au frontend.
