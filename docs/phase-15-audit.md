# Phase 15 - Audit global du site dynamique

## Résumé

État général : le socle dynamique Supabase est cohérent. Les modules publics Actualités, Prestations événementielles, Hébergements, Salles et Restaurant utilisent des lectures serveur, et le back-office conserve des écritures via Server Actions, session SSR et RLS.

Problèmes trouvés : 4

Problèmes corrigés : 4

Problèmes critiques restants : aucun identifié pendant cet audit statique.

Points restant à surveiller : validation manuelle du rendu responsive et des parcours d'upload dans un navigateur local après application des migrations non encore poussées.

## Architecture Next.js

Sévérité : mineure  
Fichier concerné : `src/app/[locale]/actualites/[slug]/page.tsx`, `src/app/[locale]/boutique/[slug]/page.tsx`  
Problème : les routes temporaires de détail pouvaient être indexées alors que les actualités n'ont pas encore de page individuelle et que la Boutique reste temporaire.  
Correction appliquée : ajout de metadata `robots` en `noindex`, `nofollow`, `noarchive`.  
Validation : contrôle statique des routes temporaires.

Les modules serveur exclusifs disposent de `import "server-only"` sur les accès Supabase publics, les accès admin, `requireAdmin()` et le client serveur. Aucun import de `next/headers` n'a été trouvé dans les composants client.

## Supabase et RLS

Sévérité : mineure  
Fichier concerné : `supabase/migrations/*`  
Problème : audit demandé des politiques RLS et grants.  
Correction appliquée : aucune correction SQL nécessaire. Les politiques publiques restent limitées aux lignes actives ou publiées, les politiques admin passent par `site.is_active_admin()`, et aucune politique `delete` métier n'a été détectée.  
Validation : recherche statique des politiques `delete`, des grants et des fonctions partagées.

## Authentification

Sévérité : mineure  
Fichier concerné : `src/proxy.ts`, `src/lib/supabase/proxy.ts`, `src/lib/auth/require-admin.ts`  
Problème : vérification du flux SSR Auth et admin.  
Correction appliquée : aucune correction nécessaire. `proxy.ts` conserve `next-intl`, la redirection `/` vers `/fr` et le refresh Supabase. `requireAdmin()` utilise `auth.getUser()` puis `site.admin_users`.  
Validation : lecture des fichiers et contrôle des chemins admin FR/EN.

## Storage

Sévérité : mineure  
Fichier concerné : `supabase/migrations/20260716090000_create_news_storage.sql`, helpers d'upload admin  
Problème : audit des droits Storage et de la validation d'images.  
Correction appliquée : aucune correction nécessaire. Le bucket `site-news` reste public en lecture, l'upload/update est réservé aux admins actifs, sans politique de suppression.  
Validation : contrôle statique des politiques et conventions de dossiers.

## Pages publiques

Sévérité : mineure  
Fichier concerné : `src/data/site.ts`, `src/app/sitemap.ts` indirectement  
Problème : la Boutique temporaire était encore incluse dans les routes SEO utilisées par le sitemap.  
Correction appliquée : exclusion de la route `boutique` de `siteConfig.seoRoutes` tout en conservant `primaryRoutes` pour la navigation existante.  
Validation : contrôle de `siteConfig.seoRoutes`.

## Back-office

Sévérité : mineure  
Fichier concerné : composants sous `src/components/admin/*`  
Problème : audit des écritures et du découpage client/serveur.  
Correction appliquée : aucune correction nécessaire. Les occurrences `insert()` et `update()` sont dans les fichiers serveur ou Server Actions. Les occurrences dans les composants sont des mises à jour d'état local.  
Validation : recherche statique dans `src/components` et `src/lib/admin`.

## SEO

Sévérité : importante  
Fichier concerné : `src/lib/seo/schema.ts`  
Problème : des chaînes JSON-LD contenaient des caractères accentués corrompus.  
Correction appliquée : correction des textes SEO/JSON-LD concernés en UTF-8 propre.  
Validation : script UTF-8 et contrôle TypeScript.

Sévérité : mineure  
Fichier concerné : `src/app/[locale]/boutique/page.tsx`  
Problème : page temporaire Boutique indexable.  
Correction appliquée : ajout de metadata `robots` noindex sur la page temporaire.  
Validation : lecture statique de la metadata.

## JSON-LD

Sévérité : importante  
Fichier concerné : `src/lib/seo/schema.ts`  
Problème : mojibake dans des libellés JSON-LD et risque de données mal affichées par les moteurs.  
Correction appliquée : correction des libellés corrompus. Le Restaurant ne contient pas de prix inventé.  
Validation : script UTF-8 et recherche des champs tarifaires Restaurant.

## Accessibilité

Sévérité : mineure  
Fichier concerné : composants publics et admin  
Problème : audit des modales, boutons, formulaires et messages.  
Correction appliquée : aucune correction de structure nécessaire pendant cet audit. Les composants existants conservent labels, textes de badges et confirmations accessibles.  
Validation : contrôle statique des composants principaux.

## Responsive

Sévérité : mineure  
Fichier concerné : composants publics et admin  
Problème : audit demandé des layouts mobiles.  
Correction appliquée : aucune modification CSS nécessaire pendant cet audit. Les corrections précédentes sur les listes admin et boutons de création sont conservées.  
Validation : contrôle statique. Une vérification visuelle locale reste recommandée.

## Encodage UTF-8

Sévérité : importante  
Fichier concerné : `src/lib/seo/schema.ts`, `src/app/[locale]/admin/(protected)/layout.tsx`  
Problème : mojibake SEO/JSON-LD et BOM UTF-8 détectés.  
Correction appliquée : correction des chaînes corrompues et suppression des BOM.  
Validation : `node scripts/check-utf8.mjs`.

Sévérité : mineure  
Fichier concerné : `scripts/check-utf8.mjs`  
Problème : absence de script local pour détecter UTF-8 invalide, BOM et mojibake courant.  
Correction appliquée : création du script de contrôle UTF-8.  
Validation : script exécuté avec succès.

## Performance

Sévérité : mineure  
Fichier concerné : fonctions publiques Supabase  
Problème : audit des requêtes publiques.  
Correction appliquée : aucune correction nécessaire. Les fonctions chargent les données par lots, trient de manière stable et évitent les fallbacks statiques silencieux.  
Validation : lecture des fonctions `get-published-news`, `get-event-services`, `get-accommodations`, `get-venues`, `get-restaurant-menus`.

## Sécurité

Sévérité : mineure  
Fichier concerné : application et migrations  
Problème : audit des clés et logs sensibles.  
Correction appliquée : aucune correction nécessaire. Aucune clé `service_role` n'est utilisée dans l'application. Les références `service_role` restantes sont limitées aux grants SQL et à la documentation.  
Validation : recherche statique des variables et chaînes sensibles.

## Migrations

Sévérité : mineure  
Fichier concerné : `supabase/migrations/20260716160000_automatic_sort_orders.sql`  
Problème : audit de l'ordre automatique.  
Correction appliquée : aucune correction nécessaire. La fonction `site.set_next_sort_order()` utilise `max(sort_order) + 10`, un trigger `before insert`, du SQL dynamique quoté et un verrou advisory par table.  
Validation : lecture de la migration et contrôle de la liste des triggers.

Aucune migration corrective n'a été créée pendant cette phase. Aucune migration distante n'a été exécutée.
